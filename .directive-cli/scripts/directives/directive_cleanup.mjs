#!/usr/bin/env node

import { resolveDirectiveContext } from "./_directive_helpers.mjs";
import { ensureCleanWorkingTree, log, currentBranch, runGit, branchExistsLocal, alert } from "./_git_helpers.mjs";

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
  return "Usage: node .directive-cli/scripts/directives/directive_cleanup.mjs --session <id> [--dry-run] [--help]";
}

function isMergedIntoDev(branch, repoRoot) {
  const result = runGit(["merge-base", "--is-ancestor", branch, "dev"], repoRoot, { allowFail: true });
  return result.status === 0;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(`${usage()}\n`);
    process.exit(0);
  }
  const session = String(args.session || args.guid || "").trim();
  if (!session) {
    alert("error", ["Missing required --session", usage()], { color: "red" });
    process.exit(1);
  }

  const { repoRoot, directiveDoc } = resolveDirectiveContext(session);
  const branch = String((directiveDoc.meta || {}).directive_branch || "").trim();
  if (!branch) throw new Error("Directive metadata missing directive_branch");
  if (branch === "dev") throw new Error("Refusing to cleanup directive branch 'dev'.");

  log("DIR", `Directive cleanup: ${session}`);
  log("DIR", `Target branch=${branch}`);

  if (args["dry-run"]) {
    log("DIR", "Dry run only. No branch changes applied.");
    return;
  }

  log("GIT", "Checking clean working tree");
  ensureCleanWorkingTree(repoRoot);

  if (!branchExistsLocal(branch, repoRoot)) {
    log("GIT", `Local branch '${branch}' does not exist. Nothing to delete.`);
    return;
  }

  if (!isMergedIntoDev(branch, repoRoot)) {
    throw new Error(`Branch '${branch}' is not merged into 'dev'. Cleanup blocked.`);
  }

  const current = currentBranch(repoRoot);
  if (current !== "dev") {
    log("GIT", "Switching to dev");
    runGit(["checkout", "dev"], repoRoot);
  }

  log("GIT", `Deleting merged branch '${branch}'`);
  runGit(["branch", "-d", branch], repoRoot);
  log("DIR", "Directive cleanup complete");
}

try {
  main();
} catch (error) {
  alert("error", String(error && error.message ? error.message : "Unknown error"), { color: "red" });
  process.exit(1);
}
