#!/usr/bin/env node

import path from "node:path";
import { resolveDirectiveContext, readDirectiveHandoffIfPresent, findTaskAllowedFileIntersections } from "./_directive_helpers.mjs";
import { ensureCleanWorkingTree, log, currentBranch, runGit, branchExistsLocal } from "./_git_helpers.mjs";
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
  return "Usage: node .directive-cli/scripts/directives/directive_start.mjs --session <id> [--dry-run]";
}

function runDirectiveValidation(repoRoot, directiveMetaPath) {
  const rel = path.relative(repoRoot, directiveMetaPath);
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
  if (!session) {
    process.stderr.write(`${usage()}\n`);
    process.exit(1);
  }

  const { repoRoot, sessionDir, directiveMetaPath, directiveDoc } = resolveDirectiveContext(session);
  const corePolicy = loadCorePolicy();
  const lifecyclePolicy = loadExecutorLifecyclePolicy();
  const meta = directiveDoc.meta || {};
  const directiveBranch = String(meta.directive_branch || "").trim();
  const baseBranch = String(meta.directive_base_branch || "").trim();
  const commitPolicy = String(meta.commit_policy || "").trim();
  const commitPolicies = Array.isArray(lifecyclePolicy.lifecycle?.commit_policy_values)
    ? lifecyclePolicy.lifecycle.commit_policy_values
    : [];

  if (!directiveBranch || !baseBranch || !commitPolicy) {
    throw new Error("Directive metadata missing required keys: directive_branch, directive_base_branch, commit_policy");
  }
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

  log("DIR", `Directive start: ${session}`);
  log("DIR", `Branch=${directiveBranch} Base=${baseBranch} Policy=${commitPolicy}`);
  const intersections = findTaskAllowedFileIntersections(sessionDir);
  if (intersections.length > 0) {
    log("WARN", `Detected ${intersections.length} task allowlist intersection(s) in session.`);
    for (const item of intersections.slice(0, 12)) {
      const pair = `${item.task_a} <-> ${item.task_b}`;
      const marker = item.linked_by_dependency ? "linked" : "unlinked";
      const sample = item.overlaps[0] ? `${item.overlaps[0].left} :: ${item.overlaps[0].right}` : "overlap";
      log("WARN", `[${marker}] ${pair} | ${sample}`);
    }
    if (intersections.length > 12) {
      log("WARN", `... ${intersections.length - 12} additional intersection(s) not shown`);
    }
  }

  if (args["dry-run"]) {
    log("DIR", "Dry run only. No git or metadata changes applied.");
    return;
  }

  log("GIT", "Checking clean working tree");
  ensureCleanWorkingTree(repoRoot);

  const current = currentBranch(repoRoot);
  if (current !== directiveBranch) {
    log("GIT", `Switching branch to ${directiveBranch}`);
    if (branchExistsLocal(directiveBranch, repoRoot)) {
      runGit(["checkout", directiveBranch], repoRoot);
    } else {
      const bootstrapMode = String(lifecyclePolicy.lifecycle?.branch_bootstrap_mode || "").trim();
      if (bootstrapMode === "create_from_local_base_if_missing_local") {
        if (!branchExistsLocal(baseBranch, repoRoot)) {
          throw new Error(`Local base branch '${baseBranch}' not found. Create/switch it locally before directive start.`);
        }
        runGit(["checkout", "-b", directiveBranch, baseBranch], repoRoot);
      } else {
        throw new Error(`Branch '${directiveBranch}' missing locally/remotely and policy '${bootstrapMode}' does not allow bootstrap.`);
      }
    }
  }

  log("TEST", "Running directive metadata validation");
  runDirectiveValidation(repoRoot, directiveMetaPath);
  log("DIR", "Directive start complete");
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
