#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import {
  getDirectivesRoot,
  resolveSessionDir,
  assertInside,
  isUuid,
} from "./_session_resolver.mjs";

const ROLES = new Set(["architect", "executor", "pair", "auditor"]);
const WORKTREE_MODES = new Set(["clean_required", "known_dirty_allowlist"]);

function usage() {
  return [
    "Usage:",
    "  node .directive-cli/scripts/directives/create_handoff.mjs --session <session-dir-or-uuid> --from-role <role> --to-role <role> --trigger <id> --objective <text> --blocking-rule <text> [options]",
    "",
    "Required (if startup context defaults are unavailable):",
    "  --session <id>                    Session directory name or session UUID (meta.id)",
    "  --guid <id>                       Legacy alias for --session",
    "  --from-role <role>                architect|executor|pair|auditor",
    "  --to-role <role>                  architect|executor|pair|auditor",
    "  --trigger <id>                    Deterministic handoff trigger id",
    "  --objective <text>                One-line objective",
    "  --blocking-rule <text>            Rule that blocks sender continuation",
    "",
    "Options:",
    "  --task-file <path|null>           Task file path or null (default: null)",
    "  --directive-branch <name>         Defaults to <directive_slug>.meta.json meta.directive_branch",
    "  --worktree-mode <mode>            clean_required|known_dirty_allowlist (default: clean_required)",
    "  --allowlist-path <path>           Repeatable; required when known_dirty_allowlist",
    "  --required-reading <path>         Default: apps/web/docs/guides/component-paradigm.md",
    "  --dry-run                         Print target and JSON only",
    "  --no-prompt                       Disable prompts for missing values",
    "  --help                            Show this help",
  ].join("\n");
}

function parseArgs(argv) {
  const args = { allowlistPath: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];

    if (key === "allowlist-path") {
      if (!next || next.startsWith("--")) throw new Error("Missing value for --allowlist-path");
      args.allowlistPath.push(next);
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

function loadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function readLatestStartupContext(root, preferredSession = "") {
  const dir = path.join(root, ".codex", "context");
  if (!fs.existsSync(dir)) return null;
  const files = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith(".startup.json"))
    .map((d) => path.join(dir, d.name))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  if (files.length === 0) return null;

  const docs = files
    .map((f) => loadJson(f))
    .filter((doc) => doc && String(doc.kind || "") === "dc_startup_context");
  if (docs.length === 0) return null;

  const preferred = String(preferredSession || "").trim();
  if (preferred) {
    const match = docs.find((doc) => String(doc.directive && doc.directive.session || "") === preferred);
    if (match) return match;
  }
  return docs[0];
}

function resolvedHandoffDefaults(toRole, fromRole) {
  const targetRole = String(toRole || "").trim().toLowerCase();
  const senderRole = String(fromRole || "").trim().toLowerCase() || "architect";
  const objective = targetRole === "executor"
    ? "Execute approved directive tasks strictly via dc lifecycle/runbook scripts."
    : `Continue directive lifecycle under role '${targetRole}'.`;
  const blockingRule = targetRole === "executor"
    ? "Architect must stop implementation and transfer control to executor."
    : `Sender role '${senderRole}' must stop until role '${targetRole}' takes control.`;
  return { objective, blockingRule };
}

function applyContextDefaults(inputArgs, startupCtx) {
  const args = { ...inputArgs, allowlistPath: Array.isArray(inputArgs.allowlistPath) ? [...inputArgs.allowlistPath] : [] };
  const startupRole = String(startupCtx && startupCtx.role ? startupCtx.role : "").trim().toLowerCase();
  const startupDirective = String(startupCtx && startupCtx.directive && startupCtx.directive.session ? startupCtx.directive.session : "").trim();
  const startupTaskSlug = String(startupCtx && startupCtx.task && startupCtx.task.slug ? startupCtx.task.slug : "").trim();
  const envRole = String(process.env.DC_ROLE || "").trim().toLowerCase();

  if (!args.session && !args.guid) {
    const envDirective = String(process.env.DC_DIRECTIVE_SESSION || "").trim();
    if (envDirective) args.session = envDirective;
    else if (startupDirective) args.session = startupDirective;
  }

  if (!args["from-role"]) {
    if (ROLES.has(startupRole)) args["from-role"] = startupRole;
    else if (ROLES.has(envRole)) args["from-role"] = envRole;
    else args["from-role"] = "architect";
  }
  if (!args["to-role"]) {
    args["to-role"] = String(args["from-role"]).trim().toLowerCase() === "architect" ? "executor" : "architect";
  }

  const fromRole = String(args["from-role"] || "").trim().toLowerCase();
  const toRole = String(args["to-role"] || "").trim().toLowerCase();
  const defaults = resolvedHandoffDefaults(toRole, fromRole);
  if (!args.trigger) args.trigger = `${fromRole}_to_${toRole}_handoff`;
  if (!args.objective) args.objective = defaults.objective;
  if (!args["blocking-rule"]) args["blocking-rule"] = defaults.blockingRule;
  if (args["task-file"] === undefined) args["task-file"] = startupTaskSlug ? `${startupTaskSlug}.task.json` : "null";
  return args;
}

function findDirectiveSlugAndMetaPath(sessionDir) {
  const files = fs.readdirSync(sessionDir, { withFileTypes: true }).filter((d) => d.isFile()).map((d) => d.name);
  const metas = files.filter((f) => /^([a-z0-9]+(?:-[a-z0-9]+)*)\.meta\.json$/.test(f));
  if (metas.length !== 1) throw new Error(`Expected exactly one <directive_slug>.meta.json in ${sessionDir}`);
  const metaFile = metas[0];
  const directiveSlug = metaFile.replace(/\.meta\.json$/, "");
  return { directiveSlug, metaPath: path.join(sessionDir, metaFile) };
}

function readDirectiveMeta(metaPath) {
  const raw = fs.readFileSync(metaPath, "utf8");
  const doc = JSON.parse(raw);
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) throw new Error(`Invalid JSON object in ${metaPath}`);
  if (!doc.meta || typeof doc.meta !== "object" || Array.isArray(doc.meta)) throw new Error(`Missing top-level meta mapping in ${metaPath}`);
  return doc.meta;
}

async function promptMissing(args) {
  if (args["no-prompt"] || !stdin.isTTY) return args;
  const out = { ...args, allowlistPath: Array.isArray(args.allowlistPath) ? [...args.allowlistPath] : [] };
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    if (!out.session && out.guid) out.session = out.guid;
    if (!out.session) out.session = (await rl.question("Session (dir name or UUID): ")).trim();
    if (!out["from-role"]) out["from-role"] = (await rl.question("From role: ")).trim().toLowerCase();
    if (!out["to-role"]) out["to-role"] = (await rl.question("To role: ")).trim().toLowerCase();
    if (!out.trigger) out.trigger = (await rl.question("Trigger id: ")).trim();
    if (!out.objective) out.objective = (await rl.question("Objective: ")).trim();
    if (!out["blocking-rule"]) out["blocking-rule"] = (await rl.question("Blocking rule: ")).trim();
  } finally {
    rl.close();
  }
  return out;
}

function validateArgs(args) {
  const session = String(args.session || args.guid || "").trim();
  if (!session) throw new Error("Missing --session");
  const fromRole = String(args["from-role"] || "").trim().toLowerCase();
  const toRole = String(args["to-role"] || "").trim().toLowerCase();
  if (!ROLES.has(fromRole)) throw new Error(`Invalid --from-role '${fromRole}'`);
  if (!ROLES.has(toRole)) throw new Error(`Invalid --to-role '${toRole}'`);
  const trigger = String(args.trigger || "").trim();
  if (!trigger) throw new Error("Missing --trigger");
  const objective = String(args.objective || "").trim();
  if (!objective) throw new Error("Missing --objective");
  const blockingRule = String(args["blocking-rule"] || "").trim();
  if (!blockingRule) throw new Error("Missing --blocking-rule");
  const worktreeMode = String(args["worktree-mode"] || "clean_required").trim();
  if (!WORKTREE_MODES.has(worktreeMode)) throw new Error(`Invalid --worktree-mode '${worktreeMode}'`);
  const allowlist = (args.allowlistPath || []).map((p) => String(p).trim()).filter(Boolean);
  if (worktreeMode === "known_dirty_allowlist" && allowlist.length === 0) throw new Error("known_dirty_allowlist requires at least one --allowlist-path");
  if (allowlist.some((p) => p.includes("..") || path.isAbsolute(p))) throw new Error("Allowlist paths must be relative and must not include '..'");
  return { session, fromRole, toRole, trigger, objective, blockingRule, worktreeMode, allowlist };
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

  const root = process.cwd();
  const startupCtx = readLatestStartupContext(
    root,
    String(args.session || args.guid || process.env.DC_DIRECTIVE_SESSION || "").trim(),
  );
  args = applyContextDefaults(args, startupCtx);
  args = await promptMissing(args);

  let v;
  try {
    v = validateArgs(args);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }

  const directivesRoot = getDirectivesRoot();
  let sessionDir;
  try {
    sessionDir = resolveSessionDir(v.session);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }

  let directiveSlug;
  let metaPath;
  try {
    ({ directiveSlug, metaPath } = findDirectiveSlugAndMetaPath(sessionDir));
    assertInside(directivesRoot, sessionDir);
    assertInside(sessionDir, metaPath);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }

  let meta;
  try {
    meta = readDirectiveMeta(metaPath);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }

  const sessionId = String(meta.id || "").trim();
  if (!isUuid(sessionId)) {
    process.stderr.write(`Missing or invalid meta.id in ${metaPath}\n`);
    process.exit(1);
  }

  const directiveBranch = String(args["directive-branch"] || meta.directive_branch || "").trim();
  if (!directiveBranch) {
    process.stderr.write(`Missing directive branch. Provide --directive-branch or set meta.directive_branch in ${metaPath}\n`);
    process.exit(1);
  }

  const handoffPath = path.join(sessionDir, `${directiveSlug}.handoff.json`);
  const taskFileRaw = String(args["task-file"] ?? "null").trim();
  const taskFile = taskFileRaw === "" || taskFileRaw.toLowerCase() === "null" ? null : taskFileRaw;
  if (v.toRole === "executor" && !taskFile) {
    process.stderr.write("Executor handoff requires a concrete task_file. Pass --task-file <task_slug>.task.json\n");
    process.exit(1);
  }
  const requiredReading = String(args["required-reading"] || "apps/web/docs/guides/component-paradigm.md").trim();

  const outDoc = {
    handoff: {
      from_role: v.fromRole,
      to_role: v.toRole,
      trigger: v.trigger,
      session_id: sessionId,
      task_file: taskFile,
      directive_branch: directiveBranch,
      required_reading: requiredReading,
      objective: v.objective,
      blocking_rule: v.blockingRule,
      worktree_mode: v.worktreeMode,
      worktree_allowlist_paths: v.worktreeMode === "clean_required" ? [] : v.allowlist,
    },
  };

  if (args["dry-run"]) {
    process.stdout.write(`[dry-run] target: ${handoffPath}\n\n`);
    process.stdout.write(`${JSON.stringify(outDoc, null, 2)}\n`);
    process.exit(0);
  }

  fs.writeFileSync(handoffPath, `${JSON.stringify(outDoc, null, 2)}\n`, "utf8");
  process.stdout.write(`Wrote ${handoffPath}\n`);
}

main();
