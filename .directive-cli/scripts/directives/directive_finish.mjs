#!/usr/bin/env node

import path from "node:path";
import { resolveDirectiveContext, listTaskFiles, readJson, writeJson, toUtcIso, readDirectiveHandoffIfPresent, assertDirtyFilesWithinDirectiveScope } from "./_directive_helpers.mjs";
import { log, changedFiles, currentBranch, alert } from "./_git_helpers.mjs";
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
  return "Usage: node .directive-cli/scripts/directives/directive_finish.mjs --session <id> [--dry-run] [--help]";
}

function runDirectiveValidation(repoRoot, files) {
  const args = [".directive-cli/scripts/directives/validate_directives_frontmatter.mjs", "--strict"];
  for (const file of files) {
    args.push("--file", path.relative(repoRoot, file));
  }
  const result = spawnSync("node", args, { cwd: repoRoot, encoding: "utf8" });
  if (result.status !== 0) {
    const msg = String(result.stderr || result.stdout || "validation failed").trim();
    throw new Error(msg);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(`${usage()}\n`);
    process.exit(0);
  }
  assertExecutorRoleForLifecycle();
  const session = String(args.session || args.guid || "").trim();
  if (!session) {
    alert("error", ["Missing required --session", usage()], { color: "red" });
    process.exit(1);
  }

  const { repoRoot, directiveMetaPath, directiveDoc, sessionDir } = resolveDirectiveContext(session);
  const sessionRel = path.relative(repoRoot, sessionDir).replace(/\\/g, "/");
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

  const taskFiles = listTaskFiles(sessionDir);
  if (taskFiles.length === 0) throw new Error("No task files found for directive session.");
  const branch = currentBranch(repoRoot);
  if (branch !== directiveBranch) {
    throw new Error(`Current branch '${branch}' does not match directive_branch '${directiveBranch}'`);
  }

  for (const taskPath of taskFiles) {
    const taskDoc = readJson(taskPath);
    const taskMeta = taskDoc && taskDoc.meta ? taskDoc.meta : {};
    if (String(taskMeta.status || "") !== "done") {
      throw new Error(`Task not completed: ${path.basename(taskPath)}`);
    }
    if (!taskMeta.result || !taskMeta.result.validation || String(taskMeta.result.validation.status || "") !== "pass") {
      throw new Error(`Task missing passing validation evidence: ${path.basename(taskPath)}`);
    }
  }

  log("TEST", "Running strict directive/session validation");
  runDirectiveValidation(repoRoot, [directiveMetaPath, ...taskFiles]);

  if (args["dry-run"]) {
    log("DIR", `[dry-run] would mark directive done (commit_policy=${commitPolicy})`);
    log("GIT", "[dry-run] manual git required: commit/push/merge handled by operator");
    return;
  }

  const preDirty = changedFiles(repoRoot);
  assertDirtyFilesWithinDirectiveScope(repoRoot, sessionDir, preDirty);
  if (commitPolicy === "per_task" && preDirty.length > 0) {
    throw new Error(
      `Directive finish blocked for per_task policy: repository has uncommitted changes before closeout.\n` +
      `Run task finish/commit for remaining work first.\nDirty files:\n${preDirty.map((f) => `  - ${f}`).join("\n")}`,
    );
  }

  directiveDoc.meta.status = "done";
  directiveDoc.meta.updated = toUtcIso();
  writeJson(directiveMetaPath, directiveDoc);

  const dirtyFiles = changedFiles(repoRoot);
  if (dirtyFiles.length > 0) {
    log("GIT", `Directive closeout recorded. Manual git required for ${dirtyFiles.length} changed file(s).`);
  } else {
    log("GIT", "Directive closeout recorded. No file changes pending.");
  }
  log("GIT", "Run manual git flow: commit -> push -> merge to base branch.");

  log("DIR", "Directive finish complete");
}

try {
  main();
} catch (error) {
  alert("error", String(error && error.message ? error.message : "Unknown error"), { color: "red" });
  process.exit(1);
}
