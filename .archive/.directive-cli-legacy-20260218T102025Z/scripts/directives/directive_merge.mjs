#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { stdin, stdout } from "node:process";
import { resolveDirectiveContext, toUtcIso, writeJson } from "./_directive_helpers.mjs";
import { alert, branchExistsLocal, branchExistsRemote, currentBranch, ensureCleanWorkingTree, log, runGit } from "./_git_helpers.mjs";
import { getDirectivesRoot } from "./_session_resolver.mjs";
import { selectOption } from "./_prompt_helpers.mjs";
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
  return "Usage: node .directive-cli/scripts/directives/directive_merge.mjs --session <id> [--dry-run] [--help]";
}

function parseSessionList(values, guid) {
  const out = [];
  for (const entry of Array.isArray(values) ? values : []) {
    const parts = String(entry || "")
      .split(",")
      .map((v) => String(v || "").trim())
      .filter(Boolean);
    out.push(...parts);
  }
  if (guid) out.push(String(guid).trim());
  return Array.from(new Set(out));
}

function isMergedInto(base, sourceRef, cwd) {
  const result = runGit(["merge-base", "--is-ancestor", sourceRef, base], cwd, { allowFail: true });
  return result.status === 0;
}

function listMergeCandidates() {
  const root = getDirectivesRoot();
  if (!fs.existsSync(root)) return [];
  const sessions = fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
  const rows = [];
  for (const session of sessions) {
    try {
      const { repoRoot, directiveMetaPath, directiveDoc } = resolveDirectiveContext(session);
      const meta = directiveDoc.meta || {};
      const branch = String(meta.directive_branch || "").trim();
      const base = String(meta.directive_base_branch || "dev").trim() || "dev";
      if (!branch) continue;
      const local = branchExistsLocal(branch, repoRoot);
      const remote = branchExistsRemote(branch, repoRoot);
      const sourceRef = local ? branch : (remote ? `origin/${branch}` : "");
      if (!sourceRef) continue;
      rows.push({
        session,
        title: String(meta.title || path.basename(directiveMetaPath)),
        status: String(meta.status || "todo"),
        branch,
        base,
        merged: isMergedInto(base, sourceRef, repoRoot),
      });
    } catch {
      // skip invalid entries
    }
  }
  return rows;
}

async function resolveSession(args) {
  const explicit = parseSessionList(args.session, args.guid);
  if (explicit.length > 0) return explicit[0];
  if (!stdin.isTTY) throw new Error("Missing required --session");
  const candidates = listMergeCandidates();
  if (candidates.length === 0) throw new Error("No merge candidates found.");
  return await selectOption({
    input: stdin,
    output: stdout,
    label: "Select directive to check/mark merged:",
    options: candidates.map((c) => ({
      label: directiveListLabel(c),
      color: statusColor(c.status),
      value: c.session,
    })),
    defaultIndex: 0,
  });
}

function resolveSourceRef(repoRoot, branch) {
  if (branchExistsLocal(branch, repoRoot)) return branch;
  if (branchExistsRemote(branch, repoRoot)) return `origin/${branch}`;
  return "";
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(`${usage()}\n`);
    process.exit(0);
  }

  const session = await resolveSession(args);
  const dryRun = Boolean(args["dry-run"]);
  const { repoRoot, directiveMetaPath, directiveDoc } = resolveDirectiveContext(session);
  const meta = directiveDoc.meta || {};
  const branch = String(meta.directive_branch || "").trim();
  const base = String(meta.directive_base_branch || "dev").trim() || "dev";
  if (!branch) throw new Error("Directive metadata missing directive_branch.");

  const sourceRef = resolveSourceRef(repoRoot, branch);
  if (!sourceRef) throw new Error(`Cannot find directive branch '${branch}' locally or on origin.`);

  if (!dryRun) ensureCleanWorkingTree(repoRoot);

  const nowBranch = currentBranch(repoRoot);
  if (nowBranch !== base) {
    throw new Error(
      `Current branch '${nowBranch}' does not match base '${base}'.\n` +
      `Manual git required before retry:\n  git checkout ${base}`,
    );
  }

  const merged = isMergedInto(base, sourceRef, repoRoot);
  if (!merged) {
    throw new Error(
      `Directive branch '${sourceRef}' is not merged into '${base}'.\n` +
      "Manual git required:\n" +
      `  git merge --no-ff ${sourceRef}\n` +
      `  git push origin ${base}\n` +
      `Then rerun: dc directive merge --session ${session}`,
    );
  }

  if (dryRun) {
    log("DIR", `[dry-run] would set directive_merge_status=merged in ${path.basename(directiveMetaPath)}`);
    log("GIT", "[dry-run] no git actions (manual git required)");
    return;
  }

  const prevStatus = String(directiveDoc.meta.directive_merge_status || "").trim().toLowerCase();
  if (prevStatus === "merged") {
    log("DIR", `directive_merge_status already merged: ${session}`);
    return;
  }

  directiveDoc.meta.directive_merge_status = "merged";
  directiveDoc.meta.updated = toUtcIso();
  writeJson(directiveMetaPath, directiveDoc);
  log("DIR", `Updated directive_merge_status=merged for ${session}`);
  log("GIT", "No git actions executed by dc. Operator must commit metadata manually.");
}

try {
  await main();
} catch (error) {
  if (/Missing required --session/.test(String(error && error.message))) {
    process.stderr.write(`${usage()}\n`);
  }
  alert("error", String(error && error.message ? error.message : "Unknown error"), { color: "red" });
  process.exit(1);
}
