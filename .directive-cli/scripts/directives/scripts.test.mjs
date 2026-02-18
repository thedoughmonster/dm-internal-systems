import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import {
  directiveScopePrefixes,
  assertDirtyFilesWithinDirectiveScope,
  findTaskAllowedFileIntersections,
  lifecycleAlwaysAllowedDirtyPrefixes,
} from "./_directive_helpers.mjs";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const directivesBinRoot = path.join(repoRoot, ".directive-cli", "scripts", "directives", "bin");
const directivesRoot = path.join(repoRoot, ".directive-cli", "directives");

function run(scriptPath, args = [], options = {}) {
  return execFileSync(scriptPath, args, {
    cwd: repoRoot,
    encoding: "utf8",
    env: options.env ? { ...process.env, ...options.env } : process.env,
  });
}

function runExpectFailure(scriptPath, args = [], options = {}) {
  const result = spawnSync(scriptPath, args, {
    cwd: repoRoot,
    encoding: "utf8",
    env: options.env ? { ...process.env, ...options.env } : process.env,
  });
  assert.notEqual(result.status, 0, "Expected command to fail");
  return result;
}

function listSessions() {
  if (!fs.existsSync(directivesRoot)) return [];
  return fs
    .readdirSync(directivesRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

function listOpenSessions() {
  return listSessions().filter((session) => {
    const sessionDir = path.join(directivesRoot, session);
    const metaFile = fs.readdirSync(sessionDir).find((f) => f.endsWith(".meta.json"));
    if (!metaFile) return false;
    try {
      const doc = JSON.parse(fs.readFileSync(path.join(sessionDir, metaFile), "utf8"));
      const status = String((doc.meta && doc.meta.status) || "").toLowerCase();
      return !["archived", "done", "completed", "cancelled"].includes(status);
    } catch {
      return false;
    }
  });
}

function randomTag() {
  return `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

function findSessionByTitleSlug(titleSlug) {
  const sessions = listSessions();
  return sessions.find((name) => name.includes(titleSlug)) || "";
}

function firstTaskSlug(session) {
  const sessionDir = path.join(directivesRoot, session);
  if (!fs.existsSync(sessionDir)) return "";
  const task = fs.readdirSync(sessionDir).find((f) => f.endsWith(".task.json"));
  if (!task) return "";
  return task.replace(/\.task\.json$/u, "");
}

function firstRunnableSession() {
  const sessions = listOpenSessions();
  for (const session of sessions) {
    const task = firstTaskSlug(session);
    if (task) return { session, task };
  }
  return null;
}

test("directive scope helpers normalize allowed paths and block out-of-scope dirty files", (t) => {
  const tag = randomTag();
  const session = `itest-scope-${tag}`;
  const sessionDir = path.join(directivesRoot, session);
  const metaPath = path.join(sessionDir, "itest-scope.meta.json");
  const taskPath = path.join(sessionDir, "scope-check.task.json");

  t.after(() => {
    if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true });
  });

  fs.mkdirSync(sessionDir, { recursive: true });
  fs.writeFileSync(metaPath, `${JSON.stringify({
    kind: "directive_session_meta",
    schema_version: "1.0",
    meta: { directive_slug: "itest-scope" },
  }, null, 2)}\n`);
  fs.writeFileSync(taskPath, `${JSON.stringify({
    kind: "directive_task",
    schema_version: "1.0",
    meta: {},
    task: {
      allowed_files: [
        { path: "`apps/web/src` (edit)" },
        { path: "apps/web/..." },
        { path: ".directive-cli/scripts/directives/*" },
      ],
    },
  }, null, 2)}\n`);

  const prefixes = directiveScopePrefixes(repoRoot, sessionDir);
  const relSession = path.relative(repoRoot, sessionDir).replace(/\\/g, "/");
  assert.ok(prefixes.includes(relSession));
  assert.ok(prefixes.includes("apps/web/src"));
  assert.ok(prefixes.includes("apps/web"));
  assert.ok(prefixes.includes(".directive-cli/scripts/directives"));

  assert.doesNotThrow(() =>
    assertDirtyFilesWithinDirectiveScope(repoRoot, sessionDir, [
      "apps/web/src/example.ts",
      `${relSession}/itest-scope.meta.json`,
    ]),
  );

  assert.throws(
    () => assertDirtyFilesWithinDirectiveScope(repoRoot, sessionDir, ["README.md"]),
    /Out-of-scope dirty files detected/,
  );
});

test("lifecycle global dirty allowlist includes Next.js dev artifacts", () => {
  const allow = lifecycleAlwaysAllowedDirtyPrefixes();
  assert.ok(allow.includes("apps/web/tsconfig.json"));
  assert.ok(allow.includes("apps/web/.next/dev"));
  assert.ok(allow.includes(".directive-cli/state"));
  assert.ok(allow.includes("directive-cli/state"));

  const session = listOpenSessions()[0];
  assert.ok(session, "Expected at least one non-archived session");
  const sessionDir = path.join(directivesRoot, session);

  assert.doesNotThrow(() =>
    assertDirtyFilesWithinDirectiveScope(repoRoot, sessionDir, [
      "apps/web/tsconfig.json",
      "apps/web/.next/dev/types/routes.d.ts",
      ".directive-cli/state/pending-directive-new-example.json",
    ]),
  );
});

test("task allowed_files intersection helper detects overlaps", (t) => {
  const tag = randomTag();
  const session = `itest-intersections-${tag}`;
  const sessionDir = path.join(directivesRoot, session);

  t.after(() => {
    if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true });
  });

  fs.mkdirSync(sessionDir, { recursive: true });
  fs.writeFileSync(path.join(sessionDir, "scope-a.task.json"), `${JSON.stringify({
    kind: "directive_task",
    schema_version: "1.0",
    meta: { id: "11111111-1111-4111-8111-111111111111", depends_on: [] },
    task: { allowed_files: [{ path: "apps/web/app/vendors" }] },
  }, null, 2)}\n`);
  fs.writeFileSync(path.join(sessionDir, "scope-b.task.json"), `${JSON.stringify({
    kind: "directive_task",
    schema_version: "1.0",
    meta: { id: "22222222-2222-4222-8222-222222222222", depends_on: [] },
    task: { allowed_files: [{ path: "apps/web/app" }] },
  }, null, 2)}\n`);

  const hits = findTaskAllowedFileIntersections(sessionDir);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].task_a, "scope-a.task.json");
  assert.equal(hits[0].task_b, "scope-b.task.json");
  assert.equal(hits[0].linked_by_dependency, false);
});

test("directive start fails with strict overlap mode when task scopes intersect", (t) => {
  const tag = randomTag();
  const session = `itest-start-overlap-${tag}`;
  const sessionDir = path.join(directivesRoot, session);
  const metaSlug = "itest-start-overlap";
  const branch = run("git", ["rev-parse", "--abbrev-ref", "HEAD"]).trim();

  t.after(() => {
    if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true });
  });

  fs.mkdirSync(sessionDir, { recursive: true });
  fs.writeFileSync(path.join(sessionDir, `${metaSlug}.meta.json`), `${JSON.stringify({
    kind: "directive_session_meta",
    schema_version: "1.0",
    meta: {
      id: "33333333-3333-4333-8333-333333333333",
      directive_slug: metaSlug,
      directive_branch: branch,
      directive_base_branch: "dev",
      commit_policy: "per_task",
    },
  }, null, 2)}\n`);
  fs.writeFileSync(path.join(sessionDir, "a.task.json"), `${JSON.stringify({
    kind: "directive_task",
    schema_version: "1.0",
    meta: { id: "44444444-4444-4444-8444-444444444444", depends_on: [] },
    task: { allowed_files: [{ path: "apps/web/app/vendors" }] },
  }, null, 2)}\n`);
  fs.writeFileSync(path.join(sessionDir, "b.task.json"), `${JSON.stringify({
    kind: "directive_task",
    schema_version: "1.0",
    meta: { id: "55555555-5555-4555-8555-555555555555", depends_on: [] },
    task: { allowed_files: [{ path: "apps/web/app" }] },
  }, null, 2)}\n`);

  const result = runExpectFailure(path.join(directivesBinRoot, "cli"), [
    "directive",
    "start",
    "--session",
    session,
    "--dry-run",
    "--strict-overlaps",
  ]);
  const text = `${result.stdout}\n${result.stderr}`;
  assert.match(text, /Task allowlist intersections detected/);
});

test("directive start prompt overlap mode errors in non-interactive runs", (t) => {
  const tag = randomTag();
  const session = `itest-start-overlap-prompt-${tag}`;
  const sessionDir = path.join(directivesRoot, session);
  const metaSlug = "itest-start-overlap-prompt";
  const branch = run("git", ["rev-parse", "--abbrev-ref", "HEAD"]).trim();

  t.after(() => {
    if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true });
  });

  fs.mkdirSync(sessionDir, { recursive: true });
  fs.writeFileSync(path.join(sessionDir, `${metaSlug}.meta.json`), `${JSON.stringify({
    kind: "directive_session_meta",
    schema_version: "1.0",
    meta: {
      id: "66666666-6666-4666-8666-666666666666",
      directive_slug: metaSlug,
      directive_branch: branch,
      directive_base_branch: "dev",
      commit_policy: "per_task",
    },
  }, null, 2)}\n`);
  fs.writeFileSync(path.join(sessionDir, "a.task.json"), `${JSON.stringify({
    kind: "directive_task",
    schema_version: "1.0",
    meta: { id: "77777777-7777-4777-8777-777777777777", depends_on: [] },
    task: { allowed_files: [{ path: "apps/web/app/vendors" }] },
  }, null, 2)}\n`);
  fs.writeFileSync(path.join(sessionDir, "b.task.json"), `${JSON.stringify({
    kind: "directive_task",
    schema_version: "1.0",
    meta: { id: "88888888-8888-4888-8888-888888888888", depends_on: [] },
    task: { allowed_files: [{ path: "apps/web/app" }] },
  }, null, 2)}\n`);

  const result = runExpectFailure(path.join(directivesBinRoot, "cli"), [
    "directive",
    "start",
    "--session",
    session,
    "--dry-run",
    "--overlap-mode",
    "prompt",
  ]);
  const text = `${result.stdout}\n${result.stderr}`;
  assert.match(text, /non-interactive mode/);
});

test("directives-cli help exposes expected command set", () => {
  const output = run(path.join(directivesBinRoot, "cli"), ["help"]);
  assert.match(output, /Commands \(single list\)/);
  assert.match(output, /Help filters/);
  assert.match(output, /init/);
  assert.match(output, /directive/);
  assert.match(output, /meta/);
  assert.match(output, /directive new/);
  assert.match(output, /directive task/);
  assert.match(output, /directive handoff/);
  assert.match(output, /directive list/);
  assert.match(output, /directive view/);
  assert.match(output, /directive start/);
  assert.match(output, /directive finish/);
  assert.match(output, /directive archive/);
  assert.match(output, /directive merge/);
  assert.match(output, /directive cleanup/);
  assert.match(output, /task start/);
  assert.match(output, /task finish/);
  assert.match(output, /repo map/);
  assert.match(output, /policy/);
  assert.match(output, /policy validate/);
  assert.match(output, /runbook/);
  assert.match(output, /meta update/);
  assert.match(output, /codex usage/);
  assert.match(output, /validate/);
  assert.match(output, /context/);
  assert.match(output, /launch codex/);
  assert.match(output, /launch switch/);
  assert.match(output, /launch handoff/);
});

test("dc subcommands support --help", () => {
  const helpCommands = [
    ["directive", "new", "--help"],
    ["directive", "task", "--help"],
    ["directive", "handoff", "--help"],
    ["directive", "list", "--help"],
    ["directive", "view", "--help"],
    ["directive", "start", "--help"],
    ["directive", "finish", "--help"],
    ["directive", "archive", "--help"],
    ["directive", "merge", "--help"],
    ["directive", "cleanup", "--help"],
    ["directive", "migrate", "--help"],
    ["task", "start", "--help"],
    ["task", "finish", "--help"],
    ["meta", "update", "--help"],
    ["meta", "architect", "--help"],
    ["meta", "executor", "--help"],
    ["runbook", "--help"],
    ["context", "build", "--help"],
    ["context", "check", "--help"],
    ["context", "show", "--help"],
    ["context", "bootstrap", "--help"],
    ["context", "start", "--help"],
    ["context", "switch", "--help"],
    ["context", "handoff", "--help"],
    ["codex", "usage", "--help"],
    ["policy", "validate", "--help"],
    ["repo", "map", "--help"],
    ["validate", "--help"],
    ["test", "--help"],
  ];

  for (const args of helpCommands) {
    const output = run(path.join(directivesBinRoot, "cli"), args);
    if (args[0] === "repo" && args[1] === "map") {
      assert.match(output, /Repo root/, `Expected repo map output for: dc ${args.join(" ")}`);
      continue;
    }
    assert.match(output, /Usage:/, `Expected Usage output for: dc ${args.join(" ")}`);
  }
});

test("codex usage summarizes token deltas from log file window", (t) => {
  const tag = randomTag();
  const fakeLog = path.join("/tmp", `codex-usage-${tag}.log`);
  t.after(() => {
    if (fs.existsSync(fakeLog)) fs.rmSync(fakeLog, { force: true });
  });

  const sample = [
    "2026-02-15T00:00:00.000000Z  INFO session_loop{thread_id=thread-a}: codex_core::codex: post sampling token usage turn_id=1 total_usage_tokens=100 estimated_token_count=Some(80) auto_compact_limit=244800 token_limit_reached=false needs_follow_up=false",
    "2026-02-15T00:30:00.000000Z  INFO session_loop{thread_id=thread-a}: codex_core::codex: post sampling token usage turn_id=2 total_usage_tokens=160 estimated_token_count=Some(120) auto_compact_limit=244800 token_limit_reached=false needs_follow_up=false",
    "2026-02-15T01:00:00.000000Z  INFO session_loop{thread_id=thread-b}: codex_core::codex: post sampling token usage turn_id=1 total_usage_tokens=40 estimated_token_count=Some(30) auto_compact_limit=244800 token_limit_reached=false needs_follow_up=false",
    "2026-02-15T01:30:00.000000Z  INFO session_loop{thread_id=thread-b}: codex_core::codex: post sampling token usage turn_id=2 total_usage_tokens=90 estimated_token_count=Some(70) auto_compact_limit=244800 token_limit_reached=false needs_follow_up=false",
  ].join("\n");
  fs.writeFileSync(fakeLog, `${sample}\n`, "utf8");

  const output = run(path.join(directivesBinRoot, "cli"), [
    "codex",
    "usage",
    "--log-file",
    fakeLog,
    "--since",
    "2026-02-15T00:00:00Z",
    "--until",
    "2026-02-15T02:00:00Z",
    "--json",
  ]);
  const doc = JSON.parse(output);
  assert.equal(doc.kind, "codex_usage_window");
  assert.equal(doc.session_count, 2);
  assert.equal(doc.total_usage_tokens, 110);
  assert.ok(Array.isArray(doc.top));
  assert.ok(doc.top.some((s) => s.thread_id === "thread-a" && s.usage_tokens === 60));
  assert.ok(doc.top.some((s) => s.thread_id === "thread-b" && s.usage_tokens === 50));
});

test("architect authoring lock blocks execution-oriented commands before task selection", () => {
  const sessions = listOpenSessions();
  assert.ok(sessions.length > 0, "Expected at least one non-archived directive session");
  const result = runExpectFailure(path.join(directivesBinRoot, "cli"), [
    "directive",
    "archive",
    "--session",
    sessions[0],
    "--dry-run",
  ], {
    env: {
      DC_ROLE: "architect",
      DC_DIRECTIVE_SESSION: sessions[0],
      DC_TASK_SLUG: "",
    },
  });
  const text = `${result.stdout}\n${result.stderr}`;
  assert.match(text, /architect authoring lock/i);
});

test("architect authoring lock allows launch handoff transition command", () => {
  const target = firstRunnableSession();
  assert.ok(target, "Expected at least one non-archived directive session with a task");
  const tag = randomTag();
  const tmpCodex = path.join("/tmp", `dc-authoring-lock-handoff-${tag}`);
  const tmpBundleDir = path.join("/tmp", `dc-authoring-lock-handoff-bundle-${tag}`);

  const output = run(path.join(directivesBinRoot, "cli"), [
    "launch",
    "handoff",
    "--bootstrap",
    "--codex-home",
    tmpCodex,
    "--role",
    "executor",
    "--from-role",
    "architect",
    "--profile",
    "itest_arch_lock_handoff",
    "--directive",
    target.session,
    "--task",
    target.task,
    "--codex-bin",
    "/bin/true",
    "--out",
    path.join(tmpBundleDir, "compiled.md"),
    "--meta",
    path.join(tmpBundleDir, "compiled.meta.json"),
    "--dry-run",
    "--no-prompt",
  ], {
    env: {
      DC_ROLE: "architect",
      DC_DIRECTIVE_SESSION: target.session,
      DC_TASK_SLUG: "",
    },
  });
  assert.match(output, /Creating handoff artifact for role transition architect -> executor/);
});

test("architect write scope guard blocks authoring when non-directive files are dirty", (t) => {
  const sessions = listOpenSessions();
  assert.ok(sessions.length > 0, "Expected at least one non-archived directive session");
  const dirtyFile = path.join(repoRoot, "apps/web/.architect-scope-guard-itest.tmp");

  t.after(() => {
    if (fs.existsSync(dirtyFile)) fs.rmSync(dirtyFile, { force: true });
  });

  fs.mkdirSync(path.dirname(dirtyFile), { recursive: true });
  fs.writeFileSync(dirtyFile, "itest\n", "utf8");

  const result = runExpectFailure(path.join(directivesBinRoot, "cli"), [
    "directive",
    "task",
    "--session",
    sessions[0],
    "--title",
    "itest guard",
    "--summary",
    "itest guard",
    "--dry-run",
    "--no-prompt",
  ], {
    env: {
      DC_NAMESPACE: "agent",
      DC_ROLE: "architect",
      DC_DIRECTIVE_SESSION: sessions[0],
      DC_TASK_SLUG: "",
    },
  });
  const text = `${result.stdout}\n${result.stderr}`;
  assert.match(text, /Architect Write Scope Guard/i);
});

test("runbook phase guard blocks out-of-phase commands", () => {
  const sessions = listOpenSessions();
  assert.ok(sessions.length > 0, "Expected at least one non-archived directive session");
  const result = runExpectFailure(path.join(directivesBinRoot, "cli"), [
    "directive",
    "task",
    "--session",
    sessions[0],
    "--title",
    "itest phase guard",
    "--summary",
    "itest phase guard",
    "--dry-run",
    "--no-prompt",
  ], {
    env: {
      DC_NAMESPACE: "agent",
      DC_ROLE: "executor",
      DC_RUNBOOK_PHASE: "executor-start",
    },
  });
  const text = `${result.stdout}\n${result.stderr}`;
  assert.match(text, /runbook phase guard/i);
});

test("runbook phase guard allows in-phase commands", () => {
  const output = run(path.join(directivesBinRoot, "cli"), [
    "directive",
    "list",
    "--json",
  ], {
    env: {
      DC_NAMESPACE: "agent",
      DC_ROLE: "architect",
      DC_RUNBOOK_PHASE: "architect-discovery",
    },
  });
  const doc = JSON.parse(output);
  assert.ok(Array.isArray(doc.rows) || Array.isArray(doc.directives));
});

test("runbook phase guard allows directive new in architect-discovery", () => {
  const output = run(path.join(directivesBinRoot, "cli"), [
    "directive",
    "new",
    "--title",
    "itest phase discovery new",
    "--summary",
    "itest summary",
    "--dry-run",
    "--no-prompt",
  ], {
    env: {
      DC_NAMESPACE: "agent",
      DC_ROLE: "architect",
      DC_RUNBOOK_PHASE: "architect-discovery",
    },
  });
  assert.match(output, /Created|Would create|Session:/i);
});

test("architect authoring phase enforces directive branch alignment", (t) => {
  const tag = randomTag();
  const session = `itest-arch-branch-${tag}`;
  const sessionDir = path.join(directivesRoot, session);
  const slug = "itest-arch-branch";
  const metaPath = path.join(sessionDir, `${slug}.meta.json`);

  t.after(() => {
    if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true });
  });

  fs.mkdirSync(sessionDir, { recursive: true });
  fs.writeFileSync(metaPath, `${JSON.stringify({
    kind: "directive_session_meta",
    schema_version: "1.0",
    meta: {
      id: "99999999-9999-4999-8999-999999999999",
      directive_slug: slug,
      directive_branch: "feature/itest-architect-branch-guard",
      directive_base_branch: "dev",
      commit_policy: "end_of_directive",
      title: "itest architect branch guard",
      summary: "itest architect branch guard",
      status: "todo",
    },
  }, null, 2)}\n`);

  const result = runExpectFailure(path.join(directivesBinRoot, "cli"), [
    "directive",
    "list",
    "--json",
  ], {
    env: {
      DC_NAMESPACE: "agent",
      DC_ROLE: "architect",
      DC_RUNBOOK_PHASE: "architect-authoring",
      DC_DIRECTIVE_SESSION: session,
    },
  });
  const text = `${result.stdout}\n${result.stderr}`;
  assert.match(text, /architect authoring branch guard/i);
});

test("launch handoff is allowed in agent namespace", () => {
  const target = firstRunnableSession();
  assert.ok(target, "Expected at least one non-archived directive session with a task");
  const tag = randomTag();
  const tmpCodex = path.join("/tmp", `dc-agent-ns-handoff-${tag}`);
  const tmpBundleDir = path.join("/tmp", `dc-agent-ns-handoff-bundle-${tag}`);

  const output = run(path.join(directivesBinRoot, "cli"), [
    "launch",
    "handoff",
    "--bootstrap",
    "--codex-home",
    tmpCodex,
    "--role",
    "executor",
    "--from-role",
    "architect",
    "--profile",
    "itest_agent_ns_handoff",
    "--directive",
    target.session,
    "--task",
    target.task,
    "--codex-bin",
    "/bin/true",
    "--out",
    path.join(tmpBundleDir, "compiled.md"),
    "--meta",
    path.join(tmpBundleDir, "compiled.meta.json"),
    "--dry-run",
    "--no-prompt",
  ], {
    env: {
      DC_NAMESPACE: "agent",
      DC_ROLE: "architect",
    },
  });
  assert.match(output, /Creating handoff artifact for role transition architect -> executor/);
});

test("policy validate passes for required policy files", () => {
  const output = run(path.join(directivesBinRoot, "cli"), ["policy", "validate"]);
  assert.match(output, /Policy validation passed/);
});

test("directive list supports detailed and field output in json mode", () => {
  const output = run(path.join(directivesBinRoot, "cli"), [
    "directive",
    "list",
    "--detailed",
    "--field",
    "owner",
    "--json",
  ]);
  const doc = JSON.parse(output);
  assert.equal(doc.mode, "detailed");
  assert.ok(Array.isArray(doc.fields));
  assert.ok(doc.fields.includes("owner"));
  assert.ok(Array.isArray(doc.rows));
  if (doc.rows.length > 0) {
    assert.ok(Object.prototype.hasOwnProperty.call(doc.rows[0], "status"));
    assert.ok(Object.prototype.hasOwnProperty.call(doc.rows[0], "title"));
    assert.ok(Object.prototype.hasOwnProperty.call(doc.rows[0], "owner"));
  }
});

test("repo map command prints key paths", () => {
  const output = run(path.join(directivesBinRoot, "cli"), ["repo", "map"]);
  assert.match(output, /Repo root/);
  assert.match(output, /Directive sessions/);
});

test("runbook executor-task-cycle pre works in dry-run mode", () => {
  const sessions = listSessions();
  assert.ok(sessions.length > 0, "Expected at least one existing directive session");
  let selectedSession = "";
  let firstTaskFile = "";
  for (const session of sessions) {
    const sessionDir = path.join(directivesRoot, session);
    const task = fs.readdirSync(sessionDir).find((f) => f.endsWith(".task.json"));
    if (!task) continue;
    const taskSlugCandidate = task.replace(/\.task\.json$/, "");
    const trial = spawnSync(path.join(directivesBinRoot, "cli"), [
      "runbook",
      "executor-task-cycle",
      "--session",
      session,
      "--task",
      taskSlugCandidate,
      "--phase",
      "pre",
      "--dry-run",
    ], { cwd: repoRoot, encoding: "utf8" });
    if (trial.status === 0) {
      selectedSession = session;
      firstTaskFile = task;
      break;
    }
  }
  assert.ok(selectedSession, "Expected at least one session with task files");
  const taskSlug = firstTaskFile.replace(/\.task\.json$/, "");

  const output = run(path.join(directivesBinRoot, "cli"), [
    "runbook",
    "executor-task-cycle",
    "--session",
    selectedSession,
    "--task",
    taskSlug,
    "--phase",
    "pre",
    "--dry-run",
  ]);
  assert.match(output, /PAUSE_FOR_IMPLEMENTATION/);
});

test("runbook executor-task-cycle pre requires confirmation token in non-dry-run", () => {
  const sessions = listSessions();
  assert.ok(sessions.length > 0, "Expected at least one existing directive session");
  let selectedSession = "";
  let firstTaskFile = "";
  for (const session of sessions) {
    const sessionDir = path.join(directivesRoot, session);
    const task = fs.readdirSync(sessionDir).find((f) => f.endsWith(".task.json"));
    if (!task) continue;
    selectedSession = session;
    firstTaskFile = task;
    break;
  }
  assert.ok(selectedSession, "Expected at least one session with task files");
  const taskSlug = firstTaskFile.replace(/\.task\.json$/, "");

  const result = runExpectFailure(path.join(directivesBinRoot, "cli"), [
    "runbook",
    "executor-task-cycle",
    "--session",
    selectedSession,
    "--task",
    taskSlug,
    "--phase",
    "pre",
  ]);
  const text = `${result.stdout}\n${result.stderr}`;
  assert.match(text, /requires --confirm executor-task-cycle-pre/);
});

test("runbook executor-directive-closeout requires qa-status in non-interactive mode", () => {
  const sessions = listSessions();
  assert.ok(sessions.length > 0, "Expected at least one existing directive session");
  const result = runExpectFailure(path.join(directivesBinRoot, "cli"), [
    "runbook",
    "executor-directive-closeout",
    "--session",
    sessions[0],
    "--confirm",
    "executor-directive-closeout",
  ]);
  const text = `${result.stdout}\n${result.stderr}`;
  assert.match(text, /requires --qa-status <pass\|fail\|skip> in non-interactive mode/);
});

test("directive start is blocked when DC_ROLE is architect", () => {
  const sessions = listSessions();
  assert.ok(sessions.length > 0, "Expected at least one existing directive session");
  const result = runExpectFailure(path.join(directivesBinRoot, "cli"), [
    "directive",
    "start",
    "--session",
    sessions[0],
    "--dry-run",
  ], { env: { DC_ROLE: "architect" } });
  const text = `${result.stdout}\n${result.stderr}`;
  assert.match(text, /Executor lifecycle command blocked in role 'architect'/);
});

test("directive cleanup dry-run executes for a valid session", () => {
  const sessions = listOpenSessions();
  assert.ok(sessions.length > 0, "Expected at least one non-archived directive session");

  let selectedSession = "";
  for (const session of sessions) {
    const trial = spawnSync(path.join(directivesBinRoot, "cli"), [
      "directive",
      "cleanup",
      "--session",
      session,
      "--dry-run",
    ], { cwd: repoRoot, encoding: "utf8" });
    if (trial.status === 0) {
      selectedSession = session;
      break;
    }
  }
  assert.ok(selectedSession, "Expected at least one cleanup-eligible session for dry-run");

  const output = run(path.join(directivesBinRoot, "cli"), [
    "directive",
    "cleanup",
    "--session",
    selectedSession,
    "--dry-run",
  ]);
  assert.match(output, /Dry run only/);
});

test("directive archive dry-run executes for a valid session", () => {
  const sessions = listOpenSessions();
  assert.ok(sessions.length > 0, "Expected at least one non-archived directive session");

  let selectedSession = "";
  for (const session of sessions) {
    const trial = spawnSync(path.join(directivesBinRoot, "cli"), [
      "directive",
      "archive",
      "--session",
      session,
      "--dry-run",
    ], { cwd: repoRoot, encoding: "utf8" });
    if (trial.status === 0) {
      selectedSession = session;
      break;
    }
  }
  assert.ok(selectedSession, "Expected at least one archive-eligible session for dry-run");

  const output = run(path.join(directivesBinRoot, "cli"), [
    "directive",
    "archive",
    "--session",
    selectedSession,
    "--dry-run",
  ]);
  assert.match(output, /meta.status=archived/);
});

test("directive archive supports multiple sessions via comma list in dry-run", (t) => {
  const tag = randomTag();
  const sessions = [`itest-archive-multi-a-${tag}`, `itest-archive-multi-b-${tag}`];
  const titles = [`archive multi a ${tag}`, `archive multi b ${tag}`];

  t.after(() => {
    for (const sessionName of sessions) {
      const sessionDir = path.join(directivesRoot, sessionName);
      if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true });
    }
  });

  for (let i = 0; i < sessions.length; i += 1) {
    run(path.join(directivesBinRoot, "newdirective"), [
      "--session",
      sessions[i],
      "--title",
      titles[i],
      "--summary",
      "archive multi test",
      "--no-git",
      "--no-prompt",
    ]);
  }

  const output = run(path.join(directivesBinRoot, "cli"), [
    "directive",
    "archive",
    "--session",
    `${sessions[0]},${sessions[1]}`,
    "--dry-run",
  ]);
  assert.match(output, new RegExp(`Directive archive: ${sessions[0]}`));
  assert.match(output, new RegExp(`Directive archive: ${sessions[1]}`));
});

test("directive merge dry-run executes for a merge-candidate session when available", () => {
  const sessions = listSessions();
  let selectedSession = "";
  for (const session of sessions) {
    const sessionDir = path.join(directivesRoot, session);
    const metaFile = fs.readdirSync(sessionDir).find((f) => f.endsWith(".meta.json"));
    if (!metaFile) continue;
    const doc = JSON.parse(fs.readFileSync(path.join(sessionDir, metaFile), "utf8"));
    const meta = doc.meta || {};
    const branch = String(meta.directive_branch || "").trim();
    const base = String(meta.directive_base_branch || "dev").trim() || "dev";
    if (!branch || branch === base) continue;

    const hasLocal = spawnSync("git", ["show-ref", "--verify", `refs/heads/${branch}`], { cwd: repoRoot, encoding: "utf8" }).status === 0;
    const hasRemote = spawnSync("git", ["show-ref", "--verify", `refs/remotes/origin/${branch}`], { cwd: repoRoot, encoding: "utf8" }).status === 0;
    const sourceRef = hasLocal ? branch : (hasRemote ? `origin/${branch}` : "");
    if (!sourceRef) continue;
    const merged = spawnSync("git", ["merge-base", "--is-ancestor", sourceRef, base], { cwd: repoRoot, encoding: "utf8" }).status === 0;
    if (merged) continue;

    selectedSession = session;
    break;
  }

  if (!selectedSession) {
    return;
  }

  const output = run(path.join(directivesBinRoot, "cli"), [
    "directive",
    "merge",
    "--session",
    selectedSession,
    "--dry-run",
  ]);
  assert.match(output, /directive_merge_status=merged/);
});

test("dc init writes config with explicit agent/model", (t) => {
  const tag = randomTag();
  const configPath = path.join("/tmp", `dc-init-${tag}.json`);

  t.after(() => {
    if (fs.existsSync(configPath)) fs.rmSync(configPath, { force: true });
  });

  const output = run(path.join(directivesBinRoot, "cli"), [
    "init",
    "--agent",
    "codex",
    "--model",
    "gpt-5.2",
    "--config",
    configPath,
    "--no-prompt",
  ]);
  assert.match(output, /Initialized dc config/);
  assert.ok(fs.existsSync(configPath), "Expected init config file to be created");
  const doc = JSON.parse(fs.readFileSync(configPath, "utf8"));
  assert.equal(doc.agent.name, "codex");
  assert.equal(doc.model.name, "gpt-5.2");
});

test("dc init writes optional role homes mapping", (t) => {
  const tag = randomTag();
  const configPath = path.join("/tmp", `dc-init-homes-${tag}.json`);

  t.after(() => {
    if (fs.existsSync(configPath)) fs.rmSync(configPath, { force: true });
  });

  run(path.join(directivesBinRoot, "cli"), [
    "init",
    "--agent",
    "codex",
    "--model",
    "gpt-5.3-codex",
    "--home-default",
    "/tmp/.codex-default",
    "--home-architect",
    "/tmp/.codex-architect",
    "--home-executor",
    "/tmp/.codex-executor",
    "--config",
    configPath,
    "--no-prompt",
  ]);
  const doc = JSON.parse(fs.readFileSync(configPath, "utf8"));
  assert.equal(doc.homes.default, "/tmp/.codex-default");
  assert.equal(doc.homes.architect, "/tmp/.codex-architect");
  assert.equal(doc.homes.executor, "/tmp/.codex-executor");
});

test("newdirective dry-run emits json session metadata path", () => {
  const output = run(path.join(directivesBinRoot, "newdirective"), [
    "--dry-run",
    "--title",
    "test directive",
    "--summary",
    "test summary",
  ]);
  assert.match(output, /\.meta\.json/);
  assert.doesNotMatch(output, /README\.md/);
});

test("newdirective dry-run includes goals from repeatable --goal flags", () => {
  const output = run(path.join(directivesBinRoot, "newdirective"), [
    "--dry-run",
    "--title",
    "goal test directive",
    "--summary",
    "goal summary",
    "--goal",
    "first goal",
    "--goal",
    "second goal",
    "--no-prompt",
  ]);
  const jsonStart = output.indexOf("{");
  assert.ok(jsonStart >= 0, "Expected JSON payload in dry-run output");
  const doc = JSON.parse(output.slice(jsonStart));
  assert.deepEqual(doc.meta.goals, ["first goal", "second goal"]);
});

test("newdirective dry-run supports --branch-type for directive branch naming", () => {
  const output = run(path.join(directivesBinRoot, "newdirective"), [
    "--dry-run",
    "--title",
    "branch type test",
    "--summary",
    "summary",
    "--branch-type",
    "hotfix",
    "--no-prompt",
  ]);
  const jsonStart = output.indexOf("{");
  assert.ok(jsonStart >= 0, "Expected JSON payload in dry-run output");
  const doc = JSON.parse(output.slice(jsonStart));
  assert.equal(doc.meta.directive_branch, "hotfix/branch-type-test");
});

test("newdirective fails on invalid --branch-type", () => {
  const result = runExpectFailure(path.join(directivesBinRoot, "newdirective"), [
    "--dry-run",
    "--title",
    "invalid branch type",
    "--summary",
    "summary",
    "--branch-type",
    "banana",
    "--no-prompt",
  ]);
  const text = `${result.stdout}\n${result.stderr}`;
  assert.match(text, /Invalid --branch-type value/);
});

test("newdirective fails when title already exists", (t) => {
  const tag = randomTag();
  const sessionName = `itest-duplicate-title-${tag}`;
  const title = `duplicate title ${tag}`;

  t.after(() => {
    const sessionDir = path.join(directivesRoot, sessionName);
    if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true });
  });

  run(path.join(directivesBinRoot, "newdirective"), [
    "--session",
    sessionName,
    "--title",
    title,
    "--summary",
    "original",
    "--no-git",
    "--no-prompt",
  ]);

  const result = runExpectFailure(path.join(directivesBinRoot, "newdirective"), [
    "--dry-run",
    "--title",
    title.toUpperCase(),
    "--summary",
    "duplicate attempt",
    "--no-prompt",
  ]);
  const text = `${result.stdout}\n${result.stderr}`;
  assert.match(text, /Directive title already exists/);
});

test("newdirective prints manual git guidance and does not write pending auto-git state", (t) => {
  const tag = randomTag();
  const sessionName = `itest-pending-autogit-${tag}`;
  const title = `pending autogit ${tag}`;
  const dirtyMarker = path.join(repoRoot, `.directive-cli/.itest-dirty-${tag}.tmp`);
  const pendingPath = path.join(
    repoRoot,
    ".directive-cli",
    "state",
    `pending-directive-new-${sessionName}.json`,
  );

  t.after(() => {
    const sessionDir = path.join(directivesRoot, sessionName);
    if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true });
    if (fs.existsSync(dirtyMarker)) fs.rmSync(dirtyMarker, { force: true });
    if (fs.existsSync(pendingPath)) fs.rmSync(pendingPath, { force: true });
  });

  fs.writeFileSync(dirtyMarker, "dirty\n", "utf8");
  const output = run(path.join(directivesBinRoot, "newdirective"), [
    "--session",
    sessionName,
    "--title",
    title,
    "--summary",
    "pending autogit summary",
    "--no-prompt",
  ]);
  assert.match(output, /Git is manual for directive creation/);
  assert.ok(!fs.existsSync(pendingPath), "Expected no pending auto-git state file");
});

test("newtask dry-run emits json task path in existing session", () => {
  const sessions = listSessions();
  assert.ok(sessions.length > 0, "Expected at least one existing directive session");
  const output = run(path.join(directivesBinRoot, "newtask"), [
    "--dry-run",
    "--session",
    sessions[0],
    "--title",
    "test task",
    "--summary",
    "test summary",
  ]);
  assert.match(output, /\.task\.json/);
});

test("newhandoff dry-run emits json handoff path", () => {
  const sessions = listSessions();
  assert.ok(sessions.length > 0, "Expected at least one existing directive session");
  const output = run(path.join(directivesBinRoot, "newhandoff"), [
    "--dry-run",
    "--session",
    sessions[0],
    "--from-role",
    "architect",
    "--to-role",
    "executor",
    "--trigger",
    "test_trigger",
    "--objective",
    "test objective",
    "--blocking-rule",
    "test rule",
    "--task-file",
    "example.task.json",
  ]);
  assert.match(output, /\.handoff\.json/);
});

test("newhandoff can resolve directive/roles from startup context defaults", (t) => {
  const tag = randomTag();
  const sessionName = `itest-handoff-defaults-${tag}`;
  const title = `handoff-defaults-${tag}`;
  const titleSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const startupDir = path.join(repoRoot, ".codex", "context");
  const startupPath = path.join(startupDir, `itest-handoff-defaults-${tag}.startup.json`);

  t.after(() => {
    const sessionDir = path.join(directivesRoot, sessionName);
    if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true });
    if (fs.existsSync(startupPath)) fs.rmSync(startupPath, { force: true });
  });

  run(path.join(directivesBinRoot, "newdirective"), [
    "--session",
    sessionName,
    "--title",
    title,
    "--summary",
    "handoff defaults summary",
    "--no-git",
    "--no-prompt",
  ]);

  const resolvedSession = findSessionByTitleSlug(titleSlug) || sessionName;
  run(path.join(directivesBinRoot, "newtask"), [
    "--session",
    resolvedSession,
    "--title",
    "defaults task",
    "--summary",
    "defaults task summary",
    "--slug",
    "defaults-task",
    "--no-prompt",
  ]);
  fs.mkdirSync(startupDir, { recursive: true });
  fs.writeFileSync(startupPath, `${JSON.stringify({
    kind: "dc_startup_context",
    schema_version: "1.0",
    role: "architect",
    directive: {
      session: resolvedSession,
      title,
      status: "todo",
    },
    task: { slug: "defaults-task" },
  }, null, 2)}\n`);

  const output = run(path.join(directivesBinRoot, "newhandoff"), [
    "--dry-run",
    "--no-prompt",
  ]);
  assert.match(output, /\.handoff\.json/);
  assert.match(output, /"from_role": "architect"/);
  assert.match(output, /"to_role": "executor"/);
  assert.match(output, /"trigger": "architect_to_executor_handoff"/);
  assert.match(output, /"task_file": "defaults-task.task.json"/);
});

test("directive view supports non-interactive directive+file selection", () => {
  const sessions = listOpenSessions();
  assert.ok(sessions.length > 0, "Expected at least one non-archived directive session");
  const sessionDir = path.join(directivesRoot, sessions[0]);
  const metaFile = fs.readdirSync(sessionDir).find((f) => f.endsWith(".meta.json"));
  assert.ok(metaFile, "Expected a meta json file in session");

  const output = run(path.join(directivesBinRoot, "cli"), [
    "directive",
    "view",
    "--directive",
    sessions[0],
    "--file",
    metaFile,
  ]);
  assert.match(output, /Kind:/);
});

test("validatedirectives verbose output uses short names, not absolute paths", () => {
  const output = run(path.join(directivesBinRoot, "validatedirectives"), ["--verbose"]);
  const passFileLines = output
    .split("\n")
    .filter((line) => line.startsWith("  [PASS]") || line.startsWith("  [FAIL]"));
  assert.ok(passFileLines.length > 0, "Expected file-level verbose lines");
  for (const line of passFileLines) {
    assert.ok(!line.includes("/"), `Expected short file name output, got: ${line}`);
  }
});

test("newtask fails with invalid session", () => {
  const result = runExpectFailure(path.join(directivesBinRoot, "newtask"), [
    "--session",
    "does-not-exist",
    "--title",
    "bad",
    "--summary",
    "bad",
    "--no-prompt",
  ]);
  const text = `${result.stdout}\n${result.stderr}`;
  assert.match(text, /Session not found/);
});

test("executor-updatemeta blocks directive metadata edits", () => {
  const sessions = listSessions();
  assert.ok(sessions.length > 0, "Expected at least one existing directive session");
  const result = runExpectFailure(path.join(directivesBinRoot, "executor-updatemeta"), [
    "--session",
    sessions[0],
    "--directive-meta",
    "--set",
    "summary=blocked",
    "--dry-run",
  ]);
  const text = `${result.stdout}\n${result.stderr}`;
  assert.match(text, /Executor role cannot update directive metadata/);
});

test("integration: create directive, create task, create handoff, update metadata, validate session", (t) => {
  const tag = randomTag();
  const title = `integration-directive-${tag}`;
  const titleSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const sessionName = `itest-${tag}`;

  t.after(() => {
    const sessionDir = path.join(directivesRoot, sessionName);
    if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true });
  });

  run(path.join(directivesBinRoot, "newdirective"), [
    "--session",
    sessionName,
    "--title",
    title,
    "--summary",
    "integration summary",
    "--no-git",
    "--no-prompt",
  ]);

  const resolvedSession = findSessionByTitleSlug(titleSlug) || sessionName;
  const sessionDir = path.join(directivesRoot, resolvedSession);
  assert.ok(fs.existsSync(sessionDir), "Session directory should exist");

  const metaFile = path.join(sessionDir, `${titleSlug}.meta.json`);
  assert.ok(fs.existsSync(metaFile), "Directive metadata file should exist");

  run(path.join(directivesBinRoot, "newtask"), [
    "--session",
    resolvedSession,
    "--title",
    "integration task",
    "--summary",
    "integration task summary",
    "--slug",
    "integration-task",
    "--no-prompt",
  ]);

  const taskFile = path.join(sessionDir, "integration-task.task.json");
  assert.ok(fs.existsSync(taskFile), "Task file should exist");

  const branch = run("git", ["rev-parse", "--abbrev-ref", "HEAD"]).trim();

  run(path.join(directivesBinRoot, "newhandoff"), [
    "--session",
    resolvedSession,
    "--from-role",
    "architect",
    "--to-role",
    "executor",
    "--trigger",
    "integration_test",
    "--objective",
    "integration objective",
    "--blocking-rule",
    "integration rule",
    "--task-file",
    "integration-task.task.json",
    "--directive-branch",
    branch,
  ]);

  const handoffFile = path.join(sessionDir, `${titleSlug}.handoff.json`);
  assert.ok(fs.existsSync(handoffFile), "Handoff file should exist");

  run(path.join(directivesBinRoot, "updatemeta"), [
    "--session",
    resolvedSession,
    "--directive-meta",
    "--set",
    "assignee=executor",
  ]);

  const metaDoc = JSON.parse(fs.readFileSync(metaFile, "utf8"));
  assert.equal(metaDoc.meta.assignee, "executor");

  const validateOutput = run(path.join(directivesBinRoot, "validatedirectives"), [
    "--strict",
    "--file",
    path.relative(repoRoot, metaFile),
  ]);
  assert.match(validateOutput, /Validation passed/);

  run(path.join(directivesBinRoot, "updatemeta"), [
    "--session",
    resolvedSession,
    "--directive-meta",
    "--set",
    `directive_branch=${branch}`,
    "--set",
    "directive_base_branch=dev",
    "--set",
    "commit_policy=per_task",
  ]);

  const directiveStartOutput = run(path.join(directivesBinRoot, "cli"), [
    "directive",
    "start",
    "--session",
    resolvedSession,
    "--dry-run",
  ]);
  assert.match(directiveStartOutput, /Directive start/);

  const taskStartOutput = run(path.join(directivesBinRoot, "cli"), [
    "task",
    "start",
    "--session",
    resolvedSession,
    "--task",
    "integration-task",
    "--dry-run",
  ]);
  assert.match(taskStartOutput, /Task start/);

  const taskFinishOutput = run(path.join(directivesBinRoot, "cli"), [
    "task",
    "finish",
    "--session",
    resolvedSession,
    "--task",
    "integration-task",
    "--summary",
    "dry-run complete",
    "--dry-run",
  ]);
  assert.match(taskFinishOutput, /dry-run/);

  const directiveFinishResult = runExpectFailure(path.join(directivesBinRoot, "cli"), [
    "directive",
    "finish",
    "--session",
    resolvedSession,
    "--dry-run",
  ]);
  const finishText = `${directiveFinishResult.stdout}\n${directiveFinishResult.stderr}`;
  assert.match(finishText, /Task not completed/);
});

test("context bundle build/check/show works with custom output paths", (t) => {
  const tag = randomTag();
  const tmpDir = path.join("/tmp", `dc-context-${tag}`);
  const outPath = path.join(tmpDir, "compiled.md");
  const metaPath = path.join(tmpDir, "compiled.meta.json");
  const policyPath = path.join(tmpDir, "policy.compiled.json");

  t.after(() => {
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const buildOutput = run(path.join(directivesBinRoot, "context"), [
    "build",
    "--out",
    outPath,
    "--meta",
    metaPath,
  ]);
  assert.match(buildOutput, /Built context bundle/);
  assert.ok(fs.existsSync(outPath), "Compiled context file should exist");
  assert.ok(fs.existsSync(metaPath), "Compiled context metadata file should exist");
  assert.ok(fs.existsSync(policyPath), "Compiled policy bundle file should exist");

  const checkOutput = run(path.join(directivesBinRoot, "context"), [
    "check",
    "--out",
    outPath,
    "--meta",
    metaPath,
  ]);
  assert.match(checkOutput, /up to date/);

  const showOutput = run(path.join(directivesBinRoot, "context"), [
    "show",
    "--out",
    outPath,
    "--meta",
    metaPath,
    "--human",
  ]);
  assert.match(showOutput, /Context bundle:/);
  assert.match(showOutput, /Policy file:/);

  const showJson = run(path.join(directivesBinRoot, "context"), [
    "show",
    "--out",
    outPath,
    "--meta",
    metaPath,
  ]);
  const parsed = JSON.parse(showJson);
  assert.equal(parsed.out_file, outPath);
  assert.equal(parsed.meta_file, metaPath);
});

test("context bundle build/check supports --all-roles", (t) => {
  const tag = randomTag();
  const tmpDir = path.join("/tmp", `dc-context-all-roles-${tag}`);
  const outPath = path.join(tmpDir, "compiled.md");
  const metaPath = path.join(tmpDir, "compiled.meta.json");

  t.after(() => {
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const buildOutput = run(path.join(directivesBinRoot, "context"), [
    "build",
    "--all-roles",
    "--out",
    outPath,
    "--meta",
    metaPath,
  ]);
  assert.match(buildOutput, /Built role bundles/);
  for (const role of ["architect", "executor", "pair", "auditor"]) {
    assert.ok(fs.existsSync(path.join(tmpDir, `${role}.compiled.md`)), `Missing ${role} compiled bundle`);
    assert.ok(fs.existsSync(path.join(tmpDir, `${role}.compiled.meta.json`)), `Missing ${role} metadata bundle`);
    assert.ok(fs.existsSync(path.join(tmpDir, `${role}.policy.compiled.json`)), `Missing ${role} policy bundle`);
  }

  const checkOutput = run(path.join(directivesBinRoot, "context"), [
    "check",
    "--all-roles",
    "--out",
    outPath,
    "--meta",
    metaPath,
  ]);
  assert.match(checkOutput, /All role bundles are up to date/);
});

test("cli context command routes to context bundle commands", (t) => {
  const tag = randomTag();
  const tmpDir = path.join("/tmp", `dc-codex-alias-${tag}`);
  const outPath = path.join(tmpDir, "compiled.md");
  const metaPath = path.join(tmpDir, "compiled.meta.json");

  t.after(() => {
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const buildOutput = run(path.join(directivesBinRoot, "cli"), [
    "context",
    "build",
    "--out",
    outPath,
    "--meta",
    metaPath,
  ]);
  assert.match(buildOutput, /Built context bundle/);
  assert.ok(fs.existsSync(outPath), "Compiled context file should exist");
  assert.ok(fs.existsSync(metaPath), "Compiled context metadata file should exist");

  const checkOutput = run(path.join(directivesBinRoot, "cli"), [
    "context",
    "check",
    "--out",
    outPath,
    "--meta",
    metaPath,
  ]);
  assert.match(checkOutput, /up to date/);
});

test("cli launch codex bootstraps profile and launches configured binary", (t) => {
  const tag = randomTag();
  const tmpCodex = path.join("/tmp", `dc-codex-start-home-${tag}`);
  const tmpBundleDir = path.join("/tmp", `dc-codex-start-bundle-${tag}`);
  const tmpLogDir = path.join("/tmp", `dc-codex-start-logs-${tag}`);
  const outPath = path.join(tmpBundleDir, "compiled.md");
  const metaPath = path.join(tmpBundleDir, "compiled.meta.json");

  t.after(() => {
    if (fs.existsSync(tmpCodex)) fs.rmSync(tmpCodex, { recursive: true, force: true });
    if (fs.existsSync(tmpBundleDir)) fs.rmSync(tmpBundleDir, { recursive: true, force: true });
    if (fs.existsSync(tmpLogDir)) fs.rmSync(tmpLogDir, { recursive: true, force: true });
  });

  const output = run(path.join(directivesBinRoot, "cli"), [
    "launch",
    "codex",
    "--bootstrap",
    "--codex-home",
    tmpCodex,
    "--role",
    "architect",
    "--profile",
    "itest_start",
    "--codex-bin",
    "/bin/true",
    "--session-log-dir",
    tmpLogDir,
    "--out",
    outPath,
    "--meta",
    metaPath,
  ]);

  assert.match(output, /Updated codex profile/);
  assert.match(output, /Starting codex with profile 'itest_start'/);
  assert.match(output, /Observe live session log: tail -f /);
  const configPath = path.join(tmpCodex, "config.toml");
  assert.ok(fs.existsSync(configPath), "Expected codex config.toml to be created");
  const startupInstructionsPath = path.join(tmpBundleDir, "startup.md");
  const configText = fs.readFileSync(configPath, "utf8");
  assert.ok(configText.includes(startupInstructionsPath), "Expected profile block to reference startup.md");
  assert.ok(fs.existsSync(startupInstructionsPath), "Expected startup instructions file to be created");
  const commandRefPath = path.join(tmpBundleDir, "dc.commands.json");
  assert.ok(fs.existsSync(commandRefPath), "Expected dc command reference file to be created");
  assert.ok(fs.existsSync(outPath), "Expected context bundle file to be created");
  assert.ok(fs.existsSync(metaPath), "Expected context bundle metadata file to be created");
  const startupPath = path.join(tmpBundleDir, "architect.startup.json");
  assert.ok(fs.existsSync(startupPath), "Expected startup context file to be created");
  const startupDoc = JSON.parse(fs.readFileSync(startupPath, "utf8"));
  assert.equal(startupDoc.kind, "dc_startup_context");
  assert.equal(startupDoc.role, "architect");
  assert.equal(startupDoc.operator_discovery.required, true);
  const bundleMeta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
  assert.ok(
    Array.isArray(bundleMeta.sources) && bundleMeta.sources.some((s) => String(s).endsWith("architect.startup.json")),
    "Expected startup context to be included in bundle sources",
  );
  assert.ok(
    Array.isArray(bundleMeta.sources) && bundleMeta.sources.some((s) => String(s).endsWith("dc.commands.json")),
    "Expected dc command reference to be included in bundle sources",
  );
  const logFiles = fs.existsSync(tmpLogDir) ? fs.readdirSync(tmpLogDir).filter((f) => f.endsWith(".log")) : [];
  assert.ok(logFiles.length >= 1, "Expected at least one session log file");
});

test("cli launch codex resolves codex home from config role mapping", (t) => {
  const tag = randomTag();
  const mappedHome = path.join("/tmp", `dc-role-home-architect-${tag}`);
  const tmpBundleDir = path.join("/tmp", `dc-role-home-bundle-${tag}`);
  const configPath = path.join("/tmp", `dc-role-home-config-${tag}.json`);
  const outPath = path.join(tmpBundleDir, "compiled.md");
  const metaPath = path.join(tmpBundleDir, "compiled.meta.json");

  t.after(() => {
    if (fs.existsSync(mappedHome)) fs.rmSync(mappedHome, { recursive: true, force: true });
    if (fs.existsSync(tmpBundleDir)) fs.rmSync(tmpBundleDir, { recursive: true, force: true });
    if (fs.existsSync(configPath)) fs.rmSync(configPath, { force: true });
  });

  fs.writeFileSync(
    configPath,
    `${JSON.stringify({
      schema_version: "1.0",
      updated_at: new Date().toISOString(),
      agent: { name: "codex" },
      model: { name: "gpt-5.3-codex" },
      homes: { architect: mappedHome },
    }, null, 2)}\n`,
    "utf8",
  );

  run(path.join(directivesBinRoot, "cli"), [
    "launch",
    "codex",
    "--bootstrap",
    "--config",
    configPath,
    "--role",
    "architect",
    "--profile",
    "itest_role_home_architect",
    "--codex-bin",
    "codex",
    "--out",
    outPath,
    "--meta",
    metaPath,
    "--no-prompt",
  ]);

  const configToml = path.join(mappedHome, "config.toml");
  assert.ok(fs.existsSync(configToml), "Expected mapped codex home to receive config.toml");
});

test("cli launch switch bootstraps profile and launches configured binary", (t) => {
  const tag = randomTag();
  const tmpCodex = path.join("/tmp", `dc-codex-switch-home-${tag}`);
  const tmpBundleDir = path.join("/tmp", `dc-codex-switch-bundle-${tag}`);
  const tmpLogDir = path.join("/tmp", `dc-codex-switch-logs-${tag}`);
  const outPath = path.join(tmpBundleDir, "compiled.md");
  const metaPath = path.join(tmpBundleDir, "compiled.meta.json");

  t.after(() => {
    if (fs.existsSync(tmpCodex)) fs.rmSync(tmpCodex, { recursive: true, force: true });
    if (fs.existsSync(tmpBundleDir)) fs.rmSync(tmpBundleDir, { recursive: true, force: true });
    if (fs.existsSync(tmpLogDir)) fs.rmSync(tmpLogDir, { recursive: true, force: true });
  });

  const output = run(path.join(directivesBinRoot, "cli"), [
    "launch",
    "switch",
    "--bootstrap",
    "--codex-home",
    tmpCodex,
    "--role",
    "executor",
    "--profile",
    "itest_switch",
    "--codex-bin",
    "/bin/true",
    "--session-log-dir",
    tmpLogDir,
    "--out",
    outPath,
    "--meta",
    metaPath,
  ]);

  assert.match(output, /Switching codex session/);
  assert.match(output, /Starting codex with profile 'itest_switch'/);
  const configPath = path.join(tmpCodex, "config.toml");
  assert.ok(fs.existsSync(configPath), "Expected codex config.toml to be created");
  assert.ok(fs.existsSync(path.join(tmpBundleDir, "startup.md")), "Expected startup instructions file to be created");
  const logFiles = fs.existsSync(tmpLogDir) ? fs.readdirSync(tmpLogDir).filter((f) => f.endsWith(".log")) : [];
  assert.ok(logFiles.length >= 1, "Expected at least one session log file");
});

test("cli launch handoff reuses existing handoff and launches configured binary", (t) => {
  const tag = randomTag();
  const sessionName = `itest-launch-handoff-${tag}`;
  const title = `launch-handoff-${tag}`;
  const titleSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const tmpCodex = path.join("/tmp", `dc-codex-handoff-home-${tag}`);
  const tmpBundleDir = path.join("/tmp", `dc-codex-handoff-bundle-${tag}`);
  const tmpLogDir = path.join("/tmp", `dc-codex-handoff-logs-${tag}`);
  const outPath = path.join(tmpBundleDir, "compiled.md");
  const metaPath = path.join(tmpBundleDir, "compiled.meta.json");

  t.after(() => {
    const sessionDir = path.join(directivesRoot, sessionName);
    if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true });
    if (fs.existsSync(tmpCodex)) fs.rmSync(tmpCodex, { recursive: true, force: true });
    if (fs.existsSync(tmpBundleDir)) fs.rmSync(tmpBundleDir, { recursive: true, force: true });
    if (fs.existsSync(tmpLogDir)) fs.rmSync(tmpLogDir, { recursive: true, force: true });
  });

  run(path.join(directivesBinRoot, "newdirective"), [
    "--session",
    sessionName,
    "--title",
    title,
    "--summary",
    "handoff launch summary",
    "--no-git",
    "--no-prompt",
  ]);

  const resolvedSession = findSessionByTitleSlug(titleSlug) || sessionName;
  run(path.join(directivesBinRoot, "newhandoff"), [
    "--session",
    resolvedSession,
    "--from-role",
    "architect",
    "--to-role",
    "executor",
    "--trigger",
    "test_launch_handoff_reuse",
    "--objective",
    "Switch to executor for test flow.",
    "--blocking-rule",
    "Architect stops after handoff.",
    "--task-file",
    "test-launch-task.task.json",
    "--summary",
    "precreated handoff",
    "--no-prompt",
  ]);
  run(path.join(directivesBinRoot, "newtask"), [
    "--session",
    resolvedSession,
    "--title",
    "test launch task",
    "--summary",
    "task for launch handoff test",
    "--slug",
    "test-launch-task",
    "--no-prompt",
  ]);

  const output = run(path.join(directivesBinRoot, "cli"), [
    "launch",
    "handoff",
    "--bootstrap",
    "--codex-home",
    tmpCodex,
    "--profile",
    "itest_handoff",
    "--directive",
    resolvedSession,
    "--codex-bin",
    "/bin/true",
    "--session-log-dir",
    tmpLogDir,
    "--out",
    outPath,
    "--meta",
    metaPath,
    "--no-prompt",
  ]);

  assert.match(output, /Creating handoff artifact for role transition architect -> executor/);
  assert.match(output, /Using existing handoff artifact/);
  assert.match(output, /Handoff created/);
  assert.match(output, /Starting codex with profile 'itest_handoff'/);

  const sessionDir = path.join(directivesRoot, resolvedSession);
  const handoffPath = path.join(sessionDir, `${titleSlug}.handoff.json`);
  assert.ok(fs.existsSync(handoffPath), "Expected handoff file to be created");
});

test("cli launch handoff resolves target role codex home from config mapping", (t) => {
  const tag = randomTag();
  const sessionName = `itest-handoff-role-home-${tag}`;
  const title = `handoff-role-home-${tag}`;
  const titleSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const mappedExecutorHome = path.join("/tmp", `dc-role-home-executor-${tag}`);
  const tmpBundleDir = path.join("/tmp", `dc-role-home-handoff-bundle-${tag}`);
  const configPath = path.join("/tmp", `dc-role-home-handoff-config-${tag}.json`);
  const outPath = path.join(tmpBundleDir, "compiled.md");
  const metaPath = path.join(tmpBundleDir, "compiled.meta.json");

  t.after(() => {
    const sessionDir = path.join(directivesRoot, sessionName);
    if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true });
    if (fs.existsSync(mappedExecutorHome)) fs.rmSync(mappedExecutorHome, { recursive: true, force: true });
    if (fs.existsSync(tmpBundleDir)) fs.rmSync(tmpBundleDir, { recursive: true, force: true });
    if (fs.existsSync(configPath)) fs.rmSync(configPath, { force: true });
  });

  run(path.join(directivesBinRoot, "newdirective"), [
    "--session",
    sessionName,
    "--title",
    title,
    "--summary",
    "role home handoff summary",
    "--no-git",
    "--no-prompt",
  ]);
  const resolvedSession = findSessionByTitleSlug(titleSlug) || sessionName;
  run(path.join(directivesBinRoot, "newtask"), [
    "--session",
    resolvedSession,
    "--title",
    "role-home-task",
    "--summary",
    "task for role home handoff test",
    "--slug",
    "role-home-task",
    "--no-prompt",
  ]);
  run(path.join(directivesBinRoot, "newhandoff"), [
    "--session",
    resolvedSession,
    "--from-role",
    "architect",
    "--to-role",
    "executor",
    "--trigger",
    "role_home_handoff",
    "--objective",
    "role home handoff",
    "--blocking-rule",
    "architect stops",
    "--task-file",
    "role-home-task.task.json",
    "--no-prompt",
  ]);

  fs.writeFileSync(
    configPath,
    `${JSON.stringify({
      schema_version: "1.0",
      updated_at: new Date().toISOString(),
      agent: { name: "codex" },
      model: { name: "gpt-5.3-codex" },
      homes: { executor: mappedExecutorHome },
    }, null, 2)}\n`,
    "utf8",
  );

  run(path.join(directivesBinRoot, "cli"), [
    "launch",
    "handoff",
    "--bootstrap",
    "--config",
    configPath,
    "--profile",
    "itest_role_home_handoff",
    "--directive",
    resolvedSession,
    "--task",
    "role-home-task",
    "--role",
    "executor",
    "--codex-bin",
    "codex",
    "--out",
    outPath,
    "--meta",
    metaPath,
    "--no-prompt",
  ]);

  const configToml = path.join(mappedExecutorHome, "config.toml");
  assert.ok(fs.existsSync(configToml), "Expected executor mapped codex home to receive config.toml");
});

test("cli launch handoff auto-resolves role and directive from existing handoff context", (t) => {
  const tag = randomTag();
  const sessionName = `itest-launch-handoff-auto-${tag}`;
  const title = `launch-handoff-auto-${tag}`;
  const titleSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const tmpCodex = path.join("/tmp", `dc-codex-handoff-auto-home-${tag}`);
  const tmpBundleDir = path.join("/tmp", `dc-codex-handoff-auto-bundle-${tag}`);
  const outPath = path.join(tmpBundleDir, "compiled.md");
  const metaPath = path.join(tmpBundleDir, "compiled.meta.json");

  t.after(() => {
    const sessionDir = path.join(directivesRoot, sessionName);
    if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true });
    if (fs.existsSync(tmpCodex)) fs.rmSync(tmpCodex, { recursive: true, force: true });
    if (fs.existsSync(tmpBundleDir)) fs.rmSync(tmpBundleDir, { recursive: true, force: true });
  });

  run(path.join(directivesBinRoot, "newdirective"), [
    "--session",
    sessionName,
    "--title",
    title,
    "--summary",
    "handoff auto summary",
    "--no-git",
    "--no-prompt",
  ]);
  const resolvedSession = findSessionByTitleSlug(titleSlug) || sessionName;
  run(path.join(directivesBinRoot, "newhandoff"), [
    "--session",
    resolvedSession,
    "--from-role",
    "architect",
    "--to-role",
    "executor",
    "--trigger",
    "auto_reuse",
    "--objective",
    "auto reuse handoff",
    "--blocking-rule",
    "architect stops",
    "--task-file",
    "auto-reuse-task.task.json",
    "--no-prompt",
  ]);
  run(path.join(directivesBinRoot, "newtask"), [
    "--session",
    resolvedSession,
    "--title",
    "auto reuse task",
    "--summary",
    "task for handoff auto reuse test",
    "--slug",
    "auto-reuse-task",
    "--no-prompt",
  ]);

  const output = run(path.join(directivesBinRoot, "cli"), [
    "launch",
    "handoff",
    "--bootstrap",
    "--codex-home",
    tmpCodex,
    "--profile",
    "itest_handoff_auto",
    "--codex-bin",
    "codex",
    "--out",
    outPath,
    "--meta",
    metaPath,
    "--no-prompt",
  ], {
    env: {
      DC_DIRECTIVE_SESSION: resolvedSession,
      DC_ROLE: "architect",
      DC_NAMESPACE: "agent",
    },
  });

  assert.match(output, /Using existing handoff artifact/);
  assert.match(output, /Non-interactive shell detected\. Skipping codex launch/);
});

test("cli launch codex marks selected directive with no tasks as none_available", (t) => {
  const tag = randomTag();
  const sessionName = `itest-start-no-task-${tag}`;
  const title = `start-no-task-${tag}`;
  const titleSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const tmpCodex = path.join("/tmp", `dc-codex-start-no-task-home-${tag}`);
  const tmpBundleDir = path.join("/tmp", `dc-codex-start-no-task-bundle-${tag}`);
  const tmpLogDir = path.join("/tmp", `dc-codex-start-no-task-logs-${tag}`);
  const outPath = path.join(tmpBundleDir, "compiled.md");
  const metaPath = path.join(tmpBundleDir, "compiled.meta.json");

  t.after(() => {
    const sessionDir = path.join(directivesRoot, sessionName);
    if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true });
    if (fs.existsSync(tmpCodex)) fs.rmSync(tmpCodex, { recursive: true, force: true });
    if (fs.existsSync(tmpBundleDir)) fs.rmSync(tmpBundleDir, { recursive: true, force: true });
    if (fs.existsSync(tmpLogDir)) fs.rmSync(tmpLogDir, { recursive: true, force: true });
  });

  run(path.join(directivesBinRoot, "newdirective"), [
    "--session",
    sessionName,
    "--title",
    title,
    "--summary",
    "integration summary",
    "--no-git",
    "--no-prompt",
  ]);

  const resolvedSession = findSessionByTitleSlug(titleSlug) || sessionName;
  const output = run(path.join(directivesBinRoot, "cli"), [
    "launch",
    "codex",
    "--bootstrap",
    "--codex-home",
    tmpCodex,
    "--role",
    "architect",
    "--profile",
    "itest_start_no_task",
    "--directive",
    resolvedSession,
    "--codex-bin",
    "/bin/true",
    "--session-log-dir",
    tmpLogDir,
    "--out",
    outPath,
    "--meta",
    metaPath,
  ]);

  assert.match(output, /has no tasks yet/);
  const startupInstructionsPath = path.join(tmpBundleDir, "startup.md");
  assert.ok(fs.existsSync(startupInstructionsPath), "Expected startup instructions file to be created");
  const startupPath = path.join(tmpBundleDir, "architect.startup.json");
  assert.ok(fs.existsSync(startupPath), "Expected startup context file to be created");
  const startupDoc = JSON.parse(fs.readFileSync(startupPath, "utf8"));
  assert.equal(startupDoc.startup_rules.task_selection_state, "none_available");
  assert.equal(startupDoc.startup_rules.architect_authoring_no_code_edits_without_task_and_handoff, true);
  assert.equal(startupDoc.startup_rules.require_task_breakdown_approval_before_task_creation, true);
  assert.equal(startupDoc.startup_rules.require_task_contract_approval_before_handoff, true);
  assert.equal(startupDoc.startup_rules.require_handoff_before_executor_execution, true);
  assert.equal(startupDoc.startup_rules.architect_discovery_mode_required, true);
  assert.equal(startupDoc.startup_rules.architect_min_clarifying_questions, 3);
  assert.equal(startupDoc.startup_rules.architect_must_echo_discovery_before_task_drafting, true);
  assert.equal(startupDoc.architect_discovery_protocol.required, true);
  assert.equal(startupDoc.architect_discovery_protocol.min_clarifying_questions, 3);
  assert.ok(Array.isArray(startupDoc.next_actions) && startupDoc.next_actions.length > 0, "Expected next_actions guidance");
  assert.ok(startupDoc.next_actions.some((n) => String(n).includes("handoff")), "Expected explicit handoff step");
  assert.ok(startupDoc.next_actions.some((n) => String(n).includes("Manual transition")), "Expected explicit manual transition gate");
});

test("context bootstrap writes managed profile block to codex config", (t) => {
  const tag = randomTag();
  const tmpCodex = path.join("/tmp", `dc-codex-home-${tag}`);
  const outPath = path.join("/tmp", `dc-context-bootstrap-${tag}`, "compiled.md");
  const metaPath = path.join("/tmp", `dc-context-bootstrap-${tag}`, "compiled.meta.json");

  t.after(() => {
    if (fs.existsSync(tmpCodex)) fs.rmSync(tmpCodex, { recursive: true, force: true });
    const tmpBundleDir = path.dirname(outPath);
    if (fs.existsSync(tmpBundleDir)) fs.rmSync(tmpBundleDir, { recursive: true, force: true });
  });

  const output = run(path.join(directivesBinRoot, "context"), [
    "bootstrap",
    "--codex-home",
    tmpCodex,
    "--role",
    "architect",
    "--profile",
    "itest_profile",
    "--out",
    outPath,
    "--meta",
    metaPath,
  ]);
  assert.match(output, /Updated codex profile/);

  const configPath = path.join(tmpCodex, "config.toml");
  assert.ok(fs.existsSync(configPath), "Expected codex config.toml to be created");
  const configText = fs.readFileSync(configPath, "utf8");
  assert.match(configText, /BEGIN dc-context profile itest_profile/);
  assert.match(configText, /\[profiles\.itest_profile\]/);
  const startupInstructionsPath = path.join(path.dirname(outPath), "startup.md");
  assert.ok(configText.includes(startupInstructionsPath), "Expected profile block to reference startup instructions path");
  assert.ok(fs.existsSync(startupInstructionsPath), "Expected startup instructions file to be created");
  assert.ok(fs.existsSync(path.join(path.dirname(outPath), "dc.commands.json")), "Expected command reference file to be created");
  assert.match(configText, /dc_role = "architect"/);
});

test("context bootstrap requires role in non-interactive mode", () => {
  const result = runExpectFailure(path.join(directivesBinRoot, "context"), [
    "bootstrap",
    "--codex-home",
    "/tmp/dc-codex-no-role",
    "--profile",
    "itest_profile",
    "--out",
    "/tmp/dc-context-no-role/compiled.md",
    "--meta",
    "/tmp/dc-context-no-role/compiled.meta.json",
  ]);
  const text = `${result.stdout}\n${result.stderr}`;
  assert.match(text, /Missing required --role/);
});

test("context bootstrap requires profile in non-interactive mode", () => {
  const result = runExpectFailure(path.join(directivesBinRoot, "context"), [
    "bootstrap",
    "--codex-home",
    "/tmp/dc-codex-no-profile",
    "--role",
    "architect",
    "--out",
    "/tmp/dc-context-no-profile/compiled.md",
    "--meta",
    "/tmp/dc-context-no-profile/compiled.meta.json",
  ]);
  const text = `${result.stdout}\n${result.stderr}`;
  assert.match(text, /Missing required --profile/);
});

test("launch codex rejects non-codex configured agent", (t) => {
  const tag = randomTag();
  const configPath = path.join("/tmp", `dc-init-agent-${tag}.json`);

  t.after(() => {
    if (fs.existsSync(configPath)) fs.rmSync(configPath, { force: true });
  });

  fs.writeFileSync(
    configPath,
    `${JSON.stringify({
      schema_version: "1.0",
      updated_at: new Date().toISOString(),
      agent: { name: "claude-code" },
      model: { name: "sonnet" },
    }, null, 2)}\n`,
    "utf8",
  );

  const sessions = listSessions();
  assert.ok(sessions.length > 0, "Expected at least one existing directive session");

  const result = runExpectFailure(path.join(directivesBinRoot, "context"), [
    "start",
    "--codex-home",
    "/tmp/dc-start-agent-blocked",
    "--config",
    configPath,
    "--role",
    "architect",
    "--profile",
    "itest_profile",
    "--directive",
    sessions[0],
    "--codex-bin",
    "/bin/true",
    "--dry-run",
  ]);
  const text = `${result.stdout}\n${result.stderr}`;
  assert.match(text, /not supported by 'dc launch codex'/);
});

test("launch handoff in non-interactive shell skips codex launch gracefully", () => {
  const target = firstRunnableSession();
  assert.ok(target, "Expected at least one non-archived directive session with a task");
  const tag = randomTag();
  const tmpCodex = path.join("/tmp", `dc-non-tty-handoff-home-${tag}`);
  const tmpBundleDir = path.join("/tmp", `dc-non-tty-handoff-bundle-${tag}`);
  const output = run(path.join(directivesBinRoot, "cli"), [
    "launch",
    "handoff",
    "--bootstrap",
    "--codex-home",
    tmpCodex,
    "--role",
    "executor",
    "--from-role",
    "architect",
    "--profile",
    "itest_non_tty_handoff",
    "--directive",
    target.session,
    "--task",
    target.task,
    "--codex-bin",
    "codex",
    "--out",
    path.join(tmpBundleDir, "compiled.md"),
    "--meta",
    path.join(tmpBundleDir, "compiled.meta.json"),
    "--no-prompt",
  ]);
  assert.match(output, /Non-interactive shell detected\. Skipping codex launch/);
  if (fs.existsSync(tmpCodex)) fs.rmSync(tmpCodex, { recursive: true, force: true });
  if (fs.existsSync(tmpBundleDir)) fs.rmSync(tmpBundleDir, { recursive: true, force: true });
});
