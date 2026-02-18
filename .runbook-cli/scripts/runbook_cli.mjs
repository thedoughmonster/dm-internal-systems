#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { selectOption } from "../../.directive-cli/scripts/directives/_prompt_helpers.mjs";
import { listDirectiveSessions } from "../../.directive-cli/scripts/directives/_directive_listing.mjs";
import { directiveListLabel, statusColor, taskListLabel } from "../../.directive-cli/scripts/directives/_list_view_component.mjs";

const COLORS = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  magenta: "\x1b[35m",
  red: "\x1b[31m",
};

const SECTIONS = [
  {
    id: "architect-session",
    label: "architect session (discovery + authoring)",
    color: "cyan",
    needsTask: false,
    phase: "architect-discovery",
  },
  {
    id: "architect-handoff",
    label: "architect handoff to executor",
    color: "blue",
    needsTask: true,
    phase: "architect-authoring",
  },
  {
    id: "executor-task-pre",
    label: "executor task pre (directive/task start)",
    color: "magenta",
    needsTask: true,
    phase: "executor-start",
  },
  {
    id: "executor-task-post",
    label: "executor task post (task finish)",
    color: "green",
    needsTask: true,
    phase: "executor-task",
  },
  {
    id: "executor-closeout",
    label: "executor directive closeout",
    color: "yellow",
    needsTask: false,
    phase: "executor-closeout",
  },
  {
    id: "executor-cleanup",
    label: "executor directive cleanup",
    color: "red",
    needsTask: false,
    phase: "executor-closeout",
  },
];

function colorize(color, text) {
  if (!stdout.isTTY) return text;
  return `${COLORS[color] || ""}${text}${COLORS.reset}`;
}

function repoRoot() {
  const scriptFile = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(scriptFile), "../..");
}

function directivesRoot(root) {
  return path.join(root, ".directive-cli", "directives");
}

function dcPath(root) {
  return path.join(root, ".directive-cli", "dc");
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      args._.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) args[key] = true;
    else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

function usage() {
  return [
    "Usage:",
    "  runbook                         # interactive section + directive/task selection",
    "  runbook --section <id> --directive <session> [--task <slug>] [--profile <name>]",
    "",
    "Sections:",
    ...SECTIONS.map((s) => `  - ${s.id}: ${s.label}`),
  ].join("\n");
}

function listTasksForDirective(root, session) {
  const sessionDir = path.join(directivesRoot(root), session);
  if (!fs.existsSync(sessionDir)) return [];
  const files = fs
    .readdirSync(sessionDir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith(".task.json"))
    .map((d) => d.name)
    .sort();
  return files.map((file) => {
    const full = path.join(sessionDir, file);
    let title = file.replace(/\.task\.json$/u, "");
    let status = "todo";
    try {
      const doc = JSON.parse(fs.readFileSync(full, "utf8"));
      const meta = doc && doc.meta && typeof doc.meta === "object" ? doc.meta : {};
      title = String(meta.title || title);
      status = String(meta.status || status);
    } catch {
      // noop
    }
    return {
      task_file: file,
      task_slug: file.replace(/\.task\.json$/u, ""),
      task_title: title,
      task_status: status,
    };
  });
}

async function promptText(question, required = false) {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    while (true) {
      const value = String(await rl.question(question)).trim();
      if (!required || value) return value;
    }
  } finally {
    rl.close();
  }
}

async function selectSectionInteractive() {
  return selectOption({
    input: stdin,
    output: stdout,
    label: "Select runbook section:",
    options: SECTIONS.map((section) => ({
      value: section.id,
      label: section.label,
      color: section.color,
    })),
    defaultIndex: 0,
    selectedStyle: "bg",
  });
}

async function selectDirectiveInteractive(root, { includeCreateNew = false } = {}) {
  const directives = listDirectiveSessions(directivesRoot(root), { includeArchived: false });
  if (directives.length === 0 && !includeCreateNew) throw new Error("No non-archived directives found.");
  const options = [];
  if (includeCreateNew) {
    options.push({
      value: "__create_new_directive__",
      label: "Create new directive",
      color: "green",
    });
  }
  options.push(
    ...directives.map((directive) => ({
      value: directive.session,
      label: directiveListLabel(directive),
      color: statusColor(directive.status),
    })),
  );
  return selectOption({
    input: stdin,
    output: stdout,
    label: "Select directive:",
    options,
    defaultIndex: 0,
    selectedStyle: "bg",
  });
}

async function selectTaskInteractive(root, session) {
  const tasks = listTasksForDirective(root, session);
  if (tasks.length === 0) throw new Error(`No tasks found for directive '${session}'.`);
  return selectOption({
    input: stdin,
    output: stdout,
    label: "Select task:",
    options: tasks.map((task) => ({
      value: task.task_slug,
      label: taskListLabel(task),
      color: statusColor(task.task_status),
    })),
    defaultIndex: 0,
    selectedStyle: "bg",
  });
}

function requireSection(id) {
  const section = SECTIONS.find((entry) => entry.id === id);
  if (!section) throw new Error(`Unknown section '${id}'.`);
  return section;
}

function runDc(root, args, phase) {
  const env = { ...process.env, DC_NAMESPACE: "op" };
  if (phase) env.DC_RUNBOOK_PHASE = phase;
  const result = spawnSync(dcPath(root), args, {
    cwd: root,
    stdio: "inherit",
    env,
  });
  if (result.error) throw result.error;
  if (typeof result.status === "number" && result.status !== 0) process.exit(result.status);
}

async function main() {
  const root = repoRoot();
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) {
    process.stdout.write(`${usage()}\n`);
    process.exit(0);
  }

  if (!(stdin.isTTY && stdout.isTTY) && !args.section) {
    throw new Error("Non-interactive mode requires --section and --directive.");
  }

  const sectionId = String(args.section || (await selectSectionInteractive())).trim();
  const section = requireSection(sectionId);
  const includeCreateNew = section.id === "architect-session";
  const directive = String(args.directive || (await selectDirectiveInteractive(root, { includeCreateNew }))).trim();
  const task = section.needsTask
    ? String(args.task || (await selectTaskInteractive(root, directive))).trim()
    : String(args.task || "").trim();
  const profile = String(args.profile || "").trim();

  process.stdout.write(`${colorize("cyan", `[RUNBOOK] section=${section.id} phase=${section.phase}`)}\n`);
  process.stdout.write(`${colorize("yellow", `[RUNBOOK] directive=${directive}${task ? ` task=${task}` : ""}`)}\n`);

  if (section.id === "architect-session") {
    const cmd = ["launch", "codex", "--role", "architect"];
    if (directive && directive !== "__create_new_directive__") cmd.push("--directive", directive);
    if (profile) cmd.push("--profile", profile);
    runDc(root, cmd, section.phase);
    return;
  }

  if (section.id === "architect-handoff") {
    const cmd = ["launch", "handoff", "--role", "executor", "--from-role", "architect", "--directive", directive];
    if (task) cmd.push("--task", task);
    if (profile) cmd.push("--profile", profile);
    runDc(root, cmd, section.phase);
    return;
  }

  if (section.id === "executor-task-pre") {
    runDc(
      root,
      [
        "runbook",
        "executor-task-cycle",
        "--session",
        directive,
        "--task",
        task,
        "--phase",
        "pre",
        "--confirm",
        "executor-task-cycle-pre",
      ],
      section.phase,
    );
    return;
  }

  if (section.id === "executor-task-post") {
    const summary = String(args.summary || (await promptText("Task summary: ", true))).trim();
    runDc(
      root,
      [
        "runbook",
        "executor-task-cycle",
        "--session",
        directive,
        "--task",
        task,
        "--phase",
        "post",
        "--summary",
        summary,
        "--confirm",
        "executor-task-cycle-post",
      ],
      section.phase,
    );
    return;
  }

  if (section.id === "executor-closeout") {
    runDc(
      root,
      [
        "runbook",
        "executor-directive-closeout",
        "--session",
        directive,
        "--confirm",
        "executor-directive-closeout",
      ],
      section.phase,
    );
    return;
  }

  if (section.id === "executor-cleanup") {
    runDc(
      root,
      [
        "runbook",
        "executor-directive-cleanup",
        "--session",
        directive,
        "--confirm",
        "executor-directive-cleanup",
      ],
      section.phase,
    );
    return;
  }

  throw new Error(`Unhandled section '${section.id}'.`);
}

try {
  await main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
