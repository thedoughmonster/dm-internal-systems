#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

function repoRoot() {
  const file = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(file), "../../..");
}

function nowIso() {
  return new Date().toISOString();
}

function runCommand(root, command, args) {
  const started = Date.now();
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    env: process.env,
  });
  const ended = Date.now();
  return {
    command: [command, ...args].join(" "),
    ok: (result.status ?? 1) === 0,
    exit_code: result.status ?? 1,
    duration_ms: ended - started,
    stdout: String(result.stdout || "").trim(),
    stderr: String(result.stderr || "").trim(),
  };
}

function loadWebScripts(root) {
  const file = path.join(root, "apps", "web", "package.json");
  if (!fs.existsSync(file)) return {};
  try {
    const doc = JSON.parse(fs.readFileSync(file, "utf8"));
    return doc && doc.scripts && typeof doc.scripts === "object" ? doc.scripts : {};
  } catch {
    return {};
  }
}

function buildChecks(root) {
  const webScripts = loadWebScripts(root);
  const checks = [
    { id: "repo_standards", command: "node", args: ["ops_tooling/scripts/policy/validate_repo_standards.mjs"] },
    { id: "runbook_validate", command: "runbook", args: ["validate"] },
    { id: "web_lint", command: "npm", args: ["--prefix", "apps/web", "run", "lint"] },
    { id: "web_typecheck", command: "npm", args: ["--prefix", "apps/web", "run", "typecheck"] },
  ];

  if (webScripts["test:integration"]) {
    checks.push({
      id: "web_integration_tests",
      command: "npm",
      args: ["--prefix", "apps/web", "run", "test:integration"],
    });
  }
  return checks;
}

function timestampCompact(date = new Date()) {
  const yyyy = String(date.getUTCFullYear());
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mi = String(date.getUTCMinutes()).padStart(2, "0");
  const ss = String(date.getUTCSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`;
}

function writeReport(root, report) {
  const reportsDir = path.join(root, "ops_tooling", "reports");
  fs.mkdirSync(reportsDir, { recursive: true });
  const file = path.join(reportsDir, `${timestampCompact()}.qa.json`);
  fs.writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return path.relative(root, file);
}

function main() {
  const root = repoRoot();
  const checks = buildChecks(root);
  const startedAt = nowIso();
  const results = [];
  for (const check of checks) {
    const run = runCommand(root, check.command, check.args);
    results.push({ id: check.id, ...run });
  }
  const failed = results.filter((r) => !r.ok);
  const report = {
    kind: "runbook_qa_scan",
    started_at: startedAt,
    finished_at: nowIso(),
    ok: failed.length === 0,
    checks: results,
    failures: failed.map((f) => ({ id: f.id, command: f.command, exit_code: f.exit_code })),
  };
  const reportPath = writeReport(root, report);
  const output = { ...report, report_file: reportPath };
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  if (!output.ok) process.exit(1);
}

main();
