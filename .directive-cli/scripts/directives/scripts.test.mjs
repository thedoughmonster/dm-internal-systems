import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const directivesBinRoot = path.join(repoRoot, ".directive-cli", "scripts", "directives", "bin");
const directivesRoot = path.join(repoRoot, "apps", "web", ".local", "directives");

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

test("directives-cli help exposes expected command set", () => {
  const output = run(path.join(directivesBinRoot, "cli"), ["help"]);
  assert.match(output, /init/);
  assert.match(output, /directive/);
  assert.match(output, /meta/);
  assert.match(output, /directive new/);
  assert.match(output, /directive task/);
  assert.match(output, /directive handoff/);
  assert.match(output, /directive view/);
  assert.match(output, /directive start/);
  assert.match(output, /directive finish/);
  assert.match(output, /directive archive/);
  assert.match(output, /directive cleanup/);
  assert.match(output, /task start/);
  assert.match(output, /task finish/);
  assert.match(output, /repo map/);
  assert.match(output, /policy/);
  assert.match(output, /policy validate/);
  assert.match(output, /runbook/);
  assert.match(output, /meta update/);
  assert.match(output, /validate/);
  assert.match(output, /agent/);
});

test("policy validate passes for required policy files", () => {
  const output = run(path.join(directivesBinRoot, "cli"), ["policy", "validate"]);
  assert.match(output, /Policy validation passed/);
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
  ]);
  assert.match(output, /\.handoff\.json/);
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
  ]);
  assert.match(showOutput, /Context bundle:/);
  assert.match(showOutput, /Policy file:/);
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

test("cli agent command routes to context bundle commands", (t) => {
  const tag = randomTag();
  const tmpDir = path.join("/tmp", `dc-codex-alias-${tag}`);
  const outPath = path.join(tmpDir, "compiled.md");
  const metaPath = path.join(tmpDir, "compiled.meta.json");

  t.after(() => {
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const buildOutput = run(path.join(directivesBinRoot, "cli"), [
    "agent",
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
    "agent",
    "check",
    "--out",
    outPath,
    "--meta",
    metaPath,
  ]);
  assert.match(checkOutput, /up to date/);
});

test("cli agent start bootstraps profile and launches configured binary", (t) => {
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
    "agent",
    "start",
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

test("cli agent start marks selected directive with no tasks as none_available", (t) => {
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
    "agent",
    "start",
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
  assert.ok(Array.isArray(startupDoc.next_actions) && startupDoc.next_actions.length > 0, "Expected next_actions guidance");
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

test("agent start rejects non-codex configured agent", (t) => {
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
  assert.match(text, /not supported by 'dc agent start'/);
});
