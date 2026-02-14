import { spawnSync } from "node:child_process";
import fs from "node:fs";

const COLORS = {
  reset: "\x1b[0m",
  dir: "\x1b[34m",
  git: "\x1b[33m",
  test: "\x1b[32m",
};

export function tag(kind) {
  if (process.env.NO_COLOR) return `[${kind}]`;
  const key = kind.toLowerCase();
  const color = COLORS[key] || "";
  if (!color) return `[${kind}]`;
  return `${color}[${kind}]${COLORS.reset}`;
}

export function log(kind, message) {
  const line = `${tag(kind)} ${message}\n`;
  process.stdout.write(line);
  const logFile = String(process.env.DC_SESSION_LOG || "").trim();
  if (logFile) {
    try {
      const ts = new Date().toISOString();
      fs.appendFileSync(logFile, `[${ts}] [${kind}] ${message}\n`, "utf8");
    } catch {
      // Best-effort logging; never block lifecycle commands on log write failure.
    }
  }
}

export function runGit(args, cwd, { allowFail = false } = {}) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (!allowFail && result.status !== 0) {
    const msg = (result.stderr || result.stdout || "git command failed").trim();
    throw new Error(msg);
  }
  return result;
}

function formatDirtyList(files) {
  const list = files.slice(0, 20).map((f) => `  - ${f}`).join("\n");
  const extra = files.length > 20 ? `\n  ... (${files.length - 20} more)` : "";
  return `${list}${extra}`;
}

export function ensureCleanWorkingTree(cwd, { allowlistPrefixes = [] } = {}) {
  const dirty = changedFiles(cwd);
  if (dirty.length === 0) return;

  const allow = Array.isArray(allowlistPrefixes)
    ? allowlistPrefixes.map((p) => String(p || "").replace(/\\/g, "/").trim()).filter(Boolean)
    : [];
  const disallowed = allow.length === 0
    ? dirty
    : dirty.filter((f) => !allow.some((prefix) => f === prefix || f.startsWith(`${prefix}/`)));

  if (disallowed.length > 0) {
    const reason = allow.length === 0
      ? "Working tree must be clean before this command."
      : "Working tree has changes outside allowed paths for this command.";
    const hint = allow.length === 0
      ? ""
      : `\nAllowed path prefixes:\n${allow.map((p) => `  - ${p}`).join("\n")}`;
    throw new Error(`${reason}\nDirty files:\n${formatDirtyList(disallowed)}${hint}`);
  }
}

export function currentBranch(cwd) {
  const result = runGit(["rev-parse", "--abbrev-ref", "HEAD"], cwd);
  return String(result.stdout || "").trim();
}

export function branchExistsLocal(branch, cwd) {
  const result = runGit(["show-ref", "--verify", `refs/heads/${branch}`], cwd, { allowFail: true });
  return result.status === 0;
}

export function branchExistsRemote(branch, cwd, remote = "origin") {
  const result = runGit(["show-ref", "--verify", `refs/remotes/${remote}/${branch}`], cwd, { allowFail: true });
  return result.status === 0;
}

export function changedFiles(cwd) {
  const result = runGit(["status", "--porcelain"], cwd);
  return String(result.stdout || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.slice(3).trim())
    .filter(Boolean);
}

export function shortSha(cwd) {
  const result = runGit(["rev-parse", "--short", "HEAD"], cwd);
  return String(result.stdout || "").trim();
}

export function runShell(command, cwd) {
  return spawnSync("bash", ["-lc", command], { cwd, encoding: "utf8" });
}
