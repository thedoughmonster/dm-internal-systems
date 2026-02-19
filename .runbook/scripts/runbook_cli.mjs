#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";
import { stdin, stdout } from "node:process";
import { spawnSync } from "node:child_process";
import { printList, selectFromList, toPhaseOptions } from "./_list_component.mjs";

const RUNBOOK_PHASE_IDS = [
  "architect-discovery",
  "architect-authoring",
  "executor-start",
  "executor-task",
  "executor-closeout",
];

const PHASE_PROMPT_CONTRACTS = {
  "architect-discovery": {
    active: {
      containment: [
        "Conversational discovery only; do not start authoring or execution work.",
        "Do not create tasks in this subphase.",
      ],
      completion_criteria: [
        "Directive title, branch plan, goals, and definition of done are agreed.",
        "Operator explicitly approves transition to handoff.",
      ],
      git_instructions: [
        "No branch switching, rebasing, committing, or merging in this subphase.",
      ],
    },
    handoff: {
      containment: [
        "Persist only discovery artifacts and handoff metadata.",
        "Do not start architect-authoring in the same session.",
      ],
      completion_criteria: [
        "Directive artifact is created with explicit branch metadata (`--branch` on directive create).",
        "Goals/meta are persisted for the selected session.",
        "Architect handoff file is created (`runbook handoff create --kind authoring`).",
        "`runbook validate --session <id>` passes.",
      ],
      git_instructions: [
        "Artifact-only writes are allowed.",
        "No product-code git operations in this subphase.",
      ],
    },
  },
  "architect-authoring": {
    active: {
      containment: [
        "Author directive/task artifacts only.",
        "No product-code edits in this subphase.",
      ],
      completion_criteria: [
        "Task files exist with complete contracts and operator-approved scope.",
      ],
      git_instructions: [
        "Artifact-only writes are allowed.",
        "No branch switching, rebasing, committing, or merging in this subphase.",
      ],
    },
    handoff: {
      containment: [
        "Create executor handoff and stop.",
        "Do not start executor-start in the same session.",
      ],
      completion_criteria: [
        "Executor handoff artifact exists and validates cleanly.",
      ],
      git_instructions: [
        "Artifact-only writes are allowed.",
        "No product-code git operations in this subphase.",
      ],
    },
  },
  "executor-start": {
    active: {
      containment: [
        "Prepare execution context only; do not implement task code yet.",
      ],
      completion_criteria: [
        "Prerequisites and selected task are explicit.",
        "Operator confirms readiness to hand off to executor-task.",
      ],
      git_instructions: [
        "Run `runbook git prepare --session <id>` before any code edits.",
      ],
    },
    handoff: {
      containment: [
        "Finalize execution bootstrap and stop.",
        "Do not start implementation in this session.",
      ],
      completion_criteria: [
        "`runbook git prepare --session <id>` succeeds and materializes the directive branch.",
        "Next command is `runbook --phase executor-task --directive <session>`.",
      ],
      git_instructions: [
        "Directive branch must be current after prepare.",
      ],
    },
  },
  "executor-task": {
    active: {
      containment: [
        "Implement only the selected task contract scope.",
        "Do not run directive closeout in this subphase.",
      ],
      completion_criteria: [
        "Task implementation complete.",
        "Task validation commands pass.",
      ],
      git_instructions: [
        "Work on the directive branch only.",
        "Use normal task-scoped commits if commit policy requires.",
      ],
    },
    handoff: {
      containment: [
        "Persist task completion evidence and stop.",
        "Do not run closeout in this session.",
      ],
      completion_criteria: [
        "Task metadata updated with completion summary and validation status.",
        "Next command is either next executor-task run or executor-closeout.",
      ],
      git_instructions: [
        "No merge-to-base actions in this subphase.",
      ],
    },
  },
  "executor-closeout": {
    active: {
      containment: [
        "Finalize acceptance and closeout readiness only.",
      ],
      completion_criteria: [
        "All tasks and required validations are complete.",
        "Operator approves final closeout.",
      ],
      git_instructions: [
        "Prepare only closeout actions; no new feature scope.",
      ],
    },
    handoff: {
      containment: [
        "Perform final closeout and stop session.",
      ],
      completion_criteria: [
        "`runbook git closeout --session <id>` succeeds.",
        "Next-step completion command is reported to operator.",
      ],
      git_instructions: [
        "Merge/cleanup actions are allowed only in this subphase.",
      ],
    },
  },
};

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
    "  runbook directive create [--session <id> | --folder <name>] --title <text> --summary <text> [--branch <name>] [--goal <text> ...] [--dry-run]",
    "  runbook directive set-goals --session <id> [--goal <text> ...] [--clear] [--dry-run]",
    "",
    "  runbook task create --session <id> --title <text> --summary <text> [--slug <slug>] [--dry-run]",
    "  runbook task set-contract --session <id> --task <slug|file> (--json <json> | --from-file <path>) [--dry-run]",
    "",
    "  runbook handoff create --session <id> [--kind authoring|executor] --objective <text> [--from-role <role> --to-role <role> --task-file <name|null>] [--dry-run]",
    "  runbook meta set --session <id> [--task <slug|file>] --set <key=value> [--set <key=value> ...] [--dry-run]",
    "  runbook git prepare --session <id> [--no-rebase] [--fetch] [--dry-run]",
    "  runbook git closeout --session <id> [--delete-branch] [--delete-remote] [--fetch] [--no-log-export] [--dry-run]",
    "  runbook git cycle-commit [--message <text>] [--dry-run]",
    "  runbook git helper [--session <id>] [--dry-run]",
    "  runbook qa scan [--create-directive] [--force]",
    "  runbook doctor",
    "",
    "  runbook validate [--session <id>]",
    "  runbook --help",
    "",
    "Notes:",
    "  Artifact root: .runbook/directives",
  ].join("\n");
}

function commandUsage(group = "", action = "") {
  const g = String(group || "").trim();
  const a = String(action || "").trim();
  if (g === "directive" && a === "create") {
    return "Usage:\n  runbook directive create [--session <id> | --folder <name>] --title <text> --summary <text> [--branch <name>] [--goal <text> ...] [--dry-run]";
  }
  if (g === "directive" && a === "set-goals") {
    return "Usage:\n  runbook directive set-goals --session <id> [--goal <text> ...] [--clear] [--dry-run]";
  }
  if (g === "directive") {
    return [
      "Usage:",
      "  runbook directive create [--session <id> | --folder <name>] --title <text> --summary <text> [--branch <name>] [--goal <text> ...] [--dry-run]",
      "  runbook directive set-goals --session <id> [--goal <text> ...] [--clear] [--dry-run]",
    ].join("\n");
  }
  if (g === "task" && a === "create") {
    return "Usage:\n  runbook task create --session <id> --title <text> --summary <text> [--slug <slug>] [--dry-run]";
  }
  if (g === "task" && a === "set-contract") {
    return "Usage:\n  runbook task set-contract --session <id> --task <slug|file> (--json <json> | --from-file <path>) [--dry-run]";
  }
  if (g === "task") {
    return [
      "Usage:",
      "  runbook task create --session <id> --title <text> --summary <text> [--slug <slug>] [--dry-run]",
      "  runbook task set-contract --session <id> --task <slug|file> (--json <json> | --from-file <path>) [--dry-run]",
    ].join("\n");
  }
  if (g === "handoff") {
    return "Usage:\n  runbook handoff create --session <id> [--kind authoring|executor] --objective <text> [--from-role <role> --to-role <role> --task-file <name|null>] [--dry-run]";
  }
  if (g === "meta") {
    return "Usage:\n  runbook meta set --session <id> [--task <slug|file>] --set <key=value> [--set <key=value> ...] [--dry-run]";
  }
  if (g === "git" && a === "prepare") {
    return "Usage:\n  runbook git prepare --session <id> [--no-rebase] [--fetch] [--dry-run]";
  }
  if (g === "git" && a === "closeout") {
    return "Usage:\n  runbook git closeout --session <id> [--delete-branch] [--delete-remote] [--fetch] [--no-log-export] [--dry-run]";
  }
  if (g === "git" && a === "cycle-commit") {
    return "Usage:\n  runbook git cycle-commit [--message <text>] [--dry-run]";
  }
  if (g === "git" && a === "helper") {
    return "Usage:\n  runbook git helper [--session <id>] [--dry-run]";
  }
  if (g === "git") {
    return [
      "Usage:",
      "  runbook git prepare --session <id> [--no-rebase] [--fetch] [--dry-run]",
      "  runbook git closeout --session <id> [--delete-branch] [--delete-remote] [--fetch] [--no-log-export] [--dry-run]",
      "  runbook git cycle-commit [--message <text>] [--dry-run]",
      "  runbook git helper [--session <id>] [--dry-run]",
    ].join("\n");
  }
  if (g === "validate") {
    return "Usage:\n  runbook validate [--session <id>]";
  }
  if (g === "qa" && a === "scan") {
    return "Usage:\n  runbook qa scan [--create-directive] [--force]";
  }
  if (g === "qa") {
    return [
      "Usage:",
      "  runbook qa scan [--create-directive] [--force]",
    ].join("\n");
  }
  if (g === "doctor") {
    return "Usage:\n  runbook doctor";
  }
  return usage();
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

function defaultPhaseCompletionMap() {
  const map = {};
  for (const id of RUNBOOK_PHASE_IDS) {
    map[id] = {
      active_complete: false,
      handoff_complete: false,
      completed_at: null,
    };
  }
  return map;
}

function normalizePhaseCompletionMap(raw) {
  const base = defaultPhaseCompletionMap();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  for (const id of RUNBOOK_PHASE_IDS) {
    const row = raw[id];
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    base[id] = {
      active_complete: Boolean(row.active_complete),
      handoff_complete: Boolean(row.handoff_complete),
      completed_at: row.completed_at ? String(row.completed_at) : null,
    };
  }
  return base;
}

function markPhaseCompletion(meta, phaseId, subphase) {
  if (!meta || typeof meta !== "object") return;
  const phase = String(phaseId || "").trim();
  const step = String(subphase || "").trim();
  if (!RUNBOOK_PHASE_IDS.includes(phase)) return;
  if (!["active", "handoff"].includes(step)) return;
  meta.phase_completion = normalizePhaseCompletionMap(meta.phase_completion);
  if (!meta.phase_completion[phase]) {
    meta.phase_completion[phase] = {
      active_complete: false,
      handoff_complete: false,
      completed_at: null,
    };
  }
  const row = meta.phase_completion[phase];
  if (step === "active") row.active_complete = true;
  if (step === "handoff") {
    row.active_complete = true;
    row.handoff_complete = true;
  }
  if (row.active_complete && row.handoff_complete) row.completed_at = nowIso();
}

function renderPhasePromptContract(phaseId, subphase) {
  const phase = String(phaseId || "").trim();
  const step = validSubphase(subphase) ? subphase : "active";
  const contract = PHASE_PROMPT_CONTRACTS[phase]?.[step];
  if (!contract) return "";
  const asLines = (title, rows) => {
    const list = Array.isArray(rows) ? rows : [];
    if (list.length === 0) return [];
    return [title, ...list.map((line) => `- ${line}`), ""];
  };
  return [
    "Phase containment contract (explicit):",
    ...asLines("Containment:", contract.containment),
    ...asLines("Completion criteria:", contract.completion_criteria),
    ...asLines("Git instructions:", contract.git_instructions),
  ].join("\n").trim();
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
  m.directive_branch = String(m.directive_branch || `feat/${m.directive_slug}`);
  m.directive_base_branch = String(m.directive_base_branch || "dev");
  m.directive_merge_status = String(m.directive_merge_status || "open");
  m.commit_policy = String(m.commit_policy || "end_of_directive");
  m.phase_completion = normalizePhaseCompletionMap(m.phase_completion);
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
      directive_branch: String(meta.directive_branch || `feat/${String(meta.directive_slug || "directive")}`),
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

function timestampCompact(date = new Date()) {
  const yyyy = String(date.getUTCFullYear());
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mi = String(date.getUTCMinutes()).padStart(2, "0");
  const ss = String(date.getUTCSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`;
}

function copyIfExists(from, to) {
  if (!fs.existsSync(from)) return false;
  ensureDir(path.dirname(to));
  fs.copyFileSync(from, to);
  return true;
}

function exportRunbookLogs(root, session) {
  const targets = runbookLogTargets(root, { session });
  const exportRoot = path.join(root, ".runbook", "exports", safeName(session), timestampCompact());
  const sessionDir = path.join(exportRoot, "session-logs");
  const codexDir = path.join(exportRoot, "codex-logs");
  ensureDir(sessionDir);
  ensureDir(codexDir);

  const copied = [];
  const sessionRel = path.relative(root, targets.sessionLogDir);
  const codexRel = path.relative(root, targets.codexLogDir);

  if (copyIfExists(targets.transcriptPath, path.join(sessionDir, path.basename(targets.transcriptPath)))) {
    copied.push(path.join(sessionRel, path.basename(targets.transcriptPath)));
  }
  if (copyIfExists(targets.eventPath, path.join(sessionDir, path.basename(targets.eventPath)))) {
    copied.push(path.join(sessionRel, path.basename(targets.eventPath)));
  }

  if (fs.existsSync(targets.codexLogDir)) {
    for (const entry of fs.readdirSync(targets.codexLogDir, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      const src = path.join(targets.codexLogDir, entry.name);
      const dst = path.join(codexDir, entry.name);
      if (copyIfExists(src, dst)) copied.push(path.join(codexRel, entry.name));
    }
  }

  const manifest = {
    kind: "runbook_log_export",
    exported_at: nowIso(),
    session,
    source: {
      transcript: path.relative(root, targets.transcriptPath),
      events: path.relative(root, targets.eventPath),
      codex_log_dir: path.relative(root, targets.codexLogDir),
    },
    destination: path.relative(root, exportRoot),
    copied_files: copied,
  };
  writeJson(path.join(exportRoot, "manifest.json"), manifest, false);
  ensureDir(path.join(root, ".runbook", "exports", safeName(session)));
  fs.writeFileSync(path.join(root, ".runbook", "exports", safeName(session), "LATEST"), `${path.basename(exportRoot)}\n`, "utf8");
  return manifest;
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

async function promptText(question) {
  const q = String(question || "").trim();
  if (!(stdin.isTTY && stdout.isTTY)) return "";
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const response = await rl.question(q.endsWith(" ") ? q : `${q} `);
    return String(response || "").trim();
  } finally {
    rl.close();
  }
}

function sessionExists(root, session) {
  return fs.existsSync(path.join(directivesRoot(root), String(session || "").trim()));
}

function nextDeterministicSession(root, folderSlug) {
  const base = `${utcDatePrefix()}_${String(folderSlug || "").trim()}`;
  if (!sessionExists(root, base)) return base;
  let n = 2;
  while (sessionExists(root, `${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

async function resolveDirectiveSessionForCreate(root, {
  session,
  folder,
  title,
} = {}) {
  const explicitSession = String(session || "").trim();
  if (explicitSession) return explicitSession;
  let folderSource = String(folder || "").trim();
  if (!folderSource && stdin.isTTY && stdout.isTTY) {
    folderSource = await promptText("Directive folder name (used in YY-MM-DD_<slug>):");
  }
  const folderSlug = slugify(folderSource || title || "");
  if (!folderSlug) throw new Error("directive create requires --session or a valid folder/title slug source");
  return nextDeterministicSession(root, folderSlug);
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

function directiveExistingOptions(root) {
  const rows = listDirectiveSessions(root)
    .map((session) => loadDirectiveSummary(root, session))
    .filter((row) => {
      const status = String(row.status || "").toLowerCase();
      return status !== "archived";
    });
  return rows.map((row) => ({
    value: row.session,
    label: `[${row.status}] ${row.title}`,
    color: "dim",
  }));
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

async function selectExistingDirectiveInteractive(root) {
  const options = directiveExistingOptions(root);
  if (options.length === 0) throw new Error("No existing directives available.");
  return selectFromList({
    input: stdin,
    output: stdout,
    title: "Select existing directive:",
    options,
    defaultIndex: 0,
  });
}

async function selectDirectiveForPhase(root, phaseId) {
  const choice = await selectDirectiveInteractive(root);
  if (choice === "__create_new__") {
    if (phaseId === "architect-discovery") return "";
    throw new Error(`Phase '${phaseId}' requires an existing directive. Re-run and select an existing directive.`);
  }
  return choice;
}

async function selectRunbookEntryMode() {
  return selectFromList({
    input: stdin,
    output: stdout,
    title: "Runbook entry:",
    options: [
      { value: "new_discovery", label: "create a new directive via discovery", color: "cyan" },
      { value: "continue_existing", label: "continue an existing directive", color: "green" },
    ],
    defaultIndex: 0,
  });
}

async function confirmDetectedPhase(session, phase, subphase) {
  return selectFromList({
    input: stdin,
    output: stdout,
    title: `Directive: ${session}\nDetected phase: ${phase}/${subphase}\nContinue?`,
    options: [
      { value: "continue", label: "continue with detected phase", color: "green" },
      { value: "cancel", label: "cancel", color: "yellow" },
    ],
    defaultIndex: 0,
  });
}

async function confirmResumePhase(root, directive, detectedPhase, detectedSubphase, selectedPhase, selectedSubphase) {
  if (!(stdin.isTTY && stdout.isTTY)) return true;
  const choice = await selectFromList({
    input: stdin,
    output: stdout,
    title:
      `Directive: ${directive}\n` +
      `Detected phase from meta: ${detectedPhase}/${detectedSubphase}\n` +
      `Current selection: ${selectedPhase}/${selectedSubphase}\n` +
      "Continue with detected phase?",
    options: [
      { value: "detected", label: `continue ${detectedPhase}/${detectedSubphase}`, color: "green" },
      { value: "selected", label: `keep ${selectedPhase}/${selectedSubphase}`, color: "yellow" },
    ],
    defaultIndex: 0,
  });
  return choice === "detected";
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
  const taskOrder = (name) => {
    const m = String(name || "").match(/^(\d+)[-_]/);
    if (!m) return Number.MAX_SAFE_INTEGER;
    return Number(m[1]);
  };
  let selectedTask = null;
  const inProgress = rows
    .filter((r) => r.status === "in_progress")
    .sort((a, b) => {
      const byOrder = taskOrder(a.file) - taskOrder(b.file);
      if (byOrder !== 0) return byOrder;
      return b.updated - a.updated;
    });
  if (inProgress.length > 0) selectedTask = inProgress[0].file;
  if (!selectedTask) {
    const todo = rows
      .filter((r) => r.status === "todo")
      .sort((a, b) => {
        const byOrder = taskOrder(a.file) - taskOrder(b.file);
        if (byOrder !== 0) return byOrder;
        return a.file.localeCompare(b.file);
      });
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
  const repoRules = loadRepoRulesBundle(root);
  const phaseContract = renderPhasePromptContract(phaseId, subphaseName);
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
    "Phase lock policy:",
    "- This Codex session is bound to the phase/subphase above.",
    "- Do not switch phase/subphase inside this same Codex session.",
    "- When a transition is approved, finish current subphase handoff, then stop and instruct operator to exit and relaunch `runbook` with the next phase.",
    "",
    ...contextLines,
    ...(repoRules ? ["Repository rules bundle (authoritative):", "", repoRules, ""] : []),
    ...(phaseContract ? [phaseContract, ""] : []),
    body,
  ].join("\n");
}

function repoRulesBundleCandidates(root) {
  return [
    path.join(root, "docs", "repo-rules.md"),
    path.join(root, "docs", "policies", "branch-policy.md"),
    path.join(root, "docs", "policies", "deployment-safety-policy.md"),
    path.join(root, "docs", "policies", "environment-and-secrets-policy.md"),
    path.join(root, "docs", "policies", "validation-policy.md"),
    path.join(root, "docs", "policies", "contracts-and-schema-policy.md"),
    path.join(root, "docs", "policies", "documentation-and-changelog-policy.md"),
    path.join(root, "docs", "policies", "engineering", "README.md"),
  ];
}

function loadRepoRulesBundle(root) {
  const bundleCandidates = repoRulesBundleCandidates(root);
  const parts = [];
  for (const file of bundleCandidates) {
    if (!fs.existsSync(file)) continue;
    const body = String(fs.readFileSync(file, "utf8") || "").trim();
    if (!body) continue;
    const rel = path.relative(root, file) || file;
    parts.push(`## Source: ${rel}\n\n${body}`);
  }
  return parts.join("\n\n");
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

function launchCodexWithPrompt(root, prompt, {
  dryRun = false,
  directiveContext = null,
  launchLabel = "manual",
} = {}) {
  const logs = runbookLogTargets(root, directiveContext);
  const directiveSession = directiveContext?.session || "";
  if (dryRun) {
    const withDirective = directiveContext ? ` directive=${directiveContext.session}` : "";
    stdout.write(
      `[RUNBOOK] dry-run launch: codex <${launchLabel} prompt>${withDirective} log=${logs.transcriptPath}\n`,
    );
    appendEventLog(root, {
      directiveSession,
      event: "manual_launch_dry_run",
      payload: { launch_label: launchLabel, transcript: logs.transcriptPath, codex_log_dir: logs.codexLogDir },
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
    event: "manual_launch_start",
    payload: {
      launch_label: launchLabel,
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
      event: "manual_launch_fallback",
      payload: { launch_label: launchLabel, reason: "script_not_found" },
    });
    result = spawnSync("codex", ["--no-alt-screen", "-c", `log_dir=${logs.codexLogDir}`, prompt], {
      stdio: "inherit",
      env: process.env,
    });
  }
  appendEventLog(root, {
    directiveSession,
    event: "manual_launch_end",
    payload: { launch_label: launchLabel, exit_status: typeof result.status === "number" ? result.status : null },
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

async function cmdDirectiveCreate(root, args) {
  const title = String(args.title || "").trim();
  const summary = String(args.summary || "").trim();
  const dryRun = Boolean(args["dry-run"]);
  const branch = String(args.branch || "").trim() || `feat/${slugify(title)}`;
  const session = await resolveDirectiveSessionForCreate(root, {
    session: args.session,
    folder: args.folder,
    title,
  });
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
  const { doc, metaPath } = requireMetaDoc(root, session);
  const next = normalizeDirectiveMetaDoc(doc, session);
  if (!next) throw new Error(`Invalid directive meta JSON: ${metaPath}`);
  const meta = next.meta && typeof next.meta === "object" ? next.meta : {};
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
  const completedPhase = inferredKind === "authoring" ? "architect-discovery" : "architect-authoring";
  markPhaseCompletion(meta, completedPhase, "handoff");
  next.meta.updated = nowIso();
  writeJson(metaPath, next, dryRun);
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
  const appliedSets = [];
  for (const row of sets) {
    const idx = String(row).indexOf("=");
    if (idx <= 0) throw new Error(`Invalid --set '${row}', expected key=value`);
    const key = String(row).slice(0, idx).trim();
    const valueRaw = String(row).slice(idx + 1);
    const value = parseValue(valueRaw);
    setPath(next.meta, key, value);
    appliedSets.push({ key, value });
  }
  next.meta.updated = nowIso();
  writeJson(targetPath, next, dryRun);
  if (args.task) {
    const statusSet = appliedSets.find((row) => row.key === "status");
    if (!dryRun && statusSet && String(statusSet.value) === "done") {
      const directiveNext = normalizeDirectiveMetaDoc(readJson(metaPath), args.session);
      if (directiveNext && directiveNext.meta && typeof directiveNext.meta === "object") {
        markPhaseCompletion(directiveNext.meta, "executor-task", "active");
        directiveNext.meta.updated = nowIso();
        writeJson(metaPath, directiveNext, false);
      }
    }
  }
  if (!args.task) {
    writeJson(
      architectHandoffPath(sessionDir, String(next.meta.directive_slug || slugify(next.meta.title || args.session))),
      buildArchitectAuthoringHandoff(next.meta, args, args.session),
      dryRun,
    );
  }
}

function gitRun(root, argv, { allowNonZero = false } = {}) {
  const res = spawnSync("git", argv, { cwd: root, encoding: "utf8" });
  if (res.error) throw res.error;
  const code = typeof res.status === "number" ? res.status : 1;
  if (!allowNonZero && code !== 0) {
    const err = String(res.stderr || res.stdout || `git ${argv.join(" ")} failed`).trim();
    throw new Error(err);
  }
  return {
    code,
    stdout: String(res.stdout || "").trim(),
    stderr: String(res.stderr || "").trim(),
  };
}

function gitRefExists(root, ref) {
  const r = gitRun(root, ["rev-parse", "--verify", "--quiet", ref], { allowNonZero: true });
  return r.code === 0;
}

function gitHasOrigin(root) {
  const r = gitRun(root, ["remote", "get-url", "origin"], { allowNonZero: true });
  return r.code === 0;
}

const RUNBOOK_LIVE_LOG_EXCLUDES = [
  ":(exclude).runbook/codex-logs/**",
  ":(exclude).runbook/session-logs/**",
];

function assertCleanTree(root, context = "operation", { excludeRunbookLiveLogs = false } = {}) {
  const argv = ["status", "--porcelain"];
  if (excludeRunbookLiveLogs) {
    argv.push("--", ".", ...RUNBOOK_LIVE_LOG_EXCLUDES);
  }
  const status = gitRun(root, argv).stdout;
  if (status) {
    const lines = status.split("\n").filter(Boolean).slice(0, 20);
    throw new Error(`Working tree must be clean before ${context}.\n${lines.join("\n")}`);
  }
}

function cmdGitPrepare(root, args) {
  const dryRun = Boolean(args["dry-run"]);
  const noRebase = Boolean(args["no-rebase"]);
  const doFetch = Boolean(args.fetch);
  const session = String(args.session || "").trim();
  const { sessionDir, doc, metaPath } = requireMetaDoc(root, session);
  if (!fs.existsSync(sessionDir)) throw new Error(`Session not found: ${session}`);
  const meta = doc && doc.meta && typeof doc.meta === "object" ? doc.meta : {};
  const directiveBranch = String(meta.directive_branch || "").trim();
  const baseBranch = String(meta.directive_base_branch || "dev").trim();
  if (!directiveBranch) throw new Error(`Directive '${session}' is missing meta.directive_branch`);

  const actions = [];
  const guidanceCandidates = [
    ...repoRulesBundleCandidates(root),
    path.join(root, ".runbook", "instructions", "executor-start.active.md"),
  ];
  const presentGuidance = guidanceCandidates.filter((f) => fs.existsSync(f));
  actions.push({ step: "guidance_check", ok: presentGuidance.length > 0, files: guidanceCandidates, present: presentGuidance });

  if (!gitRefExists(root, baseBranch)) {
    throw new Error(`Base branch '${baseBranch}' not found locally.`);
  }

  const currentBranch = gitRun(root, ["rev-parse", "--abbrev-ref", "HEAD"]).stdout;
  const branchExists = gitRefExists(root, directiveBranch);
  const needsBranchSwitch = currentBranch !== directiveBranch;
  const mayRebase = !noRebase && branchExists;
  if (!dryRun && (needsBranchSwitch || mayRebase)) {
    assertCleanTree(root, "runbook git prepare", { excludeRunbookLiveLogs: true });
  }

  const hasOrigin = gitHasOrigin(root);
  let baseRef = baseBranch;
  if (doFetch && hasOrigin) {
    actions.push({ step: "fetch_origin", branches: [baseBranch, directiveBranch] });
    if (!dryRun) {
      gitRun(root, ["fetch", "origin", "--prune", baseBranch, directiveBranch], { allowNonZero: true });
    }
    if (gitRefExists(root, `origin/${baseBranch}`)) baseRef = `origin/${baseBranch}`;
  }

  if (currentBranch !== directiveBranch) {
    if (branchExists) {
      actions.push({ step: "checkout_branch", branch: directiveBranch });
      if (!dryRun) gitRun(root, ["checkout", directiveBranch]);
    } else {
      actions.push({ step: "create_branch", branch: directiveBranch, from: baseBranch });
      if (!dryRun) gitRun(root, ["checkout", "-b", directiveBranch, baseBranch]);
    }
  } else {
    actions.push({ step: "checkout_branch", branch: directiveBranch, skipped: true });
  }

  const marker = `runbook: start directive ${session}`;
  const markerCheck = gitRun(root, ["log", directiveBranch, "--oneline", "--grep", marker, "-n", "1"], { allowNonZero: true });
  if (!markerCheck.stdout) {
    actions.push({ step: "initial_commit", message: marker });
    if (!dryRun) gitRun(root, ["commit", "--allow-empty", "-m", marker]);
  } else {
    actions.push({ step: "initial_commit", skipped: true, reason: "already_exists" });
  }

  if (!branchExists && hasOrigin) {
    actions.push({ step: "publish_branch", remote: "origin", branch: directiveBranch });
    if (!dryRun) gitRun(root, ["push", "-u", "origin", directiveBranch], { allowNonZero: true });
  } else {
    actions.push({ step: "publish_branch", skipped: true, reason: branchExists ? "already_exists" : "no_origin" });
  }

  const branchNow = directiveBranch;
  const branchExistsNow = gitRefExists(root, branchNow);
  if (branchExistsNow) {
    const divergence = gitRun(root, ["rev-list", "--left-right", "--count", `${baseRef}...${branchNow}`]).stdout;
    const [behindRaw, aheadRaw] = divergence.split(/\s+/);
    const behind = Number(behindRaw || 0);
    const ahead = Number(aheadRaw || 0);
    actions.push({ step: "rebase_check", base: baseRef, branch: branchNow, behind, ahead });

    if (!noRebase && behind > 0) {
      actions.push({ step: "rebase", onto: baseRef });
      if (!dryRun) gitRun(root, ["rebase", baseRef]);
    } else {
      actions.push({ step: "rebase", skipped: true, reason: noRebase ? "disabled" : "not_needed" });
    }
  } else {
    actions.push({
      step: "rebase_check",
      base: baseBranch,
      branch: branchNow,
      skipped: true,
      reason: dryRun ? "dry_run_branch_not_created" : "branch_not_found",
    });
    actions.push({ step: "rebase", skipped: true, reason: "branch_not_found" });
  }

  const payload = {
    kind: "runbook_git_prepare",
    ok: true,
    session,
    directive_branch: directiveBranch,
    directive_base_branch: baseBranch,
    dry_run: dryRun,
    actions,
  };
  if (!dryRun) {
    const next = normalizeDirectiveMetaDoc(doc, session);
    if (next && next.meta && typeof next.meta === "object") {
      markPhaseCompletion(next.meta, "executor-start", "active");
      next.meta.updated = nowIso();
      writeJson(metaPath, next, false);
    }
  }
  stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

function cmdGitCloseout(root, args) {
  const dryRun = Boolean(args["dry-run"]);
  const deleteBranch = Boolean(args["delete-branch"]);
  const deleteRemote = Boolean(args["delete-remote"]);
  const doFetch = Boolean(args.fetch);
  const exportLogs = !Boolean(args["no-log-export"]);
  const session = String(args.session || "").trim();
  const { sessionDir, doc, metaPath } = requireMetaDoc(root, session);
  if (!fs.existsSync(sessionDir)) throw new Error(`Session not found: ${session}`);
  const meta = doc && doc.meta && typeof doc.meta === "object" ? doc.meta : {};
  const directiveBranch = String(meta.directive_branch || "").trim();
  const baseBranch = String(meta.directive_base_branch || "dev").trim();
  if (!directiveBranch) throw new Error(`Directive '${session}' is missing meta.directive_branch`);
  if (!gitRefExists(root, baseBranch)) throw new Error(`Base branch '${baseBranch}' not found locally.`);
  const directiveExists = gitRefExists(root, directiveBranch);
  if (!directiveExists && !dryRun) throw new Error(`Directive branch '${directiveBranch}' not found locally.`);

  const actions = [];
  const hasOrigin = gitHasOrigin(root);
  let baseRef = baseBranch;
  if (doFetch && hasOrigin) {
    actions.push({ step: "fetch_origin", branches: [baseBranch, directiveBranch] });
    if (!dryRun) gitRun(root, ["fetch", "origin", "--prune", baseBranch, directiveBranch], { allowNonZero: true });
    if (gitRefExists(root, `origin/${baseBranch}`)) baseRef = `origin/${baseBranch}`;
  }

  if (!dryRun) assertCleanTree(root, "runbook git closeout", { excludeRunbookLiveLogs: true });

  const currentBranch = gitRun(root, ["rev-parse", "--abbrev-ref", "HEAD"]).stdout;
  if (!directiveExists) {
    actions.push({ step: "checkout_branch", branch: directiveBranch, skipped: true, reason: "branch_not_found" });
    actions.push({ step: "rebase_check", base: baseRef, branch: directiveBranch, skipped: true, reason: "branch_not_found" });
    actions.push({ step: "rebase", skipped: true, reason: "branch_not_found" });
  } else {
    if (currentBranch !== directiveBranch) {
      actions.push({ step: "checkout_branch", branch: directiveBranch });
      if (!dryRun) gitRun(root, ["checkout", directiveBranch]);
    } else {
      actions.push({ step: "checkout_branch", branch: directiveBranch, skipped: true });
    }

    const divergence = gitRun(root, ["rev-list", "--left-right", "--count", `${baseRef}...${directiveBranch}`]).stdout;
    const [behindRaw] = divergence.split(/\s+/);
    const behind = Number(behindRaw || 0);
    actions.push({ step: "rebase_check", base: baseRef, branch: directiveBranch, behind });
    if (behind > 0) {
      actions.push({ step: "rebase", onto: baseRef });
      if (!dryRun) gitRun(root, ["rebase", baseRef]);
    } else {
      actions.push({ step: "rebase", skipped: true, reason: "not_needed" });
    }
  }

  actions.push({ step: "checkout_base", branch: baseBranch });
  if (!dryRun) gitRun(root, ["checkout", baseBranch]);

  if (!directiveExists) {
    actions.push({ step: "merge", from: directiveBranch, into: baseBranch, skipped: true, reason: "branch_not_found" });
  } else {
    actions.push({ step: "merge", from: directiveBranch, into: baseBranch });
  }
  if (!dryRun && directiveExists) {
    gitRun(root, ["merge", "--no-ff", directiveBranch, "-m", `runbook: merge ${session} into ${baseBranch}`]);
  }

  if (hasOrigin) {
    actions.push({ step: "push_base", remote: "origin", branch: baseBranch });
    if (!dryRun) gitRun(root, ["push", "origin", baseBranch], { allowNonZero: true });
  } else {
    actions.push({ step: "push_base", skipped: true, reason: "no_origin" });
  }

  if (deleteBranch && directiveExists) {
    actions.push({ step: "delete_branch_local", branch: directiveBranch });
    if (!dryRun) gitRun(root, ["branch", "-d", directiveBranch], { allowNonZero: true });
    if (deleteRemote && hasOrigin) {
      actions.push({ step: "delete_branch_remote", remote: "origin", branch: directiveBranch });
      if (!dryRun) gitRun(root, ["push", "origin", "--delete", directiveBranch], { allowNonZero: true });
    }
  } else {
    actions.push({ step: "delete_branch_local", skipped: true, reason: directiveExists ? "disabled" : "branch_not_found" });
  }

  if (!exportLogs) {
    actions.push({ step: "export_logs", skipped: true, reason: "disabled" });
  } else if (dryRun) {
    actions.push({ step: "export_logs", skipped: true, reason: "dry_run" });
  } else {
    try {
      const manifest = exportRunbookLogs(root, session);
      actions.push({
        step: "export_logs",
        destination: manifest.destination,
        copied_files: manifest.copied_files.length,
      });
    } catch (error) {
      actions.push({
        step: "export_logs",
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const payload = {
    kind: "runbook_git_closeout",
    ok: true,
    session,
    directive_branch: directiveBranch,
    directive_base_branch: baseBranch,
    dry_run: dryRun,
    actions,
  };
  if (!dryRun) {
    const next = normalizeDirectiveMetaDoc(doc, session);
    if (next && next.meta && typeof next.meta === "object") {
      markPhaseCompletion(next.meta, "executor-closeout", "handoff");
      next.meta.updated = nowIso();
      writeJson(metaPath, next, false);
    }
  }
  stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

function cmdGitCycleCommit(root, args) {
  const dryRun = Boolean(args["dry-run"]);
  const message = String(args.message || "runbook: phase checkpoint").trim();
  const originBranch = gitRun(root, ["rev-parse", "--abbrev-ref", "HEAD"]).stdout;

  const sessions = listDirectiveSessions(root)
    .map((session) => {
      try {
        const { doc } = requireMetaDoc(root, session);
        const meta = doc && doc.meta && typeof doc.meta === "object" ? doc.meta : {};
        return {
          session,
          status: String(meta.status || "todo"),
          branch: String(meta.directive_branch || "").trim(),
          base: String(meta.directive_base_branch || "dev").trim(),
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .filter((row) => {
      const status = String(row.status || "").toLowerCase();
      return status !== "archived" && status !== "done";
    });

  const actions = [];
  for (const row of sessions) {
    const session = row.session;
    const directivePath = `.runbook/directives/${session}`;
    const status = gitRun(root, ["status", "--porcelain", "--", directivePath], { allowNonZero: true }).stdout;
    const hasChanges = Boolean(String(status || "").trim());

    if (!hasChanges) {
      actions.push({ session, branch: row.branch, step: "scan", changed: false, committed: false });
      continue;
    }
    if (!row.branch) {
      actions.push({ session, branch: "", step: "scan", changed: true, committed: false, error: "missing directive_branch in meta" });
      continue;
    }

    const commitMsg = `${message} ${session}`;
    const rowActions = [{ step: "stash_path", path: directivePath }];
    try {
      if (!dryRun) {
        gitRun(root, ["stash", "push", "-u", "-m", `runbook-cycle-${session}`, "--", directivePath], { allowNonZero: true });
      }

      const branchExists = gitRefExists(root, row.branch);
      if (!branchExists && !dryRun) {
        gitRun(root, ["checkout", "-b", row.branch, row.base]);
      } else if (!dryRun) {
        gitRun(root, ["checkout", row.branch]);
      }
      rowActions.push({ step: "checkout", branch: row.branch, created: !branchExists });

      if (!dryRun) {
        const pop = gitRun(root, ["stash", "pop"], { allowNonZero: true });
        rowActions.push({ step: "stash_pop", code: pop.code });
        if (pop.code !== 0) throw new Error(`stash pop failed for ${session}: ${pop.stderr || pop.stdout}`);
        gitRun(root, ["add", "--", directivePath], { allowNonZero: true });
        const staged = gitRun(root, ["diff", "--cached", "--quiet", "--", directivePath], { allowNonZero: true });
        if (staged.code !== 0) {
          gitRun(root, ["commit", "-m", commitMsg]);
          rowActions.push({ step: "commit", message: commitMsg, committed: true });
        } else {
          rowActions.push({ step: "commit", skipped: true, reason: "no_staged_changes" });
        }
      } else {
        rowActions.push({ step: "checkout", branch: row.branch });
        rowActions.push({ step: "stash_pop" });
        rowActions.push({ step: "commit", message: commitMsg, planned: true });
      }
      actions.push({ session, branch: row.branch, changed: true, committed: !dryRun, planned: dryRun, steps: rowActions });
    } catch (error) {
      actions.push({
        session,
        branch: row.branch,
        changed: true,
        committed: false,
        steps: rowActions,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      if (!dryRun) {
        try { gitRun(root, ["checkout", originBranch]); } catch {}
      }
    }
  }

  const payload = {
    kind: "runbook_git_cycle_commit",
    ok: !actions.some((a) => a.error),
    dry_run: dryRun,
    origin_branch: originBranch,
    actions,
  };
  stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  if (!payload.ok) process.exit(1);
}

function buildGitDirectiveHealth(root, { sessionFilter = "" } = {}) {
  const currentBranch = gitRun(root, ["rev-parse", "--abbrev-ref", "HEAD"]).stdout;
  const hasOrigin = gitHasOrigin(root);
  const sessions = listDirectiveSessions(root)
    .filter((s) => !sessionFilter || s === sessionFilter)
    .map((session) => {
      let meta = null;
      try {
        const { doc } = requireMetaDoc(root, session);
        meta = doc?.meta || {};
      } catch {
        return {
          session,
          error: "missing_meta",
        };
      }
      const status = String(meta.status || "todo");
      if (String(status).toLowerCase() === "archived") return null;
      const directiveBranch = String(meta.directive_branch || "").trim();
      const baseBranch = String(meta.directive_base_branch || "dev").trim();
      const directivePath = `.runbook/directives/${session}`;
      const dirty = Boolean(gitRun(root, ["status", "--porcelain", "--", directivePath], { allowNonZero: true }).stdout);
      const branchExists = directiveBranch ? gitRefExists(root, directiveBranch) : false;
      const baseExists = baseBranch ? gitRefExists(root, baseBranch) : false;
      let ahead = null;
      let behind = null;
      if (branchExists && baseExists) {
        const divergence = gitRun(root, ["rev-list", "--left-right", "--count", `${baseBranch}...${directiveBranch}`], { allowNonZero: true }).stdout;
        const [behindRaw, aheadRaw] = String(divergence || "").split(/\s+/);
        behind = Number(behindRaw || 0);
        ahead = Number(aheadRaw || 0);
      }
      return {
        session,
        status,
        directive_branch: directiveBranch,
        directive_base_branch: baseBranch,
        branch_exists: branchExists,
        base_exists: baseExists,
        dirty_directive_artifacts: dirty,
        behind_base: behind,
        ahead_of_base: ahead,
        needs_rebase: typeof behind === "number" ? behind > 0 : false,
        needs_commit: dirty,
      };
    })
    .filter(Boolean);
  return {
    generated_at: nowIso(),
    current_branch: currentBranch,
    has_origin: hasOrigin,
    sessions,
  };
}

function buildGitHelperPrompt(report, { sessionFilter = "" } = {}) {
  const reportJson = JSON.stringify(report, null, 2);
  const scopeLine = sessionFilter
    ? `Scope: single directive session '${sessionFilter}'.`
    : "Scope: all active directives in this repository.";
  return [
    "Runbook git-helper mode.",
    "Use this as authoritative guidance for this session:",
    "",
    scopeLine,
    "Goal: help operator decide which directive branches need rebasing from base (usually dev), which directives need commits, and what runbook commands to run next.",
    "",
    "Rules:",
    "- Use runbook commands as the operational interface; avoid ad-hoc git unless operator explicitly asks.",
    "- Do not perform destructive actions without explicit operator approval.",
    "- First response should summarize risk and provide a prioritized action plan.",
    "- Ask for go-ahead before executing any write action.",
    "",
    "Preferred command set:",
    "- runbook git prepare --session <id>",
    "- runbook git cycle-commit",
    "- runbook git closeout --session <id>",
    "- runbook validate --session <id>",
    "",
    "Decision guidance:",
    "- If needs_rebase=true, suggest runbook git prepare for that session.",
    "- If needs_commit=true, suggest runbook git cycle-commit (or targeted commit flow if operator prefers).",
    "- If branch is missing, suggest runbook git prepare for branch materialization.",
    "",
    "Repository branch health report (live snapshot):",
    "```json",
    reportJson,
    "```",
  ].join("\n");
}

function cmdGitHelper(root, args) {
  const dryRun = Boolean(args["dry-run"]);
  const session = String(args.session || "").trim();
  if (session) ensureDirectiveExists(root, session);
  const directiveContext = session ? loadDirectiveContext(root, session) : null;
  const report = buildGitDirectiveHealth(root, { sessionFilter: session });
  const prompt = buildGitHelperPrompt(report, { sessionFilter: session });
  return launchCodexWithPrompt(root, prompt, {
    dryRun,
    directiveContext,
    launchLabel: "git-helper",
  });
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
  const phaseCompletion = normalizePhaseCompletionMap(meta.phase_completion);
  if (!phaseCompletion || typeof phaseCompletion !== "object") {
    errors.push("meta.phase_completion required");
  } else {
    for (const id of RUNBOOK_PHASE_IDS) {
      const row = phaseCompletion[id];
      if (!row || typeof row !== "object") {
        errors.push(`meta.phase_completion.${id} required`);
        continue;
      }
      if (typeof row.active_complete !== "boolean") errors.push(`meta.phase_completion.${id}.active_complete must be boolean`);
      if (typeof row.handoff_complete !== "boolean") errors.push(`meta.phase_completion.${id}.handoff_complete must be boolean`);
    }
  }

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

function validateRepoRulesBundle(root) {
  const files = repoRulesBundleCandidates(root);
  const errors = [];
  const checks = [];

  const forbiddenTokens = [
    { name: "legacy_dc_command", re: /\bdc\b/i },
    { name: "runbook_command_literal", re: /`runbook\b/i },
    { name: "runbook_internal_paths", re: /\.runbook\//i },
    { name: "workflow_phase_language", re: /\bphase\b|\bsubphase\b/i },
    { name: "role_handoff_language", re: /\bhandoff\b|\barchitect\b|\bexecutor\b/i },
  ];

  for (const file of files) {
    const rel = path.relative(root, file) || file;
    if (!fs.existsSync(file)) {
      errors.push(`missing repo rules file: ${rel}`);
      checks.push({ file: rel, ok: false, errors: ["missing"] });
      continue;
    }
    const body = String(fs.readFileSync(file, "utf8") || "");
    const fileErrors = [];
    if (!body.trim()) fileErrors.push("empty file");
    if (file.endsWith(path.join("docs", "repo-rules.md"))) {
      for (const token of forbiddenTokens) {
        if (token.re.test(body)) fileErrors.push(`forbidden_token:${token.name}`);
      }
    }
    checks.push({ file: rel, ok: fileErrors.length === 0, errors: fileErrors });
    for (const e of fileErrors) errors.push(`${rel}: ${e}`);
  }

  return { ok: errors.length === 0, files: checks, errors };
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

  const repoRules = validateRepoRulesBundle(root);
  if (!repoRules.ok) ok = false;

  const out = { kind: "runbook_validation", ok, repo_rules: repoRules, sessions: rows };
  stdout.write(`${JSON.stringify(out, null, 2)}\n`);
  if (!ok) process.exit(1);
}

function cmdDoctor(root) {
  const checks = [];

  const hooksPath = gitRun(root, ["config", "--get", "core.hooksPath"], { allowNonZero: true }).stdout;
  checks.push({
    check: "hooks_path",
    expected: ".githooks",
    actual: hooksPath || "",
    ok: hooksPath === ".githooks",
  });

  for (const file of repoRulesBundleCandidates(root)) {
    const rel = path.relative(root, file) || file;
    checks.push({ check: "repo_rule_file_present", file: rel, ok: fs.existsSync(file) });
  }

  const repoRules = validateRepoRulesBundle(root);
  checks.push({ check: "repo_rules_bundle_valid", ok: repoRules.ok });

  let clean = true;
  try {
    assertCleanTree(root, "runbook doctor", { excludeRunbookLiveLogs: true });
  } catch {
    clean = false;
  }
  checks.push({ check: "git_clean_tree_excluding_live_logs", ok: clean });

  const out = {
    kind: "runbook_doctor",
    ok: checks.every((c) => c.ok),
    checks,
  };
  stdout.write(`${JSON.stringify(out, null, 2)}\n`);
  if (!out.ok) process.exit(1);
}

async function cmdQaScan(root, args) {
  const createDirective = Boolean(args["create-directive"]);
  const forceCreate = Boolean(args.force);
  const scan = spawnSync("node", ["ops_tooling/scripts/qa/run_qa_checks.mjs"], {
    cwd: root,
    encoding: "utf8",
    env: process.env,
  });
  const stdoutText = String(scan.stdout || "").trim();
  if (!stdoutText) {
    throw new Error("QA scan produced no output");
  }
  let report;
  try {
    report = JSON.parse(stdoutText);
  } catch {
    throw new Error("QA scan output was not valid JSON");
  }

  let directive = null;
  const failures = Array.isArray(report.failures) ? report.failures : [];
  const shouldCreate = createDirective && (forceCreate || failures.length > 0);
  if (shouldCreate) {
    const now = new Date();
    const datePrefix = utcDatePrefix();
    const title = `QA remediation ${datePrefix}`;
    const slug = slugify(title);
    const session = `${datePrefix}_${slug}-${timestampCompact(now).toLowerCase()}`;
    const summary = failures.length > 0
      ? `Resolve ${failures.length} failing QA check(s) from automated full-suite scan.`
      : "Review and harden QA baseline from full-suite scan.";
    const goals = failures.length > 0
      ? failures.map((f) => `Fix failing QA check: ${String(f.id || "unknown")} (${String(f.command || "").trim()})`)
      : ["Review full QA report and create remediation tasks for robustness improvements."];

    await cmdDirectiveCreate(root, {
      session,
      title,
      summary,
      branch: `chore/${slug}`,
      goal: goals,
    });
    directive = { session, title, summary, goals_count: goals.length };
  }

  const out = {
    kind: "runbook_qa_scan_result",
    ok: Boolean(report.ok),
    report_file: report.report_file || null,
    failures,
    directive_created: directive,
  };
  stdout.write(`${JSON.stringify(out, null, 2)}\n`);
  if (!out.ok) process.exit(1);
}

async function dispatchCommand(root, args) {
  const [group, action] = args._;
  if (args.help || args.h) {
    stdout.write(`${commandUsage(group, action)}\n`);
    return;
  }
  const session = String(args.session || "").trim();
  appendEventLog(root, {
    directiveSession: session,
    event: "command_start",
    payload: { command: [group, action].filter(Boolean).join(" "), session: session || null },
  });
  try {
    let result;
    if (group === "directive" && action === "create") result = await cmdDirectiveCreate(root, args);
    else if (group === "directive" && action === "set-goals") result = cmdDirectiveSetGoals(root, args);
    else if (group === "task" && action === "create") result = cmdTaskCreate(root, args);
    else if (group === "task" && action === "set-contract") result = cmdTaskSetContract(root, args);
    else if (group === "handoff" && action === "create") result = cmdHandoffCreate(root, args);
    else if (group === "meta" && action === "set") result = cmdMetaSet(root, args);
    else if (group === "git" && action === "prepare") result = cmdGitPrepare(root, args);
    else if (group === "git" && action === "closeout") result = cmdGitCloseout(root, args);
    else if (group === "git" && action === "cycle-commit") result = cmdGitCycleCommit(root, args);
    else if (group === "git" && action === "helper") result = cmdGitHelper(root, args);
    else if (group === "validate") result = cmdValidate(root, args);
    else if (group === "qa" && action === "scan") result = await cmdQaScan(root, args);
    else if (group === "doctor") result = cmdDoctor(root, args);
    else if (group === "directive" || group === "task" || group === "handoff" || group === "meta" || group === "git" || group === "validate" || group === "qa" || group === "doctor") {
      throw new Error(`Unknown command: ${[group, action].filter(Boolean).join(" ")}\n${commandUsage(group)}`);
    } else {
      throw new Error(`Unknown command: ${[group, action].filter(Boolean).join(" ")}\n${usage()}`);
    }
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
  return ["directive", "task", "handoff", "meta", "git", "validate", "qa", "doctor"].includes(first);
}

async function main() {
  const root = repoRoot();
  const phases = loadPhases(root);
  const args = parseArgs(process.argv.slice(2));
  if (isCommandMode(args)) {
    return dispatchCommand(root, args);
  }
  if (args.help || args.h) {
    stdout.write(`${usage()}\n`);
    return;
  }

  let selected = String(args.phase || "").trim();
  const implicitInteractive = !args.phase && args._.length === 0;
  let directive = String(args.directive || "").trim();

  if (implicitInteractive) {
    if (!(stdin.isTTY && stdout.isTTY)) return;
    const mode = await selectRunbookEntryMode();
    if (mode === "new_discovery") {
      selected = "architect-discovery";
      directive = "";
    } else {
      directive = await selectExistingDirectiveInteractive(root);
      const resumed = detectResumeState(root, directive, phases);
      const detectedPhase = resumed.phase;
      const detectedSubphase = normalizeSubphaseForPhase(phases, resumed.phase, resumed.subphase);
      const decision = await confirmDetectedPhase(directive, detectedPhase, detectedSubphase);
      if (decision !== "continue") throw new Error("Selection cancelled.");
      selected = detectedPhase;
      args.subphase = detectedSubphase;
    }
  }

  if (!selected) {
    printPhaseList(phases);
    if (!(stdin.isTTY && stdout.isTTY)) return;
    selected = await selectPhaseInteractive(phases);
  }

  const found = phases.find((p) => p.id === selected);
  if (!found) throw new Error(`Unknown phase '${selected}'.`);
  const subphase = normalizeSubphaseForPhase(phases, found.id, args.subphase);
  if (!directive && !implicitInteractive && stdin.isTTY && stdout.isTTY) {
    directive = await selectDirectiveForPhase(root, found.id);
  }
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
