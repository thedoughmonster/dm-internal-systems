#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadArchitectAuthoringPolicy, loadCorePolicy, loadExecutorLifecyclePolicy, loadRunbookFlowPolicy } from "./_policy_helpers.mjs";

function repoRoot() {
  const scriptFile = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(scriptFile), "../../..");
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const t = argv[i];
    if (!t.startsWith("--")) continue;
    const key = t.slice(2);
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
  return "Usage: node .directive-cli/scripts/directives/validate_policies.mjs [--verbose]";
}

function listPolicyFiles(root) {
  const dir = path.join(root, ".directive-cli", "policies");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith(".json"))
    .map((d) => d.name)
    .sort();
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(`${usage()}\n`);
    process.exit(0);
  }

  const root = repoRoot();
  const files = listPolicyFiles(root);
  if (files.length === 0) {
    throw new Error("No policy files found under .directive-cli/policies");
  }

  const loaded = [
    loadCorePolicy(),
    loadExecutorLifecyclePolicy(),
    loadArchitectAuthoringPolicy(),
    loadRunbookFlowPolicy(),
  ];

  if (args.verbose) {
    for (const f of files) process.stdout.write(`[PASS] ${f}\n`);
    for (const p of loaded) process.stdout.write(`[INFO] policy_id=${p.policy_id} version=${p.version}\n`);
  }

  process.stdout.write(`Policy validation passed: ${loaded.length} required policy file(s)\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
