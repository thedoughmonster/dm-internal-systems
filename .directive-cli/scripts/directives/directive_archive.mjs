#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { resolveDirectiveContext, writeJson, toUtcIso } from "./_directive_helpers.mjs";
import { log, runGit, currentBranch, branchExistsLocal, changedFiles } from "./_git_helpers.mjs";
import { getDirectivesRoot } from "./_session_resolver.mjs";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const t = argv[i];
    if (!t.startsWith("--")) continue;
    const k = t.slice(2);
    const n = argv[i + 1];
    if (!n || n.startsWith("--")) args[k] = true;
    else {
      args[k] = n;
      i += 1;
    }
  }
  return args;
}

function usage() {
  return "Usage: node .directive-cli/scripts/directives/directive_archive.mjs --session <id> [--dry-run]";
}

function slugify(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function archiveBranchName(session) {
  const slug = slugify(session) || "directive";
  return `chore/archive-${slug}`;
}

function colorizeRed(text) {
  if (!stdout.isTTY || process.env.NO_COLOR) return text;
  return `\x1b[31m${text}\x1b[0m`;
}

function isArchivedStatus(status) {
  return ["archived", "done", "completed", "cancelled"].includes(String(status || "").trim().toLowerCase());
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

async function resolveSession(args) {
  const explicit = String(args.session || args.guid || "").trim();
  if (explicit) return explicit;
  if (!stdin.isTTY) {
    throw new Error("Missing required --session");
  }

  const directives = listDirectiveSessions();
  if (directives.length === 0) throw new Error("No available non-archived directives found.");
  process.stdout.write("Available directives:\n");
  for (let i = 0; i < directives.length; i += 1) {
    const d = directives[i];
    process.stdout.write(`  ${i + 1}) ${d.session}  [${d.status}]  ${d.title}\n`);
  }
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const input = (await rl.question("Select directive number (required): ")).trim();
    if (!input) throw new Error("Missing required directive selection.");
    if (/^\d+$/.test(input)) {
      const idx = Number(input);
      if (idx < 1 || idx > directives.length) throw new Error("Invalid directive selection.");
      return directives[idx - 1].session;
    }
    const match = directives.find((d) => d.session === input);
    if (!match) throw new Error("Invalid directive selection.");
    return match.session;
  } finally {
    rl.close();
  }
}

async function confirmArchive(session, dryRun) {
  const warning = colorizeRed(`WARNING: You are about to archive directive '${session}'.`);
  process.stdout.write(`${warning}\n`);
  if (dryRun || !stdin.isTTY) return;
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const input = (await rl.question("Type 'archive' to confirm: ")).trim().toLowerCase();
    if (input !== "archive") throw new Error("Archive aborted by user.");
  } finally {
    rl.close();
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const session = await resolveSession(args);
  const dryRun = Boolean(args["dry-run"]);

  const { repoRoot, directiveMetaPath, directiveDoc } = resolveDirectiveContext(session);
  const sessionDir = path.dirname(directiveMetaPath);
  const nextUpdated = toUtcIso();
  const branch = archiveBranchName(session);
  const commitMsg = `chore(directive): archive ${session}`;
  const sessionRel = path.relative(repoRoot, sessionDir).replace(/\\/g, "/");
  const directiveRel = path.relative(repoRoot, directiveMetaPath).replace(/\\/g, "/");

  log("DIR", `Directive archive: ${session}`);
  await confirmArchive(session, dryRun);

  if (String(directiveDoc.meta?.status || "").toLowerCase() === "archived") {
    throw new Error(`Directive is already archived: ${session}`);
  }

  if (dryRun) {
    log("GIT", `[dry-run] require current branch dev`);
    log("GIT", `[dry-run] allow dirty files only under ${sessionRel}/`);
    log("GIT", `[dry-run] checkout -b ${branch} dev`);
    log("DIR", `[dry-run] would set ${path.basename(directiveMetaPath)} meta.status=archived meta.bucket=archived meta.updated=${nextUpdated}`);
    log("GIT", `[dry-run] git add ${sessionRel}`);
    log("GIT", `[dry-run] git commit -m "${commitMsg}"`);
    log("GIT", `[dry-run] checkout dev`);
    log("GIT", `[dry-run] merge --no-ff ${branch}`);
    log("GIT", `[dry-run] branch -D ${branch}`);
    log("GIT", `[dry-run] verify current branch is dev`);
    return;
  }

  const startBranch = currentBranch(repoRoot);
  if (startBranch !== "dev") {
    throw new Error(`Archive flow must start on 'dev' (current: '${startBranch}').`);
  }

  const dirty = changedFiles(repoRoot).map((p) => p.replace(/\\/g, "/"));
  const unrelated = dirty.filter((p) => p !== directiveRel && !p.startsWith(`${sessionRel}/`));
  if (unrelated.length > 0) {
    throw new Error(
      `Archive blocked: unrelated dirty files present:\n${unrelated.map((f) => `  - ${f}`).join("\n")}`,
    );
  }
  if (branchExistsLocal(branch, repoRoot)) {
    throw new Error(`Archive branch already exists: ${branch}`);
  }

  try {
    log("GIT", `Creating archive branch ${branch}`);
    runGit(["checkout", "-b", branch, "dev"], repoRoot);

    directiveDoc.meta = directiveDoc.meta || {};
    directiveDoc.meta.status = "archived";
    directiveDoc.meta.bucket = "archived";
    directiveDoc.meta.updated = nextUpdated;
    writeJson(directiveMetaPath, directiveDoc);
    log("DIR", `Archived metadata in ${path.basename(directiveMetaPath)}`);

    runGit(["add", sessionRel], repoRoot);
    runGit(["commit", "-m", commitMsg], repoRoot);

    log("GIT", "Merging archive branch into dev");
    runGit(["checkout", "dev"], repoRoot);
    runGit(["merge", "--no-ff", branch, "-m", `merge: ${commitMsg}`], repoRoot);
    runGit(["branch", "-D", branch], repoRoot);
    const endingBranch = currentBranch(repoRoot);
    if (endingBranch !== "dev") {
      throw new Error(`Archive flow ended on '${endingBranch}' instead of 'dev'.`);
    }
    log("DIR", `Directive archived and merged to dev: ${session}`);
  } catch (error) {
    const current = currentBranch(repoRoot);
    const recovery = [
      `Archive flow failed for '${session}'.`,
      `Current branch: ${current}`,
      `Recovery steps:`,
      `  git status --short`,
      current === "dev" ? "" : `  git checkout dev`,
      `  git branch -D ${branch}   # only if branch is unneeded`,
      `  # Directive files remain at: ${sessionRel}`,
    ].filter(Boolean).join("\n");
    throw new Error(`${error.message}\n${recovery}`);
  }
}

try {
  await main();
} catch (error) {
  if (/Missing required --session/.test(String(error && error.message))) {
    process.stderr.write(`${usage()}\n`);
  }
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
