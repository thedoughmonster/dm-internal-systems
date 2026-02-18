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

function directivesRoot(root) {
  return path.join(root, ".runbook", "directives");
}

function usage() {
  return [
    "Usage:",
    "  runbook",
    "  runbook --phase <phase-id> [--subphase active|handoff] [--directive <session>]",
    "  runbook --phase <phase-id> [--subphase active|handoff] [--directive <session>] --dry-run",
    "",
    "  runbook directive create --session <id> --title <text> --summary <text> [--branch <name>] [--goal <text> ...] [--dry-run]",
    "  runbook directive set-goals --session <id> [--goal <text> ...] [--clear] [--dry-run]",
    "",
    "  runbook task create --session <id> --title <text> --summary <text> [--slug <slug>] [--dry-run]",
    "  runbook task set-contract --session <id> --task <slug|file> (--json <json> | --from-file <path>) [--dry-run]",
    "",
    "  runbook handoff create --session <id> [--kind authoring|executor] --objective <text> [--from-role <role> --to-role <role> --task-file <name|null>] [--dry-run]",
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

function utcDatePrefix() {
  const d = new Date();
  const yy = String(d.getUTCFullYear()).slice(-2);
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function slugify(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeDirectiveMetaDoc(doc, session = "") {
  const next = structuredClone(doc || {});
  if (!next || typeof next !== "object" || Array.isArray(next)) return null;
  next.kind = "directive_session_meta";
  next.schema_version = "1.0";
  if (!next.meta || typeof next.meta !== "object" || Array.isArray(next.meta)) next.meta = {};
  const m = next.meta;
  if (!m.id) m.id = crypto.randomUUID();
  if (session) m.session = session;
  m.directive_slug = String(m.directive_slug || slugify(m.title || session || "directive"));
  m.status = String(m.status || "todo");
  if (!Object.prototype.hasOwnProperty.call(m, "owner")) m.owner = "operator";
  if (!Object.prototype.hasOwnProperty.call(m, "assignee")) m.assignee = null;
  m.priority = String(m.priority || "medium");
  m.session_priority = String(m.session_priority || "medium");
  if (!Object.prototype.hasOwnProperty.call(m, "auto_run")) m.auto_run = false;
  if (!Array.isArray(m.tags)) m.tags = ["needs-triage"];
  m.created = String(m.created || nowIso());
  m.updated = String(m.updated || nowIso());
  m.bucket = String(m.bucket || "active");
  m.scope = String(m.scope || "directives");
  m.source = String(m.source || "architect");
  m.effort = String(m.effort || "medium");
  if (!Array.isArray(m.depends_on)) m.depends_on = [];
  if (!Array.isArray(m.blocked_by)) m.blocked_by = [];
  if (!Array.isArray(m.related)) m.related = [];
  m.title = String(m.title || "");
  m.summary = String(m.summary || "");
  if (!Array.isArray(m.goals)) m.goals = [];
  m.directive_branch = String(m.directive_branch || `feature/${m.directive_slug}`);
  m.directive_base_branch = String(m.directive_base_branch || "dev");
  m.directive_merge_status = String(m.directive_merge_status || "open");
  m.commit_policy = String(m.commit_policy || "end_of_directive");
  return next;
}

function normalizeTaskDoc(doc) {
  const next = structuredClone(doc || {});
  if (!next || typeof next !== "object" || Array.isArray(next)) return null;
  next.kind = "directive_task";
  next.schema_version = "1.0";
  if (!next.meta || typeof next.meta !== "object" || Array.isArray(next.meta)) next.meta = {};
  const m = next.meta;
  if (!m.id) m.id = crypto.randomUUID();
  m.title = String(m.title || "");
  m.status = String(m.status || "todo");
  m.priority = String(m.priority || "medium");
  m.session_priority = String(m.session_priority || "medium");
  if (!Object.prototype.hasOwnProperty.call(m, "owner")) m.owner = "operator";
  if (!Object.prototype.hasOwnProperty.call(m, "assignee")) m.assignee = "executor";
  m.bucket = String(m.bucket || "todo");
  m.created = String(m.created || nowIso());
  m.updated = String(m.updated || nowIso());
  if (!Array.isArray(m.tags)) m.tags = [];
  m.effort = String(m.effort || "medium");
  if (!Array.isArray(m.depends_on)) m.depends_on = [];
  if (!Array.isArray(m.blocked_by)) m.blocked_by = [];
  if (!Array.isArray(m.related)) m.related = [];
  m.summary = String(m.summary || "");
  m.execution_model = String(m.execution_model || "gpt-5.3-codex");
  m.thinking_level = String(m.thinking_level || "medium");

  if (!next.task || typeof next.task !== "object" || Array.isArray(next.task)) next.task = {};
  const t = next.task;
  t.objective = String(t.objective || "");
  if (!Array.isArray(t.constraints)) t.constraints = [];
  if (!Array.isArray(t.allowed_files)) t.allowed_files = [];
  if (!Array.isArray(t.steps)) t.steps = [];
  if (!t.validation || typeof t.validation !== "object" || Array.isArray(t.validation)) t.validation = {};
  if (!Array.isArray(t.validation.commands)) t.validation.commands = [];
  if (!Array.isArray(t.expected_output)) t.expected_output = [];
  if (!Array.isArray(t.stop_conditions)) t.stop_conditions = [];
  if (!Array.isArray(t.notes)) t.notes = [];
  return next;
}

function buildHandoffPayload(meta, args) {
  const fromRole = String(args["from-role"] || "architect").trim();
  const toRole = String(args["to-role"] || "executor").trim();
  const objective = String(args.objective || "").trim();
  if (!objective) throw new Error("handoff create requires --objective");
  return {
    handoff: {
      from_role: fromRole,
      to_role: toRole,
      trigger: String(args.trigger || "architect_to_executor_handoff_v1"),
      session_id: String(args["session-id"] || meta.id || crypto.randomUUID()),
      task_file: String(args["task-file"] || "null"),
      directive_branch: String(meta.directive_branch || `feature/${String(meta.directive_slug || "directive")}`),
      required_reading: String(args["required-reading"] || "apps/web/docs/guides/component-paradigm.md"),
      objective,
      blocking_rule: String(args["blocking-rule"] || "Architect must stop and transfer execution to executor after handoff creation"),
      worktree_mode: String(args["worktree-mode"] || "clean_required"),
      worktree_allowlist_paths: [],
    },
  };
}

function architectHandoffPath(sessionDir, directiveSlug) {
  return path.join(sessionDir, `${directiveSlug}.architect.handoff.json`);
}

function buildArchitectAuthoringHandoff(meta, args, session) {
  const objective = String(args.objective || "Convert approved discovery scope into directive/task artifacts for execution.").trim();
  return {
    kind: "runbook_architect_handoff",
    schema_version: "1.0",
    handoff: {
      from_phase: "architect-discovery",
      to_phase: "architect-authoring",
      created: nowIso(),
      objective,
    },
    directive: {
      session,
      directive_slug: String(meta.directive_slug || ""),
      title: String(meta.title || ""),
      summary: String(meta.summary || ""),
      status: String(meta.status || "todo"),
      directive_branch: String(meta.directive_branch || ""),
      directive_base_branch: String(meta.directive_base_branch || "dev"),
      commit_policy: String(meta.commit_policy || "end_of_directive"),
      owner: Object.prototype.hasOwnProperty.call(meta, "owner") ? meta.owner : "operator",
      assignee: Object.prototype.hasOwnProperty.call(meta, "assignee") ? meta.assignee : null,
      priority: String(meta.priority || "medium"),
      session_priority: String(meta.session_priority || "medium"),
      effort: String(meta.effort || "medium"),
      goals: Array.isArray(meta.goals) ? meta.goals : [],
      definition_of_done: String(meta.definition_of_done || ""),
      constraints: Array.isArray(meta.constraints) ? meta.constraints : [],
      acceptance_criteria: Array.isArray(meta.acceptance_criteria) ? meta.acceptance_criteria : [],
      non_goals: Array.isArray(meta.non_goals) ? meta.non_goals : [],
      tags: Array.isArray(meta.tags) ? meta.tags : [],
      depends_on: Array.isArray(meta.depends_on) ? meta.depends_on : [],
      blocked_by: Array.isArray(meta.blocked_by) ? meta.blocked_by : [],
      related: Array.isArray(meta.related) ? meta.related : [],
      updated: String(meta.updated || nowIso()),
    },
    authoring_requirements: {
      required_commands: [
        "runbook task create",
        "runbook task set-contract",
        "runbook meta set --task ...",
        "runbook handoff create --kind executor",
        "runbook validate --session ...",
      ],
      completion_gate: "All task contracts complete and validated; executor handoff created.",
    },
  };
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function safeName(input, fallback = "no-directive") {
  const v = String(input || "").trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return v || fallback;
}

function shQuote(input) {
  const s = String(input ?? "");
  return `'${s.replace(/'/g, `'\"'\"'`)}'`;
}

function runbookLogTargets(root, directiveContext) {
  const directiveKey = safeName(directiveContext?.session || "", "no-directive");
  const sessionLogDir = path.join(root, ".runbook", "session-logs");
  const codexLogDir = path.join(root, ".runbook", "codex-logs", directiveKey);
  const transcriptPath = path.join(sessionLogDir, `${directiveKey}.log`);
  const eventPath = path.join(sessionLogDir, `${directiveKey}.events.log`);
  return { directiveKey, sessionLogDir, codexLogDir, transcriptPath, eventPath };
}

function appendEventLog(root, {
  directiveSession = "",
  event = "",
  payload = {},
} = {}) {
  const targets = runbookLogTargets(root, directiveSession ? { session: directiveSession } : null);
  ensureDir(targets.sessionLogDir);
  const entry = {
    ts: nowIso(),
    directive: targets.directiveKey,
    event: String(event || "event"),
    payload: payload && typeof payload === "object" ? payload : { value: String(payload) },
  };
  fs.appendFileSync(targets.eventPath, `${JSON.stringify(entry)}\n`, "utf8");
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

function phaseMap(phases) {
  const map = new Map();
  for (const row of phases || []) map.set(row.id, row);
  return map;
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

function listDirectiveSessions(root) {
  const dirRoot = directivesRoot(root);
  if (!fs.existsSync(dirRoot)) return [];
  return fs
    .readdirSync(dirRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

function loadDirectiveSummary(root, session) {
  const sessionDir = path.join(directivesRoot(root), session);
  const metaFile = findMetaFile(sessionDir);
  if (!metaFile) {
    return { session, title: session, status: "todo" };
  }
  const metaDoc = readJson(path.join(sessionDir, metaFile));
  const meta = metaDoc && metaDoc.meta && typeof metaDoc.meta === "object" ? metaDoc.meta : {};
  return {
    session,
    title: String(meta.title || session),
    status: String(meta.status || "todo"),
  };
}

function directiveOptions(root) {
  const rows = listDirectiveSessions(root)
    .map((session) => loadDirectiveSummary(root, session))
    .filter((row) => String(row.status || "").toLowerCase() !== "archived");
  const createNew = {
    value: "__create_new__",
    label: "[new] begin discovery to create a new directive",
    color: "cyan",
  };
  const existing = rows.map((row) => ({
    value: row.session,
    label: `[${row.status}] ${row.title}`,
    color: "dim",
  }));
  return [createNew, ...existing];
}

async function selectDirectiveInteractive(root) {
  return selectFromList({
    input: stdin,
    output: stdout,
    title: "Select directive:",
    options: directiveOptions(root),
    defaultIndex: 0,
  });
}

function taskStatusCounts(sessionDir) {
  const files = listSessionFiles(sessionDir, ".task.json");
  const counts = { todo: 0, in_progress: 0, done: 0, other: 0, total: files.length };
  for (const file of files) {
    const doc = readJson(path.join(sessionDir, file));
    const status = String(doc?.meta?.status || "todo");
    if (status === "todo") counts.todo += 1;
    else if (status === "in_progress") counts.in_progress += 1;
    else if (status === "done") counts.done += 1;
    else counts.other += 1;
  }
  return counts;
}

function detectResumeState(root, session, phases) {
  const sessionDir = path.join(directivesRoot(root), session);
  const metaFile = findMetaFile(sessionDir);
  if (!metaFile) return { phase: "architect-discovery", subphase: "active" };
  const metaDoc = readJson(path.join(sessionDir, metaFile));
  const meta = metaDoc && metaDoc.meta && typeof metaDoc.meta === "object" ? metaDoc.meta : {};
  const phaseIndex = phaseMap(phases);
  const rememberedPhase = String(meta.runbook_phase || "").trim();
  const rememberedSubphase = String(meta.runbook_subphase || "").trim();
  if (rememberedPhase && phaseIndex.has(rememberedPhase)) {
    return {
      phase: rememberedPhase,
      subphase: normalizeSubphaseForPhase(phases, rememberedPhase, rememberedSubphase || "active"),
    };
  }
  const slug = String(meta.directive_slug || slugify(meta.title || session));
  const authoringHandoff = architectHandoffPath(sessionDir, slug);
  const executorHandoff = path.join(sessionDir, `${slug}.handoff.json`);
  const counts = taskStatusCounts(sessionDir);

  if (meta.status === "archived" || meta.status === "done") return { phase: "executor-closeout", subphase: "handoff" };
  if (counts.in_progress > 0) return { phase: "executor-task", subphase: "active" };
  if (counts.total === 0) {
    if (fs.existsSync(authoringHandoff)) return { phase: "architect-authoring", subphase: "active" };
    return { phase: "architect-discovery", subphase: "active" };
  }
  if (counts.done === counts.total) return { phase: "executor-closeout", subphase: "active" };
  if (fs.existsSync(executorHandoff)) return { phase: "executor-start", subphase: "active" };
  return { phase: "architect-authoring", subphase: "active" };
}

function validSubphase(subphase) {
  return ["active", "handoff"].includes(String(subphase || "").trim());
}

function normalizeSubphaseForPhase(phases, phase, subphase) {
  const index = phaseMap(phases);
  const row = index.get(String(phase || "").trim());
  const allowed = Array.isArray(row?.subphases) && row.subphases.length > 0 ? row.subphases : ["active", "handoff"];
  const requested = String(subphase || "").trim();
  if (requested && allowed.includes(requested)) return requested;
  if (allowed.includes("active")) return "active";
  return allowed[0];
}

function ensureDirectiveExists(root, session) {
  const { sessionDir } = requireSession(root, session);
  if (!fs.existsSync(sessionDir)) throw new Error(`Session not found: ${session}`);
  const metaFile = findMetaFile(sessionDir);
  if (!metaFile) throw new Error(`Missing directive meta file for session '${session}'`);
}

function loadDirectiveContext(root, session) {
  if (!session) return null;
  const sessionDir = path.join(directivesRoot(root), session);
  const metaFile = findMetaFile(sessionDir);
  if (!metaFile) return { session, title: session, status: "todo", task: null, counts: { total: 0, todo: 0, in_progress: 0, done: 0, other: 0 } };
  const metaDoc = readJson(path.join(sessionDir, metaFile));
  const meta = metaDoc && metaDoc.meta && typeof metaDoc.meta === "object" ? metaDoc.meta : {};
  const taskFiles = listSessionFiles(sessionDir, ".task.json");
  const rows = taskFiles.map((file) => {
    const doc = readJson(path.join(sessionDir, file));
    const status = String(doc?.meta?.status || "");
    const updated = Date.parse(String(doc?.meta?.updated || "")) || 0;
    return { file, status, updated };
  });
  let selectedTask = null;
  const inProgress = rows.filter((r) => r.status === "in_progress").sort((a, b) => b.updated - a.updated);
  if (inProgress.length > 0) selectedTask = inProgress[0].file;
  if (!selectedTask) {
    const todo = rows.filter((r) => r.status === "todo").sort((a, b) => b.updated - a.updated);
    if (todo.length > 0) selectedTask = todo[0].file;
  }
  return {
    session,
    title: String(meta.title || session),
    status: String(meta.status || "todo"),
    task: selectedTask,
    counts: taskStatusCounts(sessionDir),
  };
}

function persistRunbookState(root, session, phase, subphase, dryRun = false) {
  if (!session) return;
  const { metaPath, doc } = requireMetaDoc(root, session);
  const next = normalizeDirectiveMetaDoc(doc, session);
  if (!next) throw new Error(`Invalid directive meta JSON: ${metaPath}`);
  const phaseValue = String(phase || "").trim();
  const subphaseValue = String(subphase || "active").trim();
  const previousPhase = String(next.meta.runbook_phase || "").trim();
  const previousSubphase = String(next.meta.runbook_subphase || "").trim();
  if (previousPhase === phaseValue && previousSubphase === subphaseValue) return;
  next.meta.runbook_phase = phaseValue;
  next.meta.runbook_subphase = subphaseValue;
  next.meta.updated = nowIso();
  writeJson(metaPath, next, dryRun);
}

function loadPhasePrompt(root, phaseId, { subphase = "active", directiveContext = null } = {}) {
  const subphaseName = validSubphase(subphase) ? subphase : "active";
  const subphaseFile = path.join(root, ".runbook", "instructions", `${phaseId}.${subphaseName}.md`);
  if (!fs.existsSync(subphaseFile)) throw new Error(`Missing runbook phase instruction file: ${subphaseFile}`);
  const body = fs.readFileSync(subphaseFile, "utf8").trim();
  const contextLines = directiveContext
    ? [
      `Selected directive session: ${directiveContext.session}`,
      `Directive title: ${directiveContext.title}`,
      `Directive status: ${directiveContext.status}`,
      `Task counts: total=${directiveContext.counts.total}, todo=${directiveContext.counts.todo}, in_progress=${directiveContext.counts.in_progress}, done=${directiveContext.counts.done}`,
      `Selected task: ${directiveContext.task || "none"}`,
      "",
    ]
    : ["No directive is currently selected.", ""];
  return [
    `Runbook phase: ${phaseId}`,
    `Runbook subphase: ${subphaseName}`,
    "Use this as authoritative guidance for this session:",
    "",
    ...contextLines,
    body,
  ].join("\n");
}

function launchCodexForPhase(root, phase, { dryRun = false, subphase = "active", directiveContext = null } = {}) {
  const prompt = loadPhasePrompt(root, phase, { subphase, directiveContext });
  const logs = runbookLogTargets(root, directiveContext);
  const directiveSession = directiveContext?.session || "";
  if (dryRun) {
    const withDirective = directiveContext ? ` directive=${directiveContext.session}` : "";
    stdout.write(
      `[RUNBOOK] dry-run launch: codex <${phase}/${subphase} prompt>${withDirective} log=${logs.transcriptPath}\n`,
    );
    appendEventLog(root, {
      directiveSession,
      event: "phase_launch_dry_run",
      payload: { phase, subphase, transcript: logs.transcriptPath, codex_log_dir: logs.codexLogDir },
    });
    return true;
  }
  if (!(stdin.isTTY && stdout.isTTY)) {
    throw new Error("Cannot launch interactive codex from non-interactive shell.");
  }
  ensureDir(logs.sessionLogDir);
  ensureDir(logs.codexLogDir);
  stdout.write(`[RUNBOOK] Observe live session log: tail -f ${logs.transcriptPath}\n`);
  stdout.write(`[RUNBOOK] Observe clean events log: tail -f ${logs.eventPath}\n`);
  appendEventLog(root, {
    directiveSession,
    event: "phase_launch_start",
    payload: {
      phase,
      subphase,
      transcript: logs.transcriptPath,
      events: logs.eventPath,
      codex_log_dir: logs.codexLogDir,
    },
  });

  const codexCmd = `codex --no-alt-screen -c ${shQuote(`log_dir=${JSON.stringify(logs.codexLogDir)}`)} ${shQuote(prompt)}`;

  let result = spawnSync("script", ["-q", "-f", "-a", logs.transcriptPath, "-c", codexCmd], {
    stdio: "inherit",
    env: process.env,
  });
  if (result.error && String(result.error.message || "").toLowerCase().includes("enoent")) {
    stdout.write("[RUNBOOK] 'script' command not found; falling back to direct codex launch.\n");
    appendEventLog(root, {
      directiveSession,
      event: "phase_launch_fallback",
      payload: { reason: "script_not_found" },
    });
    result = spawnSync("codex", ["--no-alt-screen", "-c", `log_dir=${logs.codexLogDir}`, prompt], {
      stdio: "inherit",
      env: process.env,
    });
  }
  appendEventLog(root, {
    directiveSession,
    event: "phase_launch_end",
    payload: { exit_status: typeof result.status === "number" ? result.status : null },
  });
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
  const session = String(args.session || "").trim() || `${utcDatePrefix()}_${slugify(title)}`;
  if (!title || !summary) throw new Error("directive create requires --title and --summary");
  const { sessionDir } = requireSession(root, session);
  const directiveSlug = slugify(title);
  const metaFile = `${directiveSlug}.meta.json`;
  const metaPath = path.join(sessionDir, metaFile);
  if (fs.existsSync(metaPath) && !dryRun) throw new Error(`Directive already exists: ${metaPath}`);
  const ts = nowIso();
  const payload = normalizeDirectiveMetaDoc({
    kind: "directive_session_meta",
    schema_version: "1.0",
    meta: {
      directive_slug: directiveSlug,
      title,
      summary,
      status: "todo",
      directive_branch: branch,
      goals: Array.isArray(args.goal) ? args.goal.map((g) => String(g).trim()).filter(Boolean) : [],
      created: ts,
      updated: ts,
    },
  }, session);
  writeJson(metaPath, payload, dryRun);
  const architectHandoff = buildArchitectAuthoringHandoff(payload.meta, args, session);
  writeJson(architectHandoffPath(sessionDir, directiveSlug), architectHandoff, dryRun);
}

function cmdDirectiveSetGoals(root, args) {
  const dryRun = Boolean(args["dry-run"]);
  const { sessionDir, metaPath, doc } = requireMetaDoc(root, args.session);
  const goals = Array.isArray(args.goal) ? args.goal.map((g) => String(g).trim()).filter(Boolean) : [];
  const next = normalizeDirectiveMetaDoc(doc, args.session);
  if (!next) throw new Error("Invalid directive meta JSON");
  if (args.clear) next.meta.goals = [];
  if (goals.length > 0) next.meta.goals = goals;
  next.meta.updated = nowIso();
  writeJson(metaPath, next, dryRun);
  writeJson(
    architectHandoffPath(sessionDir, String(next.meta.directive_slug || slugify(next.meta.title || args.session))),
    buildArchitectAuthoringHandoff(next.meta, args, args.session),
    dryRun,
  );
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
  const payload = normalizeTaskDoc({
    kind: "directive_task",
    schema_version: "1.0",
    meta: {
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
  });
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

  const next = normalizeTaskDoc(doc);
  if (!next) throw new Error(`Invalid task JSON: ${taskPath}`);
  next.task = { ...(next.task && typeof next.task === "object" ? next.task : {}), ...contract };
  normalizeTaskDoc(next);
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
  const kindRaw = String(args.kind || "").trim().toLowerCase();
  const inferredKind = kindRaw || ((args["to-role"] || args["from-role"]) ? "executor" : "authoring");
  if (!["authoring", "executor"].includes(inferredKind)) {
    throw new Error("handoff create --kind must be authoring or executor");
  }
  const handoffPath = inferredKind === "authoring"
    ? architectHandoffPath(sessionDir, slug)
    : path.join(sessionDir, `${slug}.handoff.json`);
  const payload = inferredKind === "authoring"
    ? buildArchitectAuthoringHandoff(meta, args, session)
    : buildHandoffPayload(meta, args);
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
    next = normalizeTaskDoc(readJson(targetPath));
    if (!next) throw new Error(`Invalid task JSON: ${targetPath}`);
  } else {
    next = normalizeDirectiveMetaDoc(next, args.session);
    if (!next) throw new Error(`Invalid meta JSON: ${targetPath}`);
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
  if (!args.task) {
    writeJson(
      architectHandoffPath(sessionDir, String(next.meta.directive_slug || slugify(next.meta.title || args.session))),
      buildArchitectAuthoringHandoff(next.meta, args, args.session),
      dryRun,
    );
  }
}

function validateDirectiveSession(sessionDir) {
  const errors = [];
  const metaFile = findMetaFile(sessionDir);
  if (!metaFile) {
    errors.push("missing meta file");
    return errors;
  }
  const metaDoc = readJson(path.join(sessionDir, metaFile));
  if (String(metaDoc.kind || "") !== "directive_session_meta") errors.push("meta.kind must be directive_session_meta");
  const meta = metaDoc && metaDoc.meta && typeof metaDoc.meta === "object" ? metaDoc.meta : {};
  if (!String(meta.title || "").trim()) errors.push("meta.title required");
  if (!String(meta.summary || "").trim()) errors.push("meta.summary required");
  if (!String(meta.directive_slug || "").trim()) errors.push("meta.directive_slug required");

  const taskFiles = listSessionFiles(sessionDir, ".task.json");
  for (const taskFile of taskFiles) {
    const taskDoc = readJson(path.join(sessionDir, taskFile));
    if (String(taskDoc.kind || "") !== "directive_task") errors.push(`${taskFile}: kind must be directive_task`);
    const taskMeta = taskDoc && taskDoc.meta && typeof taskDoc.meta === "object" ? taskDoc.meta : {};
    if (!String(taskMeta.title || "").trim()) errors.push(`${taskFile}: meta.title required`);
    const task = taskDoc && taskDoc.task && typeof taskDoc.task === "object" ? taskDoc.task : null;
    if (!task) errors.push(`${taskFile}: task object required`);
  }

  const slug = String(meta.directive_slug || "");
  const architectFiles = listSessionFiles(sessionDir, ".architect.handoff.json");
  for (const handoffFile of architectFiles) {
    const handoffDoc = readJson(path.join(sessionDir, handoffFile));
    if (!handoffDoc || typeof handoffDoc !== "object" || Array.isArray(handoffDoc)) {
      errors.push(`${handoffFile}: object required`);
      continue;
    }
    if (String(handoffDoc.kind || "") !== "runbook_architect_handoff") {
      errors.push(`${handoffFile}: kind must be runbook_architect_handoff`);
    }
    if (!handoffDoc.handoff || typeof handoffDoc.handoff !== "object") {
      errors.push(`${handoffFile}: handoff object required`);
    } else {
      if (String(handoffDoc.handoff.from_phase || "") !== "architect-discovery") {
        errors.push(`${handoffFile}: handoff.from_phase must be architect-discovery`);
      }
      if (String(handoffDoc.handoff.to_phase || "") !== "architect-authoring") {
        errors.push(`${handoffFile}: handoff.to_phase must be architect-authoring`);
      }
    }
    if (!handoffDoc.directive || typeof handoffDoc.directive !== "object") {
      errors.push(`${handoffFile}: directive object required`);
    } else {
      if (String(handoffDoc.directive.session || "").trim() === "") {
        errors.push(`${handoffFile}: directive.session required`);
      }
      if (String(handoffDoc.directive.title || "").trim() === "") {
        errors.push(`${handoffFile}: directive.title required`);
      }
    }
  }

  const handoffFiles = listSessionFiles(sessionDir, ".handoff.json").filter((f) => !f.endsWith(".architect.handoff.json"));
  for (const handoffFile of handoffFiles) {
    const handoffDoc = readJson(path.join(sessionDir, handoffFile));
    if (!handoffDoc || typeof handoffDoc !== "object" || Array.isArray(handoffDoc) || !handoffDoc.handoff || typeof handoffDoc.handoff !== "object") {
      errors.push(`${handoffFile}: handoff object required`);
      continue;
    }
    const h = handoffDoc.handoff;
    if (!String(h.from_role || "").trim()) errors.push(`${handoffFile}: handoff.from_role required`);
    if (!String(h.to_role || "").trim()) errors.push(`${handoffFile}: handoff.to_role required`);
    if (!String(h.session_id || "").trim()) errors.push(`${handoffFile}: handoff.session_id required`);
    if (!String(h.directive_branch || "").trim()) errors.push(`${handoffFile}: handoff.directive_branch required`);
    if (!String(h.objective || "").trim()) errors.push(`${handoffFile}: handoff.objective required`);
    if (slug && String(handoffFile).replace(/\.handoff\.json$/, "") !== slug) {
      errors.push(`${handoffFile}: filename should match directive_slug '${slug}'`);
    }
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
  if (sessionFilter && sessions.length === 0) {
    stdout.write(`${JSON.stringify({ kind: "runbook_validation", ok: false, sessions: [], error: `Session not found: ${sessionFilter}` }, null, 2)}\n`);
    process.exit(1);
  }

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
  const session = String(args.session || "").trim();
  appendEventLog(root, {
    directiveSession: session,
    event: "command_start",
    payload: { command: [group, action].filter(Boolean).join(" "), session: session || null },
  });
  try {
    let result;
    if (group === "directive" && action === "create") result = cmdDirectiveCreate(root, args);
    else if (group === "directive" && action === "set-goals") result = cmdDirectiveSetGoals(root, args);
    else if (group === "task" && action === "create") result = cmdTaskCreate(root, args);
    else if (group === "task" && action === "set-contract") result = cmdTaskSetContract(root, args);
    else if (group === "handoff" && action === "create") result = cmdHandoffCreate(root, args);
    else if (group === "meta" && action === "set") result = cmdMetaSet(root, args);
    else if (group === "validate") result = cmdValidate(root, args);
    else throw new Error(`Unknown command: ${[group, action].filter(Boolean).join(" ")}`);
    appendEventLog(root, {
      directiveSession: session,
      event: "command_end",
      payload: { command: [group, action].filter(Boolean).join(" "), ok: true },
    });
    return result;
  } catch (error) {
    appendEventLog(root, {
      directiveSession: session,
      event: "command_end",
      payload: {
        command: [group, action].filter(Boolean).join(" "),
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
}

function isCommandMode(args) {
  const first = String(args._[0] || "").trim();
  return ["directive", "task", "handoff", "meta", "validate"].includes(first);
}

async function main() {
  const root = repoRoot();
  const phases = loadPhases(root);
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) {
    stdout.write(`${usage()}\n`);
    return;
  }

  if (isCommandMode(args)) {
    return dispatchCommand(root, args);
  }

  if (!args.phase && args._.length === 0) {
    const selectedDirective = await selectDirectiveInteractive(root);
    if (selectedDirective === "__create_new__") {
      const phase = "architect-discovery";
      const subphase = "active";
      if (launchCodexForPhase(root, phase, { dryRun: Boolean(args["dry-run"]), subphase, directiveContext: null })) return;
      stdout.write(`${JSON.stringify({ kind: "runbook_phase_selection", phase }, null, 2)}\n`);
      return;
    }
    const resume = detectResumeState(root, selectedDirective, phases);
    const phase = resume.phase;
    const subphase = normalizeSubphaseForPhase(phases, phase, resume.subphase);
    const dryRun = Boolean(args["dry-run"]);
    ensureDirectiveExists(root, selectedDirective);
    if (!dryRun) persistRunbookState(root, selectedDirective, phase, subphase, false);
    const directiveContext = loadDirectiveContext(root, selectedDirective);
    if (launchCodexForPhase(root, phase, { dryRun, subphase, directiveContext })) return;
    stdout.write(
      `${JSON.stringify({ kind: "runbook_phase_selection", phase, subphase, directive: selectedDirective }, null, 2)}\n`,
    );
    return;
  }

  let selected = String(args.phase || "").trim();
  if (!selected) {
    printPhaseList(phases);
    if (!(stdin.isTTY && stdout.isTTY)) return;
    selected = await selectPhaseInteractive(phases);
  }

  const found = phases.find((p) => p.id === selected);
  if (!found) throw new Error(`Unknown phase '${selected}'.`);
  const subphase = normalizeSubphaseForPhase(phases, found.id, args.subphase);
  const directive = String(args.directive || "").trim();
  const dryRun = Boolean(args["dry-run"]);
  if (directive) ensureDirectiveExists(root, directive);
  const directiveContext = directive ? loadDirectiveContext(root, directive) : null;
  if (directive && !dryRun) persistRunbookState(root, directive, found.id, subphase, false);

  if (launchCodexForPhase(root, found.id, { dryRun, subphase, directiveContext })) {
    return;
  }

  const payload = {
    kind: "runbook_phase_selection",
    phase: found.id,
    subphase,
    directive: directive || null,
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
