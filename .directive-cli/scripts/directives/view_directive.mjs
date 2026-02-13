#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const COLORS = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m",
};

function colorize(color, text) {
  if (!stdout.isTTY) return text;
  return `${COLORS[color] || ""}${text}${COLORS.reset}`;
}

function repoRoot() {
  const scriptFile = fileURLToPath(import.meta.url);
  const scriptDir = path.dirname(scriptFile);
  return path.resolve(scriptDir, "../../..");
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      if (!args._) args._ = [];
      args._.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    i += 1;
  }
  return args;
}

function loadJson(filePath) {
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function line(label, value) {
  return `${colorize("cyan", `${label}:`)} ${value ?? ""}\n`;
}

function bullet(value) {
  return `  - ${value}\n`;
}

function section(title) {
  return `${colorize("magenta", title)}\n`;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function renderDirectiveTask(doc) {
  const meta = doc.meta && typeof doc.meta === "object" ? doc.meta : {};
  const task = doc.task && typeof doc.task === "object" ? doc.task : {};

  let out = "";
  out += line("Kind", doc.kind || "directive_task");
  out += line("Title", colorize("blue", String(meta.title || "")));
  out += line("Status", colorize("yellow", String(meta.status || "")));
  out += line("Priority", `${meta.priority || ""} / session ${meta.session_priority || ""}`);
  out += line("Assignee", meta.assignee || "");
  out += line("Created", colorize("green", String(meta.created || "")));
  out += line("Updated", colorize("green", String(meta.updated || "")));
  out += line("Summary", String(meta.summary || ""));
  out += "\n";

  out += section("Objective");
  out += bullet(String(task.objective || ""));
  out += "\n";

  const constraints = asArray(task.constraints);
  if (constraints.length > 0) {
    out += section("Constraints");
    for (const c of constraints) out += bullet(String(c));
    out += "\n";
  }

  const allowed = asArray(task.allowed_files);
  if (allowed.length > 0) {
    out += section("Allowed Files");
    for (const f of allowed) {
      const p = f && typeof f === "object" ? String(f.path || "") : String(f);
      const a = f && typeof f === "object" ? String(f.access || "") : "";
      out += bullet(`${p}${a ? ` (${a})` : ""}`);
    }
    out += "\n";
  }

  const steps = asArray(task.steps);
  if (steps.length > 0) {
    out += section("Steps");
    for (let i = 0; i < steps.length; i += 1) {
      const s = steps[i] && typeof steps[i] === "object" ? steps[i] : {};
      const id = String(s.id || `step_${i + 1}`);
      const instruction = String(s.instruction || "");
      out += `  ${i + 1}. [${id}] ${instruction}\n`;
    }
    out += "\n";
  }

  const validation = task.validation && typeof task.validation === "object" ? task.validation : {};
  const commands = asArray(validation.commands);
  if (commands.length > 0) {
    out += section("Validation Commands");
    for (const cmd of commands) out += bullet(String(cmd));
    out += "\n";
  }

  const expected = asArray(task.expected_output);
  if (expected.length > 0) {
    out += section("Expected Output");
    for (const e of expected) out += bullet(String(e));
    out += "\n";
  }

  const stop = asArray(task.stop_conditions);
  if (stop.length > 0) {
    out += section("Stop Conditions");
    for (const s of stop) out += bullet(String(s));
  }

  return out;
}

function renderGenericJson(doc) {
  const kind = String(doc.kind || "json");
  const meta = doc.meta && typeof doc.meta === "object" ? doc.meta : {};
  let out = "";
  out += line("Kind", kind);
  if (meta.title) out += line("Title", colorize("blue", String(meta.title)));
  if (meta.status) out += line("Status", colorize("yellow", String(meta.status)));
  if (meta.created) out += line("Created", colorize("green", String(meta.created)));
  if (meta.updated) out += line("Updated", colorize("green", String(meta.updated)));
  if (meta.summary) out += line("Summary", String(meta.summary));
  out += "\n";
  out += section("Content");
  out += `${JSON.stringify(doc, null, 2)}\n`;
  return out;
}

function lower(value) {
  return String(value || "").trim().toLowerCase();
}

function isArchivedStatus(status) {
  return ["archived", "done", "completed", "cancelled"].includes(lower(status));
}

function listAvailableDirectives(root) {
  const base = path.join(root, "apps", "web", ".local", "directives");
  if (!fs.existsSync(base)) return [];

  const sessions = fs
    .readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const directives = [];
  for (const session of sessions) {
    const sessionDir = path.join(base, session);
    const files = fs.readdirSync(sessionDir);
    const metaFile = files.find((f) => f.endsWith(".meta.json"));
    if (!metaFile) continue;
    const metaDoc = loadJson(path.join(sessionDir, metaFile));
    const meta = metaDoc && metaDoc.meta ? metaDoc.meta : {};
    if (isArchivedStatus(meta.status)) continue;
    directives.push({
      session,
      session_dir: sessionDir,
      title: String(meta.title || metaFile.replace(/\.meta\.json$/u, "")),
      status: String(meta.status || "open"),
    });
  }

  return directives;
}

function listDirectiveFiles(directive) {
  return fs
    .readdirSync(directive.session_dir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith(".json"))
    .map((d) => d.name)
    .sort()
    .map((name) => {
      const filePath = path.join(directive.session_dir, name);
      const doc = loadJson(filePath) || {};
      const meta = doc.meta && typeof doc.meta === "object" ? doc.meta : {};
      const description = String(
        meta.summary || doc.summary || meta.title || doc.title || name,
      ).trim();
      const created = String(
        meta.created || meta.created_at || doc.created || doc.created_at || "",
      ).trim();
      return { name, path: filePath, description, created };
    });
}

async function requireDirective(root, args) {
  const directives = listAvailableDirectives(root);
  const explicit = String(args.directive || args.session || "").trim();
  if (explicit) {
    const found = directives.find((d) => d.session === explicit);
    if (!found) throw new Error(`Directive not found or archived: ${explicit}`);
    return found;
  }

  if (!stdin.isTTY) throw new Error("Missing required --directive in non-interactive mode.");
  if (directives.length === 0) throw new Error("No available directives found.");

  process.stdout.write(`${colorize("cyan", "Available directives:")}\n`);
  for (let i = 0; i < directives.length; i += 1) {
    const d = directives[i];
    process.stdout.write(`  ${colorize("green", String(i + 1))}) ${d.session}  ${colorize("magenta", `[${d.status}]`)}  ${d.title}\n`);
  }

  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const input = (await rl.question("Select directive number (required): ")).trim();
    if (!input) throw new Error("Missing required directive selection.");
    if (/^\d+$/.test(input)) {
      const n = Number(input);
      if (n < 1 || n > directives.length) throw new Error("Invalid directive selection.");
      return directives[n - 1];
    }
    const named = directives.find((d) => d.session === input);
    if (!named) throw new Error("Invalid directive selection.");
    return named;
  } finally {
    rl.close();
  }
}

async function requireFile(directive, args) {
  const files = listDirectiveFiles(directive);
  if (files.length === 0) throw new Error(`No json files found in directive: ${directive.session}`);

  const explicit = String(args.file || "").trim();
  if (explicit) {
    const found = files.find((f) => f.name === explicit);
    if (!found) throw new Error(`File not found in directive: ${explicit}`);
    return found;
  }

  if (!stdin.isTTY) throw new Error("Missing required --file in non-interactive mode.");

  process.stdout.write(`${colorize("cyan", "Available files:")}\n`);
  for (let i = 0; i < files.length; i += 1) {
    const createdPart = files[i].created ? `  ${colorize("green", `created: ${files[i].created}`)}` : "";
    process.stdout.write(`  ${colorize("green", String(i + 1))}) ${colorize("blue", files[i].description)}${createdPart}\n`);
  }

  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const input = (await rl.question("Select file number (required): ")).trim();
    if (!input) throw new Error("Missing required file selection.");
    if (/^\d+$/.test(input)) {
      const n = Number(input);
      if (n < 1 || n > files.length) throw new Error("Invalid file selection.");
      return files[n - 1];
    }
    const named = files.find((f) => f.name === input);
    if (!named) throw new Error("Invalid file selection.");
    return named;
  } finally {
    rl.close();
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = repoRoot();
  const directive = await requireDirective(root, args);
  const file = await requireFile(directive, args);

  process.stdout.write(`${colorize("cyan", "Directive:")} ${directive.session}\n`);
  process.stdout.write(`${colorize("cyan", "File:")} ${file.name}\n`);
  process.stdout.write(`${colorize("cyan", "Description:")} ${colorize("blue", file.description)}\n`);
  if (file.created) {
    process.stdout.write(`${colorize("green", `created: ${file.created}`)}\n`);
  }
  process.stdout.write(`${colorize("magenta", "---")}\n`);

  const content = fs.readFileSync(file.path, "utf8");
  if (args.raw) {
    process.stdout.write(content);
    return;
  }

  try {
    const doc = JSON.parse(content);
    if (doc && typeof doc === "object" && !Array.isArray(doc)) {
      if (String(doc.kind || "") === "directive_task") {
        process.stdout.write(renderDirectiveTask(doc));
        return;
      }
      process.stdout.write(renderGenericJson(doc));
      return;
    }
    process.stdout.write(`${JSON.stringify(doc, null, 2)}\n`);
  } catch {
    process.stdout.write(content);
  }
}

Promise.resolve(main()).catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
