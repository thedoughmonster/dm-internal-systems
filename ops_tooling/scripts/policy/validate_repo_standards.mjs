#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function repoRoot() {
  const file = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(file), "../../..");
}

function exists(file) {
  return fs.existsSync(file);
}

function read(file) {
  return String(fs.readFileSync(file, "utf8") || "");
}

function main() {
  const root = repoRoot();
  const required = [
    ".github/CODEOWNERS",
    ".editorconfig",
    ".gitattributes",
    ".githooks/pre-commit",
    ".githooks/pre-push",
    "docs/repo-rules.md",
    "docs/policies/branch-policy.md",
    "docs/policies/deployment-safety-policy.md",
    "docs/policies/environment-and-secrets-policy.md",
    "docs/policies/validation-policy.md",
    "docs/policies/contracts-and-schema-policy.md",
    "docs/policies/documentation-and-changelog-policy.md",
    "docs/policies/engineering/README.md",
    "docs/policies/engineering/architecture-and-boundaries.md",
    "docs/policies/engineering/naming-and-structure.md",
    "docs/policies/engineering/typescript-and-quality.md",
    "docs/policies/engineering/api-and-contracts.md",
    "docs/policies/engineering/database-and-migrations.md",
    "docs/policies/engineering/ui-and-accessibility.md",
    "docs/policies/engineering/error-handling-and-observability.md",
    "docs/policies/engineering/testing-and-validation.md",
    "docs/policies/engineering/definition-of-done.md",
    ".runbook/scripts/runbook_cli.mjs",
    "ops_tooling/scripts/qa/run_qa_checks.mjs",
  ];

  const errors = [];
  const checks = [];

  for (const rel of required) {
    const file = path.join(root, rel);
    const ok = exists(file);
    checks.push({ check: "required_file", file: rel, ok });
    if (!ok) errors.push(`missing required file: ${rel}`);
  }

  const readmeFile = path.join(root, "README.md");
  if (exists(readmeFile)) {
    const body = read(readmeFile);
    const legacy = body.includes(".directive-cli/docs/agent-rules");
    checks.push({ check: "readme_no_legacy_directive_cli_reference", file: "README.md", ok: !legacy });
    if (legacy) errors.push("README.md still references legacy .directive-cli/docs/agent-rules guidance");
  }

  const docsReadmeFile = path.join(root, "docs", "README.md");
  if (exists(docsReadmeFile)) {
    const body = read(docsReadmeFile);
    const legacy = body.includes(".directive-cli/");
    checks.push({ check: "docs_readme_no_legacy_directive_cli_reference", file: "docs/README.md", ok: !legacy });
    if (legacy) errors.push("docs/README.md still references legacy .directive-cli paths");
  }

  const hookFile = path.join(root, ".githooks", "pre-commit");
  if (exists(hookFile)) {
    const body = read(hookFile);
    const legacyRef = body.includes(".directive-cli/");
    checks.push({ check: "pre_commit_no_legacy_directive_cli", file: ".githooks/pre-commit", ok: !legacyRef });
    if (legacyRef) errors.push(".githooks/pre-commit references archived .directive-cli tooling");
  }

  const out = {
    kind: "repo_standards_validation",
    ok: errors.length === 0,
    checks,
    errors,
  };
  process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
  if (errors.length > 0) process.exit(1);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}
