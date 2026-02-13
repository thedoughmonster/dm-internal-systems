import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const scriptsRoot = path.join(repoRoot, "ops_tooling", "scripts");
const directivesRoot = path.join(repoRoot, "apps", "web", ".local", "directives");

function run(scriptPath, args = []) {
  return execFileSync(scriptPath, args, {
    cwd: repoRoot,
    encoding: "utf8",
  });
}

function runExpectFailure(scriptPath, args = []) {
  const result = spawnSync(scriptPath, args, {
    cwd: repoRoot,
    encoding: "utf8",
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

function randomTag() {
  return `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

function findSessionByTitleSlug(titleSlug) {
  const sessions = listSessions();
  return sessions.find((name) => name.includes(titleSlug)) || "";
}

test("directives-cli help exposes expected command set", () => {
  const output = run(path.join(scriptsRoot, "directives-cli"), ["help"]);
  assert.match(output, /newdirective/);
  assert.match(output, /newtask/);
  assert.match(output, /newhandoff/);
  assert.match(output, /updatemeta/);
  assert.match(output, /validate/);
});

test("newdirective dry-run emits json session metadata path", () => {
  const output = run(path.join(scriptsRoot, "newdirective"), [
    "--dry-run",
    "--title",
    "test directive",
    "--summary",
    "test summary",
  ]);
  assert.match(output, /\.meta\.json/);
  assert.doesNotMatch(output, /README\.md/);
});

test("newtask dry-run emits json task path in existing session", () => {
  const sessions = listSessions();
  assert.ok(sessions.length > 0, "Expected at least one existing directive session");
  const output = run(path.join(scriptsRoot, "newtask"), [
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
  const output = run(path.join(scriptsRoot, "newhandoff"), [
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

test("validatedirectives verbose output uses short names, not absolute paths", () => {
  const output = run(path.join(scriptsRoot, "validatedirectives"), ["--verbose"]);
  const passFileLines = output
    .split("\n")
    .filter((line) => line.startsWith("  [PASS]") || line.startsWith("  [FAIL]"));
  assert.ok(passFileLines.length > 0, "Expected file-level verbose lines");
  for (const line of passFileLines) {
    assert.ok(!line.includes("/"), `Expected short file name output, got: ${line}`);
  }
});

test("newtask fails with invalid session", () => {
  const result = runExpectFailure(path.join(scriptsRoot, "newtask"), [
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
  const result = runExpectFailure(path.join(scriptsRoot, "executor-updatemeta"), [
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

  run(path.join(scriptsRoot, "newdirective"), [
    "--session",
    sessionName,
    "--title",
    title,
    "--summary",
    "integration summary",
    "--no-prompt",
  ]);

  const resolvedSession = findSessionByTitleSlug(titleSlug) || sessionName;
  const sessionDir = path.join(directivesRoot, resolvedSession);
  assert.ok(fs.existsSync(sessionDir), "Session directory should exist");

  const metaFile = path.join(sessionDir, `${titleSlug}.meta.json`);
  assert.ok(fs.existsSync(metaFile), "Directive metadata file should exist");

  run(path.join(scriptsRoot, "newtask"), [
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

  run(path.join(scriptsRoot, "newhandoff"), [
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
  ]);

  const handoffFile = path.join(sessionDir, `${titleSlug}.handoff.json`);
  assert.ok(fs.existsSync(handoffFile), "Handoff file should exist");

  run(path.join(scriptsRoot, "updatemeta"), [
    "--session",
    resolvedSession,
    "--directive-meta",
    "--set",
    "assignee=executor",
  ]);

  const metaDoc = JSON.parse(fs.readFileSync(metaFile, "utf8"));
  assert.equal(metaDoc.meta.assignee, "executor");

  const validateOutput = run(path.join(scriptsRoot, "validatedirectives"), [
    "--strict",
    "--file",
    path.relative(repoRoot, metaFile),
  ]);
  assert.match(validateOutput, /Validation passed/);
});
