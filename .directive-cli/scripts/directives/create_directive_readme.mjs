#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  getDirectivesRoot,
  getRepoRoot,
  assertInside,
  isUuid,
  generateSessionDirName,
  listSessions,
} from "./_session_resolver.mjs";

function toUtcIso() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseArgs(argv) {
  const args = { goal: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (key === "goal") {
      if (!next || next.startsWith("--")) {
        args.goal.push("");
      } else {
        args.goal.push(String(next));
        i += 1;
      }
      continue;
    }
    if (!next || next.startsWith("--")) args[key] = true;
    else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

const BRANCH_TYPE_VALUES = new Set(["feature", "chore", "hotfix", "fix", "release"]);

function normalizeBranchType(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  if (raw === "feat") return "feature";
  return raw;
}

function nextAvailableSessionName(directivesRoot, baseName) {
  if (!fs.existsSync(path.join(directivesRoot, baseName))) return baseName;
  let n = 2;
  while (true) {
    const candidate = `${baseName}-${n}`;
    if (!fs.existsSync(path.join(directivesRoot, candidate))) return candidate;
    n += 1;
  }
}

function usage() {
  return [
    "Usage:",
    "  node .directive-cli/scripts/directives/create_directive_readme.mjs [options]",
    "",
    "Options:",
    "  --session <name>                 Explicit session directory name",
    "  --id <uuid>                      Stable directive UUID (meta.id)",
    "  --guid <uuid>                    Legacy alias for --id",
    "  --directive-slug <slug>          Filename slug for <directive_slug>.meta.json",
    "  --title <text>                   Directive title (default: prompted)",
    "  --summary <text>                 One-line summary (default: prompted)",
    "  --goal <text>                    Goal line (repeatable; prompts when interactive)",
    "  --branch-type <type>             feature|chore|hotfix|fix|release (default: prompted/feature)",
    "  --directive-branch <name>        Branch name (default: <branch-type>/<directive-slug>)",
    "  --directive-base-branch <name>   Base branch (default: dev)",
    "  --owner <name>                   Owner metadata (default: operator)",
    "  --assignee <name>                Assignee metadata (default: null)",
    "  --priority <level>               urgent|high|medium|low (default: medium)",
    "  --session-priority <level>       urgent|high|medium|low (default: medium)",
    "  --effort <size>                  small|medium|large (default: medium)",
    "  --commit-policy <policy>         per_task|per_collection|end_of_directive (default: end_of_directive)",
    "  --source <role>                  Metadata source (default: architect)",
    "  --scope <name>                   Metadata scope (default: directives)",
    "  --no-git                         Disable auto branch/commit/merge workflow",
    "  --no-prompt                      Disable prompts for missing title/summary",
    "  --dry-run                        Print output path and content only",
    "  --help                           Show this help",
    "",
    "Default session naming:",
    "  YY-MM-DD_<slug> in UTC (auto-suffixed with -2, -3, ... when needed)",
  ].join("\n");
}

function runGit(args, cwd, { allowFail = false } = {}) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (!allowFail && result.status !== 0) {
    const msg = (result.stderr || result.stdout || "git command failed").trim();
    throw new Error(msg);
  }
  return result;
}

function currentBranch(cwd) {
  const result = runGit(["rev-parse", "--abbrev-ref", "HEAD"], cwd);
  return String(result.stdout || "").trim();
}

function ensureCleanWorkingTree(cwd) {
  const result = runGit(["status", "--porcelain"], cwd);
  const dirty = String(result.stdout || "").trim();
  if (dirty) throw new Error("Working tree must be clean before creating a directive with auto-git.");
}

function branchExistsLocal(branch, cwd) {
  const result = runGit(["show-ref", "--verify", `refs/heads/${branch}`], cwd, { allowFail: true });
  return result.status === 0;
}

function archiveBranchName(sessionName) {
  const slug = String(sessionName || "").toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
  return `chore/directive-new-${slug}`;
}

async function resolvePromptedValue(args) {
  let title = args.title ? String(args.title).trim() : "";
  let summary = args.summary ? String(args.summary).trim() : "";
  let branchType = normalizeBranchType(args["branch-type"] || "");
  const goals = Array.isArray(args.goal)
    ? args.goal.map((g) => String(g || "").trim()).filter(Boolean)
    : [];

  if (!args["no-prompt"] && stdin.isTTY) {
    const rl = createInterface({ input: stdin, output: stdout });
    if (!title) title = (await rl.question("Directive title: ")).trim();
    if (!summary) summary = (await rl.question("Directive summary (one line): ")).trim();
    if (!args["directive-branch"] && !branchType) {
      const prompt = "Branch type (feature|chore|hotfix|fix|release) [feature]: ";
      const answer = normalizeBranchType(await rl.question(prompt));
      branchType = answer || "feature";
    }
    if (goals.length === 0) {
      process.stdout.write("Add directive goals, one per line (blank line to finish).\n");
      while (true) {
        const goal = (await rl.question(`Goal ${goals.length + 1}: `)).trim();
        if (!goal) break;
        goals.push(goal);
      }
    }
    rl.close();
  }
  return {
    title: title || "new directive",
    summary: summary || "Define and execute the next verified directive scope.",
    goals,
    branchType: branchType || "feature",
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(`${usage()}\n`);
    process.exit(0);
  }

  const now = toUtcIso();
  const prompted = await resolvePromptedValue(args);
  const title = prompted.title;
  const summary = prompted.summary;
  const titleSlug = slugify(title) || "directive";
  const branchType = normalizeBranchType(prompted.branchType || args["branch-type"] || "");
  if (branchType && !BRANCH_TYPE_VALUES.has(branchType)) {
    process.stderr.write(`Invalid --branch-type value: ${branchType}\n`);
    process.exit(1);
  }

  const directiveId = String(args.id || args.guid || randomUUID()).trim();
  if (!isUuid(directiveId)) {
    process.stderr.write(`Invalid --id/--guid value (expected UUID): ${directiveId}\n`);
    process.exit(1);
  }

  const directivesRoot = getDirectivesRoot();
  const sessionInput = String(args.session || "").trim();
  const sessionBase = sessionInput || generateSessionDirName(title);
  const sessionName = sessionInput === "" ? nextAvailableSessionName(directivesRoot, sessionBase) : sessionBase;
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(sessionName)) {
    process.stderr.write(`Invalid --session value: ${sessionName}\n`);
    process.exit(1);
  }

  const directiveSlug = String(args["directive-slug"] || titleSlug).trim();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(directiveSlug)) {
    process.stderr.write(`Invalid --directive-slug value: ${directiveSlug}\n`);
    process.exit(1);
  }

  const doc = {
    kind: "directive_session_meta",
    schema_version: "1.0",
    meta: {
      id: directiveId,
      directive_slug: directiveSlug,
      status: "todo",
      owner: String(args.owner || "operator"),
      assignee: args.assignee ? String(args.assignee) : null,
      priority: String(args.priority || "medium"),
      session_priority: String(args["session-priority"] || "medium"),
      auto_run: false,
      tags: ["needs-triage"],
      created: now,
      updated: now,
      bucket: "active",
      scope: String(args.scope || "directives"),
      source: String(args.source || "architect"),
      effort: String(args.effort || "medium"),
      depends_on: [],
      blocked_by: [],
      related: [],
      title,
      summary,
      goals: prompted.goals,
      directive_branch: String(args["directive-branch"] || `${branchType || "feature"}/${directiveSlug}`),
      directive_base_branch: String(args["directive-base-branch"] || "dev"),
      directive_merge_status: "open",
      commit_policy: String(args["commit-policy"] || "end_of_directive"),
    },
  };

  const sessionDir = path.join(directivesRoot, sessionName);
  const metaPath = path.join(sessionDir, `${directiveSlug}.meta.json`);
  try {
    assertInside(directivesRoot, sessionDir);
    assertInside(sessionDir, metaPath);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }

  const duplicateId = listSessions().find((s) => s.meta && String(s.meta.id || "") === directiveId);
  if (duplicateId) {
    process.stderr.write(`Directive UUID already exists in another session directory: ${duplicateId.name}\n`);
    process.exit(1);
  }

  if (args["dry-run"]) {
    process.stdout.write(`[dry-run] session: ${sessionName}\n`);
    process.stdout.write(`[dry-run] metadata: ${metaPath}\n\n`);
    process.stdout.write(`${JSON.stringify(doc, null, 2)}\n`);
    process.exit(0);
  }

  if (fs.existsSync(sessionDir)) {
    process.stderr.write(`Session directory already exists: ${sessionDir}\n`);
    process.exit(1);
  }
  const autoGit = !args["no-git"];
  const repoRoot = getRepoRoot();
  const relSessionDir = path.relative(repoRoot, sessionDir).replace(/\\/g, "/");
  const flowBranch = archiveBranchName(sessionName);
  const commitMsg = `chore(directive): create ${sessionName}`;

  if (autoGit) {
    ensureCleanWorkingTree(repoRoot);
    const branch = currentBranch(repoRoot);
    if (branch !== "dev") {
      throw new Error(`Directive creation with auto-git must start on 'dev' (current: '${branch}').`);
    }
    if (branchExistsLocal(flowBranch, repoRoot)) {
      throw new Error(`Auto-git branch already exists: ${flowBranch}`);
    }
    runGit(["checkout", "-b", flowBranch, "dev"], repoRoot);
  }

  try {
    fs.mkdirSync(sessionDir, { recursive: true });
    fs.writeFileSync(metaPath, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
    process.stdout.write(`Created ${metaPath}\n`);

    if (autoGit) {
      runGit(["add", "-f", relSessionDir], repoRoot);
      runGit(["commit", "-m", commitMsg], repoRoot);
      runGit(["checkout", "dev"], repoRoot);
      runGit(["merge", "--no-ff", flowBranch, "-m", `merge: ${commitMsg}`], repoRoot);
      runGit(["branch", "-D", flowBranch], repoRoot);
    }
  } catch (error) {
    if (autoGit) {
      const current = currentBranch(repoRoot);
      const recovery = [
        `Auto-git flow failed while creating directive '${sessionName}'.`,
        `Current branch: ${current}`,
        `Recovery steps:`,
        `  git status --short`,
        current === "dev" ? "" : `  git checkout dev`,
        `  git branch -D ${flowBranch}   # only if branch is unneeded`,
        `  # Session files remain at: ${sessionDir}`,
      ].filter(Boolean).join("\n");
      throw new Error(`${error.message}\n${recovery}`);
    }
    throw error;
  }
}

main();
