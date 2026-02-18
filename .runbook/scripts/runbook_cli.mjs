#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { stdin, stdout } from "node:process";
import { spawnSync } from "node:child_process";
import { printList, selectFromList, toPhaseOptions } from "./_list_component.mjs";

function repoRoot() {
  const file = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(file), "../..");
}

function phasesPath(root) {
  return path.join(root, ".runbook", "phases.json");
}

function phaseInstructionPath(root, phaseId) {
  return path.join(root, ".runbook", "instructions", `${phaseId}.md`);
}

function directivesRoot(root) {
  return path.join(root, ".runbook", "directives");
}

function usage() {
  return [
    "Usage:",
    "  runbook",
    "  runbook --phase <phase-id>",
    "  runbook --phase <phase-id> --dry-run",
    "",
    "  runbook directive create --session <id> --title <text> --summary <text> [--branch <name>] [--goal <text> ...] [--dry-run]",
    "  runbook directive set-goals --session <id> [--goal <text> ...] [--clear] [--dry-run]",
    "",
    "  runbook task create --session <id> --title <text> --summary <text> [--slug <slug>] [--dry-run]",
    "  runbook task set-contract --session <id> --task <slug|file> (--json <json> | --from-file <path>) [--dry-run]",
    "",
    "  runbook handoff create --session <id> --from-role <role> --to-role <role> --objective <text> [--task-file <name|null>] [--dry-run]",
    "  runbook meta set --session <id> [--task <slug|file>] --set <key=value> [--set <key=value> ...] [--dry-run]",
    "",
    "  runbook validate [--session <id>]",
    "  runbook --help",
    "",
    "Notes:",
    "  Artifact root: .runbook/directives",
  ].join("\n");
}

function parseArgs(argv) {
  const args = { _: [], goal: [], set: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      args._.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];

    if (key === "goal" || key === "set") {
      if (!next || next.startsWith("--")) throw new Error(`Missing value for --${key}`);
      args[key].push(next);
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

function nowIso() {
  return new Date().toISOString();
}

function slugify(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(filePath, payload, dryRun = false) {
  if (dryRun) {
    stdout.write(`${JSON.stringify({ dry_run: true, file: filePath, payload }, null, 2)}\n`);
    return;
  }
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function loadPhases(root) {
  const p = phasesPath(root);
  if (!fs.existsSync(p)) throw new Error(`Missing phase file: ${p}`);
  const doc = JSON.parse(fs.readFileSync(p, "utf8"));
  const rows = Array.isArray(doc.phases) ? doc.phases : [];
  const phases = rows
    .map((row) => ({
      id: String(row && row.id ? row.id : "").trim(),
      subphases: Array.isArray(row && row.subphases) ? row.subphases.map((s) => String(s).trim()).filter(Boolean) : [],
    }))
    .filter((row) => row.id);
  if (phases.length === 0) throw new Error("No phases configured in .runbook/phases.json");
  return phases;
}

function printPhaseList(phases) {
  printList({
    title: "Runbook phases:",
    options: toPhaseOptions(phases),
    output: stdout,
  });
}

async function selectPhaseInteractive(phases) {
  return selectFromList({
    input: stdin,
    output: stdout,
    title: "Select runbook phase:",
    options: toPhaseOptions(phases),
    defaultIndex: 0,
  });
}

function loadPhasePrompt(root, phaseId) {
  const p = phaseInstructionPath(root, phaseId);
  if (!fs.existsSync(p)) throw new Error(`Missing runbook phase instruction file: ${p}`);
  const body = fs.readFileSync(p, "utf8").trim();
  return [
    `Runbook phase: ${phaseId}`,
    "Use this as authoritative guidance for this session:",
    "",
    body,
  ].join("\n");
}

function launchCodexForPhase(root, phase, { dryRun = false } = {}) {
  if (phase !== "architect-discovery") return false;
  const prompt = loadPhasePrompt(root, phase);
  if (dryRun) {
    stdout.write(`[RUNBOOK] dry-run launch: codex <architect-discovery prompt>\n`);
    return true;
  }
  if (!(stdin.isTTY && stdout.isTTY)) {
    throw new Error("Cannot launch interactive codex from non-interactive shell.");
  }
  const result = spawnSync("codex", [prompt], { stdio: "inherit", env: process.env });
  if (result.error) throw result.error;
  if (typeof result.status === "number" && result.status !== 0) process.exit(result.status);
  return true;
}

function requireSession(root, session) {
  const s = String(session || "").trim();
  if (!s) throw new Error("Missing required --session");
  const dir = path.join(directivesRoot(root), s);
  return { session: s, sessionDir: dir };
}

function listSessionFiles(sessionDir, suffix) {
  if (!fs.existsSync(sessionDir)) return [];
  return fs
    .readdirSync(sessionDir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith(suffix))
    .map((d) => d.name)
    .sort();
}

function findMetaFile(sessionDir) {
  const files = listSessionFiles(sessionDir, ".meta.json");
  return files[0] || "";
}

function requireMetaDoc(root, session) {
  const { sessionDir } = requireSession(root, session);
  const metaFile = findMetaFile(sessionDir);
  if (!metaFile) throw new Error(`Missing directive meta file for session '${session}'`);
  const metaPath = path.join(sessionDir, metaFile);
  const doc = readJson(metaPath);
  return { sessionDir, metaPath, metaFile, doc };
}

function resolveTaskFile(sessionDir, taskRef) {
  const raw = String(taskRef || "").trim();
  if (!raw) throw new Error("Missing required --task");
  if (raw.endsWith(".task.json")) {
    const p = path.join(sessionDir, raw);
    if (!fs.existsSync(p)) throw new Error(`Task file not found: ${raw}`);
    return raw;
  }
  const file = `${raw}.task.json`;
  const full = path.join(sessionDir, file);
  if (!fs.existsSync(full)) throw new Error(`Task not found: ${raw}`);
  return file;
}

function parseValue(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  if ((s.startsWith("{") && s.endsWith("}")) || (s.startsWith("[") && s.endsWith("]"))) {
    try { return JSON.parse(s); } catch { return s; }
  }
  if (s === "true") return true;
  if (s === "false") return false;
  if (s === "null") return null;
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  return s;
}

function setPath(target, dotted, value) {
  const keys = String(dotted || "").split(".").filter(Boolean);
  if (keys.length === 0) throw new Error("Invalid --set path");
  let cur = target;
  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i];
    if (!cur[key] || typeof cur[key] !== "object" || Array.isArray(cur[key])) cur[key] = {};
    cur = cur[key];
  }
  cur[keys[keys.length - 1]] = value;
}

function cmdDirectiveCreate(root, args) {
  const title = String(args.title || "").trim();
  const summary = String(args.summary || "").trim();
  const dryRun = Boolean(args["dry-run"]);
  const branch = String(args.branch || "").trim() || `feature/${slugify(title)}`;
  const session = String(args.session || "").trim() || `${nowIso().slice(2, 10).replace(/-/g, "-")}_${slugify(title)}`;
  if (!title || !summary) throw new Error("directive create requires --title and --summary");
  const { sessionDir } = requireSession(root, session);
  const directiveSlug = slugify(title);
  const metaFile = `${directiveSlug}.meta.json`;
  const metaPath = path.join(sessionDir, metaFile);
  if (fs.existsSync(metaPath) && !dryRun) throw new Error(`Directive already exists: ${metaPath}`);
  const ts = nowIso();
  const payload = {
    kind: "runbook_directive_meta",
    schema_version: "1.0",
    meta: {
      id: crypto.randomUUID(),
      session,
      directive_slug: directiveSlug,
      title,
      summary,
      status: "todo",
      branch,
      goals: Array.isArray(args.goal) ? args.goal.map((g) => String(g).trim()).filter(Boolean) : [],
      created: ts,
      updated: ts,
    },
  };
  writeJson(metaPath, payload, dryRun);
}

function cmdDirectiveSetGoals(root, args) {
  const dryRun = Boolean(args["dry-run"]);
  const { metaPath, doc } = requireMetaDoc(root, args.session);
  const goals = Array.isArray(args.goal) ? args.goal.map((g) => String(g).trim()).filter(Boolean) : [];
  const next = structuredClone(doc);
  if (!next.meta || typeof next.meta !== "object") next.meta = {};
  if (args.clear) next.meta.goals = [];
  if (goals.length > 0) next.meta.goals = goals;
  next.meta.updated = nowIso();
  writeJson(metaPath, next, dryRun);
}

function cmdTaskCreate(root, args) {
  const title = String(args.title || "").trim();
  const summary = String(args.summary || "").trim();
  const dryRun = Boolean(args["dry-run"]);
  if (!title || !summary) throw new Error("task create requires --title and --summary");
  const { sessionDir } = requireSession(root, args.session);
  if (!fs.existsSync(sessionDir)) throw new Error(`Session not found: ${args.session}`);
  const slug = String(args.slug || "").trim() || slugify(title);
  const taskPath = path.join(sessionDir, `${slug}.task.json`);
  if (fs.existsSync(taskPath) && !dryRun) throw new Error(`Task already exists: ${taskPath}`);
  const ts = nowIso();
  const payload = {
    kind: "runbook_task",
    schema_version: "1.0",
    meta: {
      id: crypto.randomUUID(),
      title,
      summary,
      status: "todo",
      created: ts,
      updated: ts,
    },
    task: {
      objective: "",
      constraints: [],
      allowed_files: [],
      steps: [],
      validation: { commands: [] },
      expected_output: [],
      stop_conditions: [],
      notes: [],
    },
  };
  writeJson(taskPath, payload, dryRun);
}

function cmdTaskSetContract(root, args) {
  const dryRun = Boolean(args["dry-run"]);
  const { sessionDir } = requireSession(root, args.session);
  const taskFile = resolveTaskFile(sessionDir, args.task);
  const taskPath = path.join(sessionDir, taskFile);
  const doc = readJson(taskPath);

  let contract = null;
  if (args.json) contract = parseValue(args.json);
  if (!contract && args["from-file"]) contract = readJson(path.resolve(root, String(args["from-file"])));
  if (!contract || typeof contract !== "object" || Array.isArray(contract)) {
    throw new Error("task set-contract requires --json <object> or --from-file <path>");
  }

  const next = structuredClone(doc);
  next.task = { ...(next.task && typeof next.task === "object" ? next.task : {}), ...contract };
  if (!next.meta || typeof next.meta !== "object") next.meta = {};
  next.meta.updated = nowIso();
  writeJson(taskPath, next, dryRun);
}

function cmdHandoffCreate(root, args) {
  const dryRun = Boolean(args["dry-run"]);
  const { sessionDir, session } = requireSession(root, args.session);
  if (!fs.existsSync(sessionDir)) throw new Error(`Session not found: ${session}`);
  const { doc } = requireMetaDoc(root, session);
  const meta = doc && doc.meta && typeof doc.meta === "object" ? doc.meta : {};
  const slug = String(meta.directive_slug || "directive");
  const fromRole = String(args["from-role"] || "architect").trim();
  const toRole = String(args["to-role"] || "executor").trim();
  const objective = String(args.objective || "").trim();
  if (!objective) throw new Error("handoff create requires --objective");
  const handoffPath = path.join(sessionDir, `${slug}.handoff.json`);
  const payload = {
    kind: "runbook_handoff",
    schema_version: "1.0",
    handoff: {
      from_role: fromRole,
      to_role: toRole,
      objective,
      task_file: String(args["task-file"] || "null"),
      created: nowIso(),
    },
  };
  writeJson(handoffPath, payload, dryRun);
}

function cmdMetaSet(root, args) {
  const dryRun = Boolean(args["dry-run"]);
  const sets = Array.isArray(args.set) ? args.set : [];
  if (sets.length === 0) throw new Error("meta set requires at least one --set key=value");
  const { sessionDir, metaPath, doc } = requireMetaDoc(root, args.session);

  let targetPath = metaPath;
  let next = structuredClone(doc);
  if (args.task) {
    const taskFile = resolveTaskFile(sessionDir, args.task);
    targetPath = path.join(sessionDir, taskFile);
    next = readJson(targetPath);
  }

  if (!next.meta || typeof next.meta !== "object") next.meta = {};
  for (const row of sets) {
    const idx = String(row).indexOf("=");
    if (idx <= 0) throw new Error(`Invalid --set '${row}', expected key=value`);
    const key = String(row).slice(0, idx).trim();
    const valueRaw = String(row).slice(idx + 1);
    setPath(next.meta, key, parseValue(valueRaw));
  }
  next.meta.updated = nowIso();
  writeJson(targetPath, next, dryRun);
}

function validateDirectiveSession(sessionDir) {
  const errors = [];
  const metaFile = findMetaFile(sessionDir);
  if (!metaFile) {
    errors.push("missing meta file");
    return errors;
  }
  const metaDoc = readJson(path.join(sessionDir, metaFile));
  if (String(metaDoc.kind || "") !== "runbook_directive_meta") errors.push("meta.kind must be runbook_directive_meta");
  const meta = metaDoc && metaDoc.meta && typeof metaDoc.meta === "object" ? metaDoc.meta : {};
  if (!String(meta.title || "").trim()) errors.push("meta.title required");
  if (!String(meta.summary || "").trim()) errors.push("meta.summary required");

  const taskFiles = listSessionFiles(sessionDir, ".task.json");
  for (const taskFile of taskFiles) {
    const taskDoc = readJson(path.join(sessionDir, taskFile));
    if (String(taskDoc.kind || "") !== "runbook_task") errors.push(`${taskFile}: kind must be runbook_task`);
    const taskMeta = taskDoc && taskDoc.meta && typeof taskDoc.meta === "object" ? taskDoc.meta : {};
    if (!String(taskMeta.title || "").trim()) errors.push(`${taskFile}: meta.title required`);
    const task = taskDoc && taskDoc.task && typeof taskDoc.task === "object" ? taskDoc.task : null;
    if (!task) errors.push(`${taskFile}: task object required`);
  }

  const handoffFiles = listSessionFiles(sessionDir, ".handoff.json");
  for (const handoffFile of handoffFiles) {
    const handoffDoc = readJson(path.join(sessionDir, handoffFile));
    if (String(handoffDoc.kind || "") !== "runbook_handoff") errors.push(`${handoffFile}: kind must be runbook_handoff`);
  }
  return errors;
}

function cmdValidate(root, args) {
  const dirRoot = directivesRoot(root);
  if (!fs.existsSync(dirRoot)) {
    stdout.write(`${JSON.stringify({ kind: "runbook_validation", ok: true, sessions: [] }, null, 2)}\n`);
    return;
  }
  const sessionFilter = String(args.session || "").trim();
  const sessions = fs
    .readdirSync(dirRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((s) => !sessionFilter || s === sessionFilter)
    .sort();

  const rows = [];
  let ok = true;
  for (const session of sessions) {
    const errors = validateDirectiveSession(path.join(dirRoot, session));
    if (errors.length > 0) ok = false;
    rows.push({ session, ok: errors.length === 0, errors });
  }

  const out = { kind: "runbook_validation", ok, sessions: rows };
  stdout.write(`${JSON.stringify(out, null, 2)}\n`);
  if (!ok) process.exit(1);
}

function dispatchCommand(root, args) {
  const [group, action] = args._;
  if (group === "directive" && action === "create") return cmdDirectiveCreate(root, args);
  if (group === "directive" && action === "set-goals") return cmdDirectiveSetGoals(root, args);
  if (group === "task" && action === "create") return cmdTaskCreate(root, args);
  if (group === "task" && action === "set-contract") return cmdTaskSetContract(root, args);
  if (group === "handoff" && action === "create") return cmdHandoffCreate(root, args);
  if (group === "meta" && action === "set") return cmdMetaSet(root, args);
  if (group === "validate") return cmdValidate(root, args);
  throw new Error(`Unknown command: ${[group, action].filter(Boolean).join(" ")}`);
}

function isCommandMode(args) {
  const first = String(args._[0] || "").trim();
  return ["directive", "task", "handoff", "meta", "validate"].includes(first);
}

async function main() {
  const root = repoRoot();
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) {
    stdout.write(`${usage()}\n`);
    return;
  }

  if (isCommandMode(args)) {
    return dispatchCommand(root, args);
  }

  const phases = loadPhases(root);
  let selected = String(args.phase || "").trim();
  if (!selected) {
    printPhaseList(phases);
    if (!(stdin.isTTY && stdout.isTTY)) return;
    selected = await selectPhaseInteractive(phases);
  }

  const found = phases.find((p) => p.id === selected);
  if (!found) throw new Error(`Unknown phase '${selected}'.`);

  if (launchCodexForPhase(root, found.id, { dryRun: Boolean(args["dry-run"]) })) {
    return;
  }

  const payload = {
    kind: "runbook_phase_selection",
    phase: found.id,
    subphases: found.subphases,
  };
  stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

try {
  await main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
