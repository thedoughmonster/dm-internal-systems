import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const directivesBinRoot = path.join(repoRoot, "ops_tooling", "scripts", "directives", "bin");
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
  const output = run(path.join(directivesBinRoot, "cli"), ["help"]);
  assert.match(output, /newdirective/);
  assert.match(output, /newtask/);
  assert.match(output, /newhandoff/);
  assert.match(output, /updatemeta/);
  assert.match(output, /validate/);
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
});

test("context bundle build/check/show works with custom output paths", (t) => {
  const tag = randomTag();
  const tmpDir = path.join("/tmp", `dc-context-${tag}`);
  const outPath = path.join(tmpDir, "compiled.md");
  const metaPath = path.join(tmpDir, "compiled.meta.json");

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
  assert.ok(configText.includes(outPath), "Expected profile block to reference compiled bundle path");
});
