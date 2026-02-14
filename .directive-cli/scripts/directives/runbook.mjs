#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { loadRunbookFlowPolicy } from "./_policy_helpers.mjs";
import { getDirectivesRoot } from "./_session_resolver.mjs";

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
    "  node .directive-cli/scripts/directives/runbook.mjs <name> [options]",
    "",
    "Runbooks:",
    "  executor-task-cycle       Directive+task execution checkpoints",
    "    --session <id> --task <slug|file> --phase <pre|post> [--summary <text>] [--confirm <token>] [--dry-run]",
    "  executor-directive-closeout",
    "    --session <id> [--confirm <token>] [--dry-run]",
    "  executor-directive-cleanup",
    "    --session <id> [--confirm <token>] [--dry-run]",
    "  architect-authoring",
    "    --session <id> --title <text> --summary <text> [--task-title <text> --task-summary <text> --task-slug <slug>] [--confirm <token>] [--dry-run]",
    "",
    "Safety gates:",
    "  Non-dry-run runbooks require --confirm with an exact token:",
    "    architect-authoring         --confirm architect-authoring",
    "    executor-task-cycle pre     --confirm executor-task-cycle-pre",
    "    executor-task-cycle post    --confirm executor-task-cycle-post",
    "    executor-directive-closeout --confirm executor-directive-closeout",
    "    executor-directive-cleanup  --confirm executor-directive-cleanup",
  ].join("\n");
}

function scriptDir() {
  return path.dirname(fileURLToPath(import.meta.url));
}

function binPath(name) {
  return path.join(scriptDir(), "bin", name);
}

function log(message) {
  process.stdout.write(`[RUNBOOK] ${message}\n`);
}

function runBin(name, args, { dryRun = false } = {}) {
  const fullArgs = dryRun ? [...args, "--dry-run"] : args;
  log(`${name} ${fullArgs.join(" ")}`);
  const result = spawnSync(binPath(name), fullArgs, {
    cwd: path.resolve(scriptDir(), "../../.."),
    encoding: "utf8",
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) throw new Error(`${name} failed`);
}

function requireConfirm(args, requiredToken, runbookName, dryRun) {
  if (dryRun) return;
  const actual = String(args.confirm || "").trim();
  if (actual === requiredToken) return;
  throw new Error(`Runbook '${runbookName}' requires --confirm ${requiredToken} for non-dry-run execution.`);
}

function resolveSessionFiles(session) {
  const repoRoot = path.resolve(scriptDir(), "../../..");
  const sessionDir = path.join(getDirectivesRoot(), session);
  if (!fs.existsSync(sessionDir)) return [];
  const relSessionDir = path.relative(repoRoot, sessionDir).replace(/\\/g, "/");
  return fs
    .readdirSync(sessionDir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith(".json"))
    .map((d) => `${relSessionDir}/${d.name}`)
    .sort();
}

function runbookExecutorTaskCycle(args) {
  const session = String(args.session || args.guid || "").trim();
  const task = String(args.task || "").trim();
  const phase = String(args.phase || "pre").trim().toLowerCase();
  if (!session || !task) throw new Error("executor-task-cycle requires --session and --task");
  if (!["pre", "post"].includes(phase)) throw new Error("--phase must be pre or post");

  const dryRun = Boolean(args["dry-run"]);
  const confirmToken = phase === "pre" ? "executor-task-cycle-pre" : "executor-task-cycle-post";
  requireConfirm(args, confirmToken, "executor-task-cycle", dryRun);

  if (phase === "pre") {
    runBin("directivestart", ["--session", session], { dryRun });
    runBin("taskstart", ["--session", session, "--task", task], { dryRun });
    log("PAUSE_FOR_IMPLEMENTATION: perform coding changes, then run post phase.");
    return;
  }

  const summary = String(args.summary || "").trim();
  if (!summary) throw new Error("executor-task-cycle post phase requires --summary");
  runBin("taskfinish", ["--session", session, "--task", task, "--summary", summary], { dryRun });
}

function runbookExecutorDirectiveCloseout(args) {
  const session = String(args.session || args.guid || "").trim();
  if (!session) throw new Error("executor-directive-closeout requires --session");
  const dryRun = Boolean(args["dry-run"]);
  requireConfirm(args, "executor-directive-closeout", "executor-directive-closeout", dryRun);
  runBin("directivefinish", ["--session", session], { dryRun });
}

function runbookExecutorDirectiveCleanup(args) {
  const session = String(args.session || args.guid || "").trim();
  if (!session) throw new Error("executor-directive-cleanup requires --session");
  const dryRun = Boolean(args["dry-run"]);
  requireConfirm(args, "executor-directive-cleanup", "executor-directive-cleanup", dryRun);
  runBin("directivecleanup", ["--session", session], { dryRun });
}

function runbookArchitectAuthoring(args) {
  const session = String(args.session || args.guid || "").trim();
  const title = String(args.title || "").trim();
  const summary = String(args.summary || "").trim();
  if (!session || !title || !summary) {
    throw new Error("architect-authoring requires --session, --title, and --summary");
  }

  const dryRun = Boolean(args["dry-run"]);
  requireConfirm(args, "architect-authoring", "architect-authoring", dryRun);
  runBin("newdirective", ["--session", session, "--title", title, "--summary", summary, "--no-prompt"], { dryRun });

  const taskTitle = String(args["task-title"] || "").trim();
  const taskSummary = String(args["task-summary"] || "").trim();
  if (taskTitle && taskSummary) {
    const taskArgs = ["--session", session, "--title", taskTitle, "--summary", taskSummary, "--no-prompt"];
    const taskSlug = String(args["task-slug"] || "").trim();
    if (taskSlug) taskArgs.push("--slug", taskSlug);
    runBin("newtask", taskArgs, { dryRun });
  }

  const files = resolveSessionFiles(session);
  if (files.length > 0) {
    const vArgs = ["--strict"];
    for (const f of files) vArgs.push("--file", f);
    runBin("validatedirectives", vArgs, { dryRun: false });
  }
}

function main() {
  loadRunbookFlowPolicy();
  const args = parseArgs(process.argv.slice(2));
  const name = String(args._[0] || "").trim();
  if (!name || args.help) {
    process.stdout.write(`${usage()}\n`);
    process.exit(name ? 0 : 1);
  }

  if (name === "executor-task-cycle") return runbookExecutorTaskCycle(args);
  if (name === "executor-directive-closeout") return runbookExecutorDirectiveCloseout(args);
  if (name === "executor-directive-cleanup") return runbookExecutorDirectiveCleanup(args);
  if (name === "architect-authoring") return runbookArchitectAuthoring(args);

  throw new Error(`Unknown runbook: ${name}`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
