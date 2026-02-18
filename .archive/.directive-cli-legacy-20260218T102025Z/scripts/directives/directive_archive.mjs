#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { stdin, stdout } from "node:process";
import { resolveDirectiveContext, writeJson, toUtcIso, lifecycleAlwaysAllowedDirtyPrefixes } from "./_directive_helpers.mjs";
import { log, ensureCleanWorkingTree } from "./_git_helpers.mjs";
import { getDirectivesRoot } from "./_session_resolver.mjs";
import { selectOption, selectMultiOption } from "./_prompt_helpers.mjs";
import { directiveListLabel, statusColor } from "./_list_view_component.mjs";

function parseArgs(argv) {
  const args = { session: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const t = argv[i];
    if (!t.startsWith("--")) continue;
    const k = t.slice(2);
    const n = argv[i + 1];
    if (k === "session") {
      if (!n || n.startsWith("--")) args.session.push("");
      else {
        args.session.push(n);
        i += 1;
      }
      continue;
    }
    if (!n || n.startsWith("--")) args[k] = true;
    else {
      args[k] = n;
      i += 1;
    }
  }
  return args;
}

function usage() {
  return "Usage: node .directive-cli/scripts/directives/directive_archive.mjs --session <id[,id2,...]> [--session <id> ...] [--multi] [--dry-run] [--help]";
}

function colorize(color, text) {
  if (!stdout.isTTY || process.env.NO_COLOR) return text;
  const map = {
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    reset: "\x1b[0m",
  };
  const code = map[color] || "";
  if (!code) return text;
  return `${code}${text}${map.reset}`;
}

function badge(level, lines, color = "yellow") {
  const items = Array.isArray(lines) ? lines : [String(lines || "")];
  const clean = items.map((l) => String(l || ""));
  const header = ` ${String(level || "NOTICE").toUpperCase()} `;
  const width = Math.max(header.length, ...clean.map((l) => l.length));
  const top = `+${"=".repeat(width + 2)}+`;
  const headerLine = `| ${header.padEnd(width, " ")} |`;
  const sep = `+${"-".repeat(width + 2)}+`;
  const body = clean.map((l) => `| ${l.padEnd(width, " ")} |`).join("\n");
  const bottom = top;
  return colorize(color, `${top}\n${headerLine}\n${sep}\n${body}\n${bottom}`);
}

function isArchivedStatus(status) {
  return ["archived"].includes(String(status || "").trim().toLowerCase());
}

function listDirectiveSessions() {
  const base = getDirectivesRoot();
  if (!fs.existsSync(base)) return [];
  const sessions = fs
    .readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const out = [];
  for (const session of sessions) {
    const sessionDir = path.join(base, session);
    const metaFile = fs.readdirSync(sessionDir).find((f) => f.endsWith(".meta.json"));
    if (!metaFile) continue;
    try {
      const doc = JSON.parse(fs.readFileSync(path.join(sessionDir, metaFile), "utf8"));
      const meta = doc && doc.meta ? doc.meta : {};
      if (isArchivedStatus(meta.status)) continue;
      out.push({
        session,
        title: String(meta.title || metaFile.replace(/\.meta\.json$/u, "")),
        status: String(meta.status || "todo"),
      });
    } catch {
      // skip invalid entries
    }
  }
  return out;
}

function parseSessionList(values, guid) {
  const out = [];
  const rawList = Array.isArray(values) ? values : [];
  for (const entry of rawList) {
    const parts = String(entry || "")
      .split(",")
      .map((v) => String(v || "").trim())
      .filter(Boolean);
    out.push(...parts);
  }
  if (guid) out.push(String(guid).trim());
  return Array.from(new Set(out));
}

async function resolveSessions(args) {
  const explicit = parseSessionList(args.session, args.guid);
  if (explicit.length > 0) return explicit;
  if (!stdin.isTTY) {
    throw new Error("Missing required --session");
  }

  const directives = listDirectiveSessions();
  if (directives.length === 0) throw new Error("No available non-archived directives found.");
  if (args.multi) {
    const chosen = await selectMultiOption({
      input: stdin,
      output: stdout,
      label: "Select directive(s) to archive:",
      options: directives.map((d) => ({
        label: directiveListLabel(d),
        color: statusColor(d.status),
        value: d.session,
      })),
      defaultSelectedValues: [],
    });
    if (!Array.isArray(chosen) || chosen.length === 0) throw new Error("Archive aborted: no directives selected.");
    return chosen;
  }

  const single = await selectOption({
    input: stdin,
    output: stdout,
    label: "Select directive to archive:",
    options: directives.map((d) => ({
      label: directiveListLabel(d),
      color: statusColor(d.status),
      value: d.session,
    })),
    defaultIndex: 0,
  });
  return [single];
}

async function confirmArchive(sessions, dryRun) {
  const list = Array.isArray(sessions) ? sessions : [String(sessions || "")];
  const headline = list.length === 1
    ? `You are about to archive directive: ${list[0]}`
    : `You are about to archive ${list.length} directives`;
  const lines = [headline, ...list.slice(0, 8).map((s) => `- ${s}`)];
  if (list.length > 8) lines.push(`- ... ${list.length - 8} more`);
  lines.push("This updates metadata only. Git operations are manual.");
  process.stdout.write(`${badge("warning", lines, "yellow")}\n`);
  if (dryRun || !stdin.isTTY) return;
  const decision = await selectOption({
    input: stdin,
    output: stdout,
    label: "Archive confirmation:",
    options: [
      { label: "Archive now", value: "archive" },
      { label: "Cancel", value: "cancel" },
    ],
    defaultIndex: 1,
  });
  if (decision !== "archive") {
    throw new Error("Archive aborted by user.");
  }
}

async function archiveOne(session, { dryRun }) {
  const { repoRoot, directiveMetaPath, directiveDoc } = resolveDirectiveContext(session);
  const nextUpdated = toUtcIso();

  log("DIR", `Directive archive: ${session}`);

  if (String(directiveDoc.meta?.status || "").toLowerCase() === "archived") {
    throw new Error(`Directive is already archived: ${session}`);
  }

  if (dryRun) {
    log("DIR", `[dry-run] would set ${path.basename(directiveMetaPath)} meta.status=archived meta.bucket=archived meta.updated=${nextUpdated}`);
    log("GIT", "[dry-run] no git actions (manual git required)");
    return;
  }

  ensureCleanWorkingTree(repoRoot, { allow: lifecycleAlwaysAllowedDirtyPrefixes() });
  directiveDoc.meta = directiveDoc.meta || {};
  directiveDoc.meta.status = "archived";
  directiveDoc.meta.bucket = "archived";
  directiveDoc.meta.updated = nextUpdated;
  writeJson(directiveMetaPath, directiveDoc);
  log("DIR", `Archived metadata in ${path.basename(directiveMetaPath)}`);
  log("GIT", "No git actions executed by dc. Operator must commit/push/merge manually.");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(`${usage()}\n`);
    process.exit(0);
  }
  const sessions = await resolveSessions(args);
  const dryRun = Boolean(args["dry-run"]);
  await confirmArchive(sessions, dryRun);
  for (const session of sessions) {
    await archiveOne(session, { dryRun });
  }
}

try {
  await main();
} catch (error) {
  if (/Missing required --session/.test(String(error && error.message))) {
    process.stderr.write(`${usage()}\n`);
  }
  process.stderr.write(`${badge("error", [String(error && error.message ? error.message : "Unknown error")], "red")}\n`);
  process.exit(1);
}
