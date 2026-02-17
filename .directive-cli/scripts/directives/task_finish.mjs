#!/usr/bin/env node

import path from "node:path";
import { resolveDirectiveContext, resolveTaskFile, readJson, writeJson, toUtcIso, readDirectiveHandoffIfPresent, assertDirtyFilesWithinDirectiveScope } from "./_directive_helpers.mjs";
import { log, runShell, runGit, shortSha, currentBranch, changedFiles, alert } from "./_git_helpers.mjs";
import { loadCorePolicy, loadExecutorLifecyclePolicy } from "./_policy_helpers.mjs";
import { assertExecutorRoleForLifecycle } from "./_role_guard.mjs";

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
  return "Usage: node .directive-cli/scripts/directives/task_finish.mjs --session <id> --task <slug|file> --summary <text> [--dry-run] [--help]";
}

function runValidationCommands(commands, cwd) {
  const results = [];
  for (const cmd of commands) {
    const result = runShell(String(cmd), cwd);
    results.push({
      command: String(cmd),
      status: result.status === 0 ? "pass" : "fail",
      exit_code: result.status,
    });
  }
  return results;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(`${usage()}\n`);
    process.exit(0);
  }
  assertExecutorRoleForLifecycle();
  const session = String(args.session || args.guid || "").trim();
  const task = String(args.task || "").trim();
  const summary = String(args.summary || "").trim();
  if (!session || !task || !summary) {
    alert("error", ["Missing required --session/--task/--summary", usage()], { color: "red" });
    process.exit(1);
  }

  const { repoRoot, sessionDir, directiveDoc } = resolveDirectiveContext(session);
  const corePolicy = loadCorePolicy();
  const lifecyclePolicy = loadExecutorLifecyclePolicy();
  const meta = directiveDoc.meta || {};
  const directiveBranch = String(meta.directive_branch || "").trim();
  const commitPolicy = String(meta.commit_policy || "").trim();
  if (!directiveBranch || !commitPolicy) throw new Error("Directive metadata missing directive_branch or commit_policy");
  const commitPolicies = Array.isArray(lifecyclePolicy.lifecycle?.commit_policy_values)
    ? lifecyclePolicy.lifecycle.commit_policy_values
    : [];
  if (commitPolicies.length > 0 && !commitPolicies.includes(commitPolicy)) {
    throw new Error(`Unsupported commit_policy '${commitPolicy}' by executor lifecycle policy.`);
  }
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
  const taskRel = path.relative(repoRoot, taskPath).replace(/\\/g, "/");
  const taskDoc = readJson(taskPath);
  if (!taskDoc || typeof taskDoc !== "object" || Array.isArray(taskDoc) || !taskDoc.meta) {
    throw new Error(`Invalid task file: ${taskPath}`);
  }

  const branch = currentBranch(repoRoot);
  if (branch !== directiveBranch) {
    throw new Error(`Current branch '${branch}' does not match directive_branch '${directiveBranch}'`);
  }

  const validationCommands = Array.isArray(taskDoc.task?.validation?.commands)
    ? taskDoc.task.validation.commands
    : [];

  log("TEST", `Running ${validationCommands.length} validation command(s)`);
  const commandResults = runValidationCommands(validationCommands, repoRoot);
  const hasFailures = commandResults.some((r) => r.status !== "pass");

  const gitFiles = changedFiles(repoRoot);
  const resultBlock = {
    summary,
    validation: {
      status: hasFailures ? "fail" : "pass",
      commands: commandResults,
      changed_files: gitFiles,
      branch,
      commit: null,
    },
    updated: toUtcIso(),
  };

  taskDoc.meta.result = resultBlock;
  if (!hasFailures) {
    if (!lifecyclePolicy.lifecycle?.allow_task_status_updates_via_lifecycle) {
      throw new Error("Executor lifecycle policy forbids task status updates via task_finish.");
    }
    taskDoc.meta.status = "done";
    if (lifecyclePolicy.lifecycle?.allow_task_updated_timestamp_via_lifecycle !== false) {
      taskDoc.meta.updated = toUtcIso();
    }
  }

  if (args["dry-run"]) {
    log("DIR", `[dry-run] would update ${path.basename(taskPath)} result and status=${taskDoc.meta.status}`);
    log("GIT", `[dry-run] commit policy: ${commitPolicy}`);
    if (hasFailures) {
      throw new Error("Validation failed during dry-run simulation.");
    }
    return;
  }

  assertDirtyFilesWithinDirectiveScope(repoRoot, sessionDir, gitFiles);
  writeJson(taskPath, taskDoc);

  if (hasFailures) {
    throw new Error("Validation failed. Task result recorded with status=fail.");
  }

  if (commitPolicy === "per_task") {
    log("GIT", "Committing task changes (per_task policy)");
    runGit(["add", "-A"], repoRoot);
    runGit(["add", "-f", taskRel], repoRoot);
    const commitMsg = `chore(executor): complete ${path.basename(taskPath, ".task.json")}`;
    runGit(["commit", "-m", commitMsg], repoRoot);
  } else {
    log("GIT", `Commit deferred by policy: ${commitPolicy}`);
  }

  const pushOnTaskFinish = lifecyclePolicy.lifecycle?.push_on_task_finish !== false;
  if (pushOnTaskFinish) {
    log("GIT", `Pushing branch '${branch}' to origin`);
    const hasUpstream = runGit(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"], repoRoot, { allowFail: true }).status === 0;
    if (hasUpstream) {
      runGit(["push"], repoRoot);
    } else {
      runGit(["push", "-u", "origin", branch], repoRoot);
    }
  }

  const sha = shortSha(repoRoot);
  taskDoc.meta.result.validation.commit = sha;
  writeJson(taskPath, taskDoc);

  log("DIR", "Task finish complete");
}

try {
  main();
} catch (error) {
  alert("error", String(error && error.message ? error.message : "Unknown error"), { color: "red" });
  process.exit(1);
}
