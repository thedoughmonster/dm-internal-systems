#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
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

function resolveHomePath(value, root) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw === "~") return os.homedir();
  if (raw.startsWith("~/")) return path.join(os.homedir(), raw.slice(2));
  if (path.isAbsolute(raw)) return raw;
  return path.resolve(root, raw);
}

function readDcConfig(root) {
  const configPath = path.join(root, ".codex", "dc.config.json");
  if (!fs.existsSync(configPath)) return {};
  try {
    const doc = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return doc && typeof doc === "object" ? doc : {};
  } catch {
    return {};
  }
}

function runExecPolicyCheck(ruleFile, commandTokens) {
  const result = spawnSync(
    "codex",
    ["execpolicy", "check", "--rules", ruleFile, "--", ...commandTokens],
    { encoding: "utf8" },
  );
  if (result.error) {
    if (result.error.code === "ENOENT") {
      throw new Error("codex binary not found; required for execpolicy validation.");
    }
    throw result.error;
  }
  if (result.status !== 0) {
    const stderr = String(result.stderr || "").trim();
    throw new Error(`execpolicy check failed for '${commandTokens.join(" ")}': ${stderr || `exit ${result.status}`}`);
  }
  let doc;
  try {
    doc = JSON.parse(String(result.stdout || "{}"));
  } catch (error) {
    throw new Error(`execpolicy output was not valid JSON for '${commandTokens.join(" ")}'.`);
  }
  return String(doc && doc.decision ? doc.decision : "");
}

function validateRoleRuleFiles(root, verbose) {
  const dcConfig = readDcConfig(root);
  const homeMap = dcConfig.homes && typeof dcConfig.homes === "object" ? dcConfig.homes : {};
  const defaultHome = resolveHomePath(homeMap.default, root) || path.join(root, ".codex");
  const roleRuleFiles = {
    architect: path.join(resolveHomePath(homeMap.architect, root) || defaultHome, "rules", "default.rules"),
    executor: path.join(resolveHomePath(homeMap.executor, root) || defaultHome, "rules", "default.rules"),
    pair: path.join(resolveHomePath(homeMap.pair, root) || defaultHome, "rules", "default.rules"),
    auditor: path.join(resolveHomePath(homeMap.auditor, root) || defaultHome, "rules", "default.rules"),
  };

  for (const [role, filePath] of Object.entries(roleRuleFiles)) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing role rules file: ${path.relative(root, filePath)}`);
    }
    if (verbose) process.stdout.write(`[PASS] ${path.relative(root, filePath)}\n`);
  }

  const executorRules = roleRuleFiles.executor;
  const gitDecision = runExecPolicyCheck(executorRules, ["git", "status"]);
  if (gitDecision !== "forbidden") {
    throw new Error(`Executor rules must resolve 'git status' to decision=forbidden (received '${gitDecision || "unknown"}').`);
  }
  if (verbose) process.stdout.write("[PASS] executor rules: git status => forbidden\n");

  const dcTaskStartDecision = runExecPolicyCheck(executorRules, ["dc", "task", "start", "--session", "s1", "--task", "t1"]);
  if (dcTaskStartDecision !== "allow") {
    throw new Error(`Executor rules must resolve 'dc task start --session <s> --task <t>' to decision=allow (received '${dcTaskStartDecision || "unknown"}').`);
  }
  if (verbose) process.stdout.write("[PASS] executor rules: dc task start --session --task => allow\n");

  const dcDirectiveStartDecision = runExecPolicyCheck(executorRules, ["dc", "directive", "start", "--session", "s1"]);
  if (dcDirectiveStartDecision !== "allow") {
    throw new Error(`Executor rules must resolve 'dc directive start --session <s>' to decision=allow (received '${dcDirectiveStartDecision || "unknown"}').`);
  }
  if (verbose) process.stdout.write("[PASS] executor rules: dc directive start --session => allow\n");
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
  validateRoleRuleFiles(root, Boolean(args.verbose));

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
