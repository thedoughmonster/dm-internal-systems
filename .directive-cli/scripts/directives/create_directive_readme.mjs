#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { selectOption } from "./_prompt_helpers.mjs";
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

function normalizeTitleKey(input) {
  return slugify(input);
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
    "  --resume-auto-git                Resume pending auto-git finalize for an existing session",
    "  --editor                         Open terminal editor template for directive input",
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

function listDirtyFiles(cwd) {
  const result = runGit(["status", "--porcelain"], cwd);
  return String(result.stdout || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.slice(3).trim())
    .filter(Boolean);
}

function branchExistsLocal(branch, cwd) {
  const result = runGit(["show-ref", "--verify", `refs/heads/${branch}`], cwd, { allowFail: true });
  return result.status === 0;
}

function archiveBranchName(sessionName) {
  const slug = String(sessionName || "").toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
  return `chore/directive-new-${slug}`;
}

function stateDir(repoRoot) {
  return path.join(repoRoot, ".directive-cli", "state");
}

function pendingAutoGitPath(repoRoot, sessionName) {
  const safe = String(sessionName || "").replace(/[^a-zA-Z0-9._-]+/g, "-");
  return path.join(stateDir(repoRoot), `pending-directive-new-${safe}.json`);
}

function writePendingAutoGit(repoRoot, payload) {
  const outPath = pendingAutoGitPath(repoRoot, payload.session_name);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return outPath;
}

function readPendingAutoGit(repoRoot, sessionName) {
  const p = pendingAutoGitPath(repoRoot, sessionName);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function removePendingAutoGit(repoRoot, sessionName) {
  const p = pendingAutoGitPath(repoRoot, sessionName);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

function printAlert(title, lines) {
  const border = "=".repeat(110);
  process.stdout.write(`+${border}+\n`);
  process.stdout.write(`|  ${title}\n`);
  process.stdout.write(`+${"-".repeat(110)}+\n`);
  for (const line of lines) process.stdout.write(`|  ${line}\n`);
  process.stdout.write(`+${border}+\n`);
}

function evaluateAutoGitReadiness(repoRoot, flowBranch) {
  const dirtyFiles = listDirtyFiles(repoRoot);
  const branch = currentBranch(repoRoot);
  const branchAlreadyExists = branchExistsLocal(flowBranch, repoRoot);
  return {
    dirtyFiles,
    branch,
    branchAlreadyExists,
    isReady: dirtyFiles.length === 0 && branch === "dev" && !branchAlreadyExists,
  };
}

function executeAutoGitFlow(repoRoot, relSessionDir, flowBranch, commitMsg) {
  runGit(["checkout", "-b", flowBranch, "dev"], repoRoot);
  runGit(["add", "-f", relSessionDir], repoRoot);
  runGit(["commit", "-m", commitMsg], repoRoot);
  runGit(["checkout", "dev"], repoRoot);
  runGit(["merge", "--no-ff", flowBranch, "-m", `merge: ${commitMsg}`], repoRoot);
  runGit(["branch", "-D", flowBranch], repoRoot);
}

function shellQuoteSingle(value) {
  return `'${String(value).replace(/'/g, `'\"'\"'`)}'`;
}

function parseEditorDoc(raw, filePath) {
  let doc;
  try {
    doc = JSON.parse(raw);
  } catch {
    throw new Error(`Editor template must remain valid JSON: ${filePath}`);
  }
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) {
    throw new Error(`Editor template root must be an object: ${filePath}`);
  }
  const goals = Array.isArray(doc.goals)
    ? doc.goals.map((g) => String(g || "").trim()).filter(Boolean)
    : [];
  return {
    title: String(doc.title || "").trim(),
    summary: String(doc.summary || "").trim(),
    branchType: normalizeBranchType(String(doc.branch_type || "")),
    goals,
  };
}

function openEditorTemplate(initial) {
  const editor = String(process.env.VISUAL || process.env.EDITOR || "nano").trim();
  const tmpPath = path.join(os.tmpdir(), `dc-newdirective-${Date.now()}-${process.pid}.json`);
  const template = {
    title: String(initial.title || ""),
    summary: String(initial.summary || ""),
    branch_type: String(initial.branchType || "feature"),
    goals: Array.isArray(initial.goals) && initial.goals.length > 0 ? initial.goals : [""],
  };
  fs.writeFileSync(tmpPath, `${JSON.stringify(template, null, 2)}\n`, "utf8");
  const cmd = `${editor} ${shellQuoteSingle(tmpPath)}`;
  const result = spawnSync("bash", ["-lc", cmd], { stdio: "inherit" });
  try {
    if (result.status !== 0) {
      throw new Error(`Editor exited with status ${result.status ?? "unknown"}`);
    }
    const edited = fs.readFileSync(tmpPath, "utf8");
    return parseEditorDoc(edited, tmpPath);
  } finally {
    try {
      fs.unlinkSync(tmpPath);
    } catch {
      // no-op
    }
  }
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
    try {
      let useEditor = Boolean(args.editor);
      if (!useEditor && !title && !summary && goals.length === 0) {
        const mode = await selectOption({
          input: stdin,
          output: stdout,
          label: "Choose directive input mode:",
          options: [
            { label: "Prompt fields", value: "prompt" },
            { label: "Open editor template", value: "editor" },
          ],
          defaultIndex: 0,
        });
        useEditor = mode === "editor";
      }

      if (useEditor) {
        const edited = openEditorTemplate({ title, summary, branchType, goals });
        if (edited.title) title = edited.title;
        if (edited.summary) summary = edited.summary;
        if (edited.branchType) branchType = edited.branchType;
        if (edited.goals.length > 0) {
          goals.length = 0;
          goals.push(...edited.goals);
        }
      } else {
        if (!title) title = (await rl.question("Directive title: ")).trim();
        if (!summary) summary = (await rl.question("Directive summary (one line): ")).trim();
        if (!args["directive-branch"] && !branchType) {
          branchType = await selectOption({
            input: stdin,
            output: stdout,
            label: "Select branch type:",
            options: [
              { label: "feature", value: "feature" },
              { label: "chore", value: "chore" },
              { label: "hotfix", value: "hotfix" },
              { label: "fix", value: "fix" },
              { label: "release", value: "release" },
            ],
            defaultIndex: 0,
          });
        }
        if (goals.length === 0) {
          process.stdout.write("Add directive goals, one per line (blank line to finish).\n");
          while (true) {
            const goal = (await rl.question(`Goal ${goals.length + 1}: `)).trim();
            if (!goal) break;
            goals.push(goal);
          }
        }
      }
    } finally {
      rl.close();
    }
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

  const repoRoot = getRepoRoot();
  if (args["resume-auto-git"]) {
    const sessionName = String(args.session || "").trim();
    if (!sessionName) {
      process.stderr.write("Missing --session for --resume-auto-git\n");
      process.exit(1);
    }
    const pending = readPendingAutoGit(repoRoot, sessionName);
    if (!pending) {
      process.stderr.write(`No pending auto-git state found for session: ${sessionName}\n`);
      process.exit(1);
    }
    const readiness = evaluateAutoGitReadiness(repoRoot, String(pending.flow_branch || ""));
    if (!readiness.isReady) {
      const lines = [];
      if (readiness.dirtyFiles.length > 0) {
        lines.push("Working tree is still dirty.");
        for (const file of readiness.dirtyFiles.slice(0, 12)) lines.push(`  - ${file}`);
        if (readiness.dirtyFiles.length > 12) lines.push(`  ... and ${readiness.dirtyFiles.length - 12} more`);
      }
      if (readiness.branch !== "dev") lines.push(`Checkout 'dev' first (current: ${readiness.branch}).`);
      if (readiness.branchAlreadyExists) lines.push(`Delete or resolve existing local branch: ${pending.flow_branch}`);
      printAlert("AUTO-GIT RESUME BLOCKED", lines);
      process.exit(1);
    }
    if (args["dry-run"]) {
      process.stdout.write(`[dry-run] resume auto-git for session: ${sessionName}\n`);
      process.stdout.write(`[dry-run] branch: ${pending.flow_branch}\n`);
      process.stdout.write(`[dry-run] commit: ${pending.commit_message}\n`);
      process.exit(0);
    }
    executeAutoGitFlow(
      repoRoot,
      String(pending.session_dir_relative || ""),
      String(pending.flow_branch || ""),
      String(pending.commit_message || ""),
    );
    removePendingAutoGit(repoRoot, sessionName);
    process.stdout.write(`Resumed and completed auto-git flow for session: ${sessionName}\n`);
    process.exit(0);
  }

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

  const requestedTitleKey = normalizeTitleKey(title);
  const duplicateTitle = listSessions().find((s) => {
    const existingTitleKey = normalizeTitleKey(s && s.meta ? s.meta.title : "");
    return Boolean(existingTitleKey) && existingTitleKey === requestedTitleKey;
  });
  if (duplicateTitle) {
    const existingTitle = String((duplicateTitle.meta && duplicateTitle.meta.title) || duplicateTitle.name);
    process.stderr.write(
      `Directive title already exists: "${existingTitle}" (session: ${duplicateTitle.name})\n`,
    );
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
  const relSessionDir = path.relative(repoRoot, sessionDir).replace(/\\/g, "/");
  const flowBranch = archiveBranchName(sessionName);
  const commitMsg = `chore(directive): create ${sessionName}`;
  const readiness = autoGit ? evaluateAutoGitReadiness(repoRoot, flowBranch) : null;

  try {
    fs.mkdirSync(sessionDir, { recursive: true });
    fs.writeFileSync(metaPath, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
    process.stdout.write(`Created ${metaPath}\n`);

    if (autoGit) {
      if (readiness && !readiness.isReady) {
        const pendingPath = writePendingAutoGit(repoRoot, {
          kind: "directive_auto_git_pending",
          schema_version: "1.0",
          created_at: now,
          session_name: sessionName,
          session_dir_relative: relSessionDir,
          flow_branch: flowBranch,
          commit_message: commitMsg,
          blockers: {
            dirty_files: readiness.dirtyFiles,
            current_branch: readiness.branch,
            flow_branch_exists: readiness.branchAlreadyExists,
          },
        });
        const lines = [];
        lines.push(`Directive metadata has been created and pending state saved: ${pendingPath}`);
        if (readiness.dirtyFiles.length > 0) {
          lines.push("Auto-git is paused because working tree is dirty:");
          for (const file of readiness.dirtyFiles.slice(0, 12)) lines.push(`  - ${file}`);
          if (readiness.dirtyFiles.length > 12) lines.push(`  ... and ${readiness.dirtyFiles.length - 12} more`);
        }
        if (readiness.branch !== "dev") lines.push(`Auto-git requires branch 'dev' (current: ${readiness.branch}).`);
        if (readiness.branchAlreadyExists) lines.push(`Auto-git flow branch already exists: ${flowBranch}`);
        lines.push(`After cleanup, resume with: ./.directive-cli/dc directive new --resume-auto-git --session ${sessionName}`);
        printAlert("AUTO-GIT PAUSED", lines);
      } else {
        executeAutoGitFlow(repoRoot, relSessionDir, flowBranch, commitMsg);
      }
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
