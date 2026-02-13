#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SESSION_REQUIRED = [
  "id",
  "directive_slug",
  "title",
  "summary",
  "status",
  "priority",
  "session_priority",
  "directive_branch",
  "directive_base_branch",
  "directive_merge_status",
  "commit_policy",
];

const TASK_META_REQUIRED = [
  "id",
  "title",
  "status",
  "priority",
  "session_priority",
  "summary",
  "execution_model",
  "thinking_level",
];

function getRepoRoot() {
  const scriptFile = fileURLToPath(import.meta.url);
  const scriptDir = path.dirname(scriptFile);
  return path.resolve(scriptDir, "../../..");
}

function usage() {
  return [
    "Usage:",
    "  node ops_tooling/scripts/directives/validate_directives_frontmatter.mjs [--file <path> ...] [--strict] [--verbose]",
  ].join("\n");
}

function parseArgs(argv) {
  const args = { file: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (key === "file") {
      if (!next || next.startsWith("--")) throw new Error("Missing value for --file");
      args.file.push(next);
      i += 1;
      continue;
    }
    if (!next || next.startsWith("--")) args[key] = true;
    else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

function listDirectiveSessions(root) {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => path.join(root, d.name));
}

function sessionFromFile(repoRoot, filePath) {
  const abs = path.resolve(repoRoot, filePath);
  const rel = path.relative(repoRoot, abs);
  if (!rel.startsWith("apps/web/.local/directives/")) return null;
  const parts = rel.split(path.sep);
  if (parts.length < 5) return null;
  return path.join(repoRoot, parts[0], parts[1], parts[2], parts[3]);
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

function isScalar(value) {
  return value === null || ["string", "number", "boolean"].includes(typeof value);
}

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const doc = JSON.parse(raw);
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) throw new Error(`JSON root must be object: ${filePath}`);
  return doc;
}

function validateSessionMetaFile(filePath) {
  const errors = [];
  let doc;
  try {
    doc = readJson(filePath);
  } catch (error) {
    return [error.message];
  }
  if (!doc.meta || typeof doc.meta !== "object" || Array.isArray(doc.meta)) return [`Missing top-level meta object: ${filePath}`];
  for (const key of SESSION_REQUIRED) {
    if (!Object.prototype.hasOwnProperty.call(doc.meta, key)) errors.push(`Missing meta.${key}: ${filePath}`);
    else if (!isScalar(doc.meta[key])) errors.push(`meta.${key} must be scalar: ${filePath}`);
  }
  if (!isUuid(doc.meta.id)) errors.push(`meta.id must be UUID: ${filePath}`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(doc.meta.directive_slug || ""))) errors.push(`meta.directive_slug must be slug: ${filePath}`);
  return errors;
}

function validateTaskFile(filePath) {
  const errors = [];
  let doc;
  try {
    doc = readJson(filePath);
  } catch (error) {
    return [error.message];
  }
  if (!doc.meta || typeof doc.meta !== "object" || Array.isArray(doc.meta)) errors.push(`Missing top-level meta object: ${filePath}`);
  if (!doc.task || typeof doc.task !== "object" || Array.isArray(doc.task)) errors.push(`Missing top-level task object: ${filePath}`);
  if (errors.length) return errors;

  for (const key of TASK_META_REQUIRED) {
    if (!Object.prototype.hasOwnProperty.call(doc.meta, key)) errors.push(`Missing meta.${key}: ${filePath}`);
    else if (!isScalar(doc.meta[key])) errors.push(`meta.${key} must be scalar: ${filePath}`);
  }
  if (!isUuid(doc.meta.id)) errors.push(`meta.id must be UUID: ${filePath}`);

  if (typeof doc.task.objective !== "string" || doc.task.objective.trim() === "") errors.push(`task.objective required: ${filePath}`);
  for (const key of ["constraints", "allowed_files", "steps", "expected_output", "stop_conditions"]) {
    if (!Array.isArray(doc.task[key]) || doc.task[key].length === 0) errors.push(`task.${key} must be non-empty array: ${filePath}`);
  }
  if (!doc.task.validation || typeof doc.task.validation !== "object" || Array.isArray(doc.task.validation)) errors.push(`task.validation required object: ${filePath}`);
  else if (!Array.isArray(doc.task.validation.commands) || doc.task.validation.commands.length === 0) errors.push(`task.validation.commands must be non-empty array: ${filePath}`);
  return errors;
}

function validateHandoffFile(filePath) {
  const errors = [];
  let doc;
  try {
    doc = readJson(filePath);
  } catch (error) {
    return [error.message];
  }
  if (!doc.handoff || typeof doc.handoff !== "object" || Array.isArray(doc.handoff)) return [`Missing top-level handoff object: ${filePath}`];
  const h = doc.handoff;
  for (const k of ["from_role", "to_role", "trigger", "session_id", "directive_branch", "objective", "blocking_rule", "worktree_mode"]) {
    if (typeof h[k] !== "string" || h[k].trim() === "") errors.push(`handoff.${k} required string: ${filePath}`);
  }
  if (!Array.isArray(h.worktree_allowlist_paths)) errors.push(`handoff.worktree_allowlist_paths must be array: ${filePath}`);
  return errors;
}

function validateSessionDir(sessionDir) {
  const errors = [];
  const checks = [];
  const files = fs.readdirSync(sessionDir, { withFileTypes: true }).filter((d) => d.isFile()).map((d) => d.name);

  const legacy = files.filter((f) =>
    f === "SESSION.md"
    || f === "SESSION.meta.json"
    || f === "HANDOFF.json"
    || f === "README.md"
    || f === "README.meta.json"
    || /^TASK_.*\.md$/.test(f)
    || /^TASK_.*\.meta\.json$/.test(f)
  );
  for (const f of legacy) errors.push(`Legacy file naming not allowed: ${path.join(sessionDir, f)}`);

  const metaFiles = files.filter((f) => /^[a-z0-9]+(?:-[a-z0-9]+)*\.meta\.json$/.test(f));
  if (metaFiles.length !== 1) errors.push(`Expected exactly one <directive_slug>.meta.json in ${sessionDir}`);

  const taskFiles = files.filter((f) => /^[a-z0-9]+(?:-[a-z0-9]+)*\.task\.json$/.test(f));
  const handoffFiles = files.filter((f) => /^[a-z0-9]+(?:-[a-z0-9]+)*\.handoff\.json$/.test(f));
  if (handoffFiles.length > 1) errors.push(`Expected at most one <directive_slug>.handoff.json in ${sessionDir}`);

  for (const f of metaFiles) {
    const p = path.join(sessionDir, f);
    const e = validateSessionMetaFile(p);
    errors.push(...e);
    checks.push({ file: p, ok: e.length === 0 });
  }
  for (const f of taskFiles) {
    const p = path.join(sessionDir, f);
    const e = validateTaskFile(p);
    errors.push(...e);
    checks.push({ file: p, ok: e.length === 0 });
  }
  for (const f of handoffFiles) {
    const p = path.join(sessionDir, f);
    const e = validateHandoffFile(p);
    errors.push(...e);
    checks.push({ file: p, ok: e.length === 0 });
  }

  return { errors, checks };
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error.message}\n${usage()}\n`);
    process.exit(1);
  }
  if (args.help) {
    process.stdout.write(`${usage()}\n`);
    process.exit(0);
  }

  const repoRoot = getRepoRoot();
  const root = path.join(repoRoot, "apps/web/.local/directives");
  const sessions = new Set();
  if (args.file.length > 0) {
    for (const f of args.file) {
      const s = sessionFromFile(repoRoot, f);
      if (s && fs.existsSync(s)) sessions.add(s);
    }
  } else {
    for (const s of listDirectiveSessions(root)) sessions.add(s);
  }

  const allErrors = [];
  const allChecks = [];
  for (const s of sessions) {
    const res = validateSessionDir(s);
    allErrors.push(...res.errors);
    allChecks.push({ session: s, checks: res.checks, ok: res.errors.length === 0 });
  }

  if (args.verbose) {
    for (const s of allChecks) {
      process.stdout.write(`[${s.ok ? "PASS" : "FAIL"}] session ${s.session}\n`);
      for (const c of s.checks) process.stdout.write(`  [${c.ok ? "PASS" : "FAIL"}] ${c.file}\n`);
    }
  }

  if (allErrors.length > 0) {
    for (const e of allErrors) process.stderr.write(`${e}\n`);
    process.stderr.write(`Validation failed: ${allErrors.length} error(s)\n`);
    process.exit(1);
  }

  process.stdout.write(`Validation passed: ${sessions.size} session(s)\n`);
}

main();
