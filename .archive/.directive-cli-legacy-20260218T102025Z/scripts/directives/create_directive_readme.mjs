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
    "  --editor                         Open terminal editor template for directive input",
    "  --no-prompt                      Disable prompts for missing title/summary",
    "  --dry-run                        Print output path and content only",
    "  --help                           Show this help",
    "",
    "Default session naming:",
    "  YY-MM-DD_<slug> in UTC (auto-suffixed with -2, -3, ... when needed)",
  ].join("\n");
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
  fs.mkdirSync(sessionDir, { recursive: true });
  fs.writeFileSync(metaPath, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
  process.stdout.write(`Created ${metaPath}\n`);
  process.stdout.write("Git is manual for directive creation. Suggested next steps:\n");
  process.stdout.write(`  git checkout -b ${doc.meta.directive_branch} ${doc.meta.directive_base_branch}\n`);
  process.stdout.write(`  git add ${path.relative(repoRoot, sessionDir).replace(/\\\\/g, "/")}\n`);
  process.stdout.write(`  git commit -m \"chore(directive): create ${sessionName}\"\n`);
  process.stdout.write(`  git push -u origin ${doc.meta.directive_branch}\n`);
}

main();
