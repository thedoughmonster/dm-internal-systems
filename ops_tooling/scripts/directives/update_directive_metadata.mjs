#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import {
  getDirectivesRoot,
  resolveSessionDir,
  assertInside,
} from "./_session_resolver.mjs";

const STRUCTURED_BLOCKED_KEYS = new Set(["tags", "depends_on", "blocked_by", "related", "result"]);
const EXECUTOR_BLOCKED_KEYS = new Set(["status", "bucket", "updated"]);
const VALID_ROLES = new Set(["architect", "executor", "operator"]);

function usage() {
  return [
    "Usage:",
    "  node ops_tooling/scripts/directives/update_directive_metadata.mjs --session <session-dir-or-uuid> --set <key=value> [--set <key=value> ...] [options]",
    "",
    "Required:",
    "  --session <id>                  Session directory name or session UUID (meta.id)",
    "  --guid <id>                     Legacy alias for --session",
    "  --set <key=value>               Update a top-level meta key (repeatable)",
    "",
    "Target options (choose one):",
    "  --directive-meta                Target <directive_slug>.meta.json (default)",
    "  --readme                        Legacy alias for --directive-meta",
    "  --task <task-slug|file>         Target <task_slug>.task.json",
    "",
    "Behavior options:",
    "  --role <architect|executor|operator>  Enforce role-specific metadata guards (default: architect)",
    "  --dry-run                       Print planned updates without writing",
    "  --no-prompt                     Disable interactive prompts for missing inputs",
    "  --help                          Show this help",
  ].join("\n");
}

function parseArgs(argv) {
  const args = { set: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];

    if (key === "set") {
      if (!next || next.startsWith("--")) throw new Error("Missing value for --set");
      args.set.push(next);
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

function parseSetPairs(pairs) {
  const updates = [];
  for (const pair of pairs) {
    const idx = pair.indexOf("=");
    if (idx <= 0) throw new Error(`Invalid --set value: ${pair}`);
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1);
    if (!/^[a-zA-Z0-9_]+$/.test(key)) throw new Error(`Invalid key '${key}'. Use top-level meta keys only.`);
    if (STRUCTURED_BLOCKED_KEYS.has(key)) throw new Error(`Key '${key}' is structured and blocked from this script.`);
    updates.push({ key, value });
  }
  return updates;
}

function coerceScalar(value) {
  if (value === "") return "";
  if (value === "null") return null;
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^-?\d+$/.test(value)) return Number.parseInt(value, 10);
  if (/^-?\d+\.\d+$/.test(value)) return Number.parseFloat(value);
  return value;
}

function scalarDisplay(value) {
  if (value === null) return "null";
  if (value === "") return "\"\"";
  if (typeof value === "string") return JSON.stringify(value);
  return String(value);
}

function enforceRoleRules(role, targetFileName, updates) {
  if (!VALID_ROLES.has(role)) throw new Error(`Invalid --role '${role}'. Expected architect, executor, or operator.`);
  if (role === "executor" && /\.meta\.json$/.test(targetFileName)) throw new Error("Executor role cannot update directive metadata.");
  if (role === "executor") {
    for (const { key } of updates) {
      if (EXECUTOR_BLOCKED_KEYS.has(key)) throw new Error(`Executor role cannot update meta.${key}.`);
    }
  }
}

function resolveTaskSlug(input) {
  const raw = String(input || "").trim();
  if (!raw) throw new Error("Missing task selector.");
  if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(raw)) return raw;
  if (/^[a-z0-9]+(?:-[a-z0-9]+)*\.task\.json$/.test(raw)) return raw.replace(/\.task\.json$/, "");
  throw new Error(`Invalid task selector '${input}'. Expected <task-slug> or <task-slug>.task.json.`);
}

function findDirectiveMetaFile(sessionDir) {
  const files = fs.readdirSync(sessionDir, { withFileTypes: true }).filter((d) => d.isFile()).map((d) => d.name);
  const metas = files.filter((f) => /^[a-z0-9]+(?:-[a-z0-9]+)*\.meta\.json$/.test(f));
  if (metas.length !== 1) throw new Error(`Expected exactly one <directive_slug>.meta.json in ${sessionDir}`);
  return metas[0];
}

async function promptForMissingInputs(args) {
  if (args["no-prompt"] || !stdin.isTTY) return args;
  const out = { ...args, set: Array.isArray(args.set) ? [...args.set] : [] };
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    if (!out.session && out.guid) out.session = out.guid;
    if (!out.session) out.session = (await rl.question("Session (dir name or UUID): ")).trim();

    if (!out.role) {
      const role = (await rl.question("Role [architect/executor/operator] (default: architect): ")).trim().toLowerCase();
      out.role = role || "architect";
    }

    if (!out["directive-meta"] && !out.readme && !out.task) {
      const target = (await rl.question("Target [directive/task] (default: directive): ")).trim().toLowerCase();
      if (target === "task") out.task = true;
      else out["directive-meta"] = true;
    }

    if (out.task === true) out.task = (await rl.question("Task slug (or <slug>.task.json): ")).trim();
    if (!out.set || out.set.length === 0) {
      while (true) {
        const key = (await rl.question("Meta key to set (blank to finish): ")).trim();
        if (!key) {
          if (out.set.length === 0) continue;
          break;
        }
        const value = await rl.question(`Value for ${key} (empty allowed): `);
        out.set.push(`${key}=${value}`);
      }
    }
  } finally {
    rl.close();
  }
  return out;
}

async function main() {
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

  args = await promptForMissingInputs(args);

  const session = String(args.session || args.guid || "").trim();
  if (!session) {
    process.stderr.write(`Missing required --session\n${usage()}\n`);
    process.exit(1);
  }
  if (!args.set || args.set.length === 0) {
    process.stderr.write(`Missing required --set <key=value>\n${usage()}\n`);
    process.exit(1);
  }
  if ((args["directive-meta"] || args.readme) && args.task) {
    process.stderr.write("Choose only one target: --directive-meta/--readme or --task\n");
    process.exit(1);
  }

  let updates;
  try {
    updates = parseSetPairs(args.set);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }

  let sessionDir;
  try {
    sessionDir = resolveSessionDir(session);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }

  const directivesRoot = getDirectivesRoot();
  let targetFile;
  try {
    assertInside(directivesRoot, sessionDir);
    if (args.task) {
      const slug = resolveTaskSlug(args.task);
      targetFile = `${slug}.task.json`;
    } else {
      targetFile = findDirectiveMetaFile(sessionDir);
    }
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }

  const targetPath = path.join(sessionDir, targetFile);
  if (!fs.existsSync(targetPath)) {
    process.stderr.write(`Target file does not exist: ${targetPath}\n`);
    process.exit(1);
  }

  const role = String(args.role || "architect").toLowerCase();
  try {
    enforceRoleRules(role, targetFile, updates);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }

  let doc;
  try {
    doc = JSON.parse(fs.readFileSync(targetPath, "utf8"));
  } catch (error) {
    process.stderr.write(`Invalid JSON in target file: ${targetPath}\n`);
    process.exit(1);
  }
  if (!doc || typeof doc !== "object" || Array.isArray(doc) || !doc.meta || typeof doc.meta !== "object" || Array.isArray(doc.meta)) {
    process.stderr.write(`Target file must contain top-level meta object: ${targetPath}\n`);
    process.exit(1);
  }

  const changed = [];
  for (const { key, value } of updates) {
    const before = Object.prototype.hasOwnProperty.call(doc.meta, key) ? doc.meta[key] : undefined;
    const after = coerceScalar(value);
    doc.meta[key] = after;
    changed.push({ key, mode: before === undefined ? "added" : "updated", before, after });
  }

  const out = `${JSON.stringify(doc, null, 2)}\n`;

  if (args["dry-run"]) {
    process.stdout.write(`[dry-run] target: ${targetPath}\n`);
    process.stdout.write(`[dry-run] role: ${role}\n`);
    for (const c of changed) {
      if (c.mode === "updated") process.stdout.write(`- updated ${c.key}: ${scalarDisplay(c.before)} -> ${scalarDisplay(c.after)}\n`);
      else process.stdout.write(`- added ${c.key}: ${scalarDisplay(c.after)}\n`);
    }
    process.exit(0);
  }

  fs.writeFileSync(targetPath, out, "utf8");
  process.stdout.write(`Updated ${targetPath}\n`);
  process.stdout.write(`Role guard: ${role}\n`);
  for (const c of changed) process.stdout.write(`- ${c.mode} ${c.key}\n`);
}

main();
