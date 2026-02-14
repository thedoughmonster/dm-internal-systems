#!/usr/bin/env node

import path from "node:path";
import { resolveDirectiveContext, resolveTaskFile, readJson, writeJson, toUtcIso, readDirectiveHandoffIfPresent } from "./_directive_helpers.mjs";
import { ensureCleanWorkingTree, log, currentBranch } from "./_git_helpers.mjs";
import { loadCorePolicy, loadExecutorLifecyclePolicy } from "./_policy_helpers.mjs";
import { assertExecutorRoleForLifecycle } from "./_role_guard.mjs";
import { spawnSync } from "node:child_process";

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
  return "Usage: node .directive-cli/scripts/directives/task_start.mjs --session <id> --task <slug|file> [--dry-run]";
}

function runTaskValidation(repoRoot, taskFile) {
  const rel = path.relative(repoRoot, taskFile);
  const result = spawnSync(
    "node",
    [".directive-cli/scripts/directives/validate_directives_frontmatter.mjs", "--strict", "--file", rel],
    { cwd: repoRoot, encoding: "utf8" },
  );
  if (result.status !== 0) {
    const msg = String(result.stderr || result.stdout || "validation failed").trim();
    throw new Error(msg);
  }
}

function main() {
  assertExecutorRoleForLifecycle();
  const args = parseArgs(process.argv.slice(2));
  const session = String(args.session || args.guid || "").trim();
  const task = String(args.task || "").trim();
  if (!session || !task) {
    process.stderr.write(`${usage()}\n`);
    process.exit(1);
  }

  const { repoRoot, sessionDir, directiveDoc } = resolveDirectiveContext(session);
  const corePolicy = loadCorePolicy();
  const lifecyclePolicy = loadExecutorLifecyclePolicy();
  const directiveBranch = String((directiveDoc.meta || {}).directive_branch || "").trim();
  if (!directiveBranch) throw new Error("Directive metadata missing directive_branch");
  const handoffState = readDirectiveHandoffIfPresent(sessionDir, directiveDoc);
  if (corePolicy.executor_execution_context?.require_handoff_for_execution && !handoffState) {
    throw new Error("Executor policy requires a valid <directive_slug>.handoff.json before execution.");
  }
  if (handoffState && lifecyclePolicy.handoff_enforcement?.require_branch_match_when_handoff_present) {
    const handoffBranch = String(handoffState.handoffDoc.handoff?.directive_branch || "").trim();
    if (!handoffBranch) throw new Error(`Missing handoff.directive_branch in ${handoffState.handoffPath}`);
    if (handoffBranch !== directiveBranch) {
      throw new Error(`Handoff branch '${handoffBranch}' does not match directive metadata branch '${directiveBranch}'.`);
    }
  }

  const taskPath = resolveTaskFile(sessionDir, task);
  const taskDoc = readJson(taskPath);
  if (!taskDoc || typeof taskDoc !== "object" || Array.isArray(taskDoc) || !taskDoc.meta) {
    throw new Error(`Invalid task file: ${taskPath}`);
  }

  log("DIR", `Task start: ${path.basename(taskPath)}`);

  if (args["dry-run"]) {
    log("DIR", "Dry run only. No git or metadata changes applied.");
    return;
  }

  log("GIT", "Checking clean working tree");
  ensureCleanWorkingTree(repoRoot);

  const branch = currentBranch(repoRoot);
  if (branch !== directiveBranch) {
    throw new Error(`Current branch '${branch}' does not match directive_branch '${directiveBranch}'`);
  }

  if (!lifecyclePolicy.lifecycle?.allow_task_status_updates_via_lifecycle) {
    throw new Error("Executor lifecycle policy forbids task status updates via task_start.");
  }
  taskDoc.meta.status = "in_progress";
  if (lifecyclePolicy.lifecycle?.allow_task_updated_timestamp_via_lifecycle !== false) {
    taskDoc.meta.updated = toUtcIso();
  }
  writeJson(taskPath, taskDoc);

  log("TEST", "Running task metadata validation");
  runTaskValidation(repoRoot, taskPath);
  log("DIR", "Task start complete");
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
