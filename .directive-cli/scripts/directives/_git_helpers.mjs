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

export function ensureCleanWorkingTree(cwd) {
  const result = runGit(["status", "--porcelain"], cwd);
  const dirty = String(result.stdout || "").trim();
  if (dirty) throw new Error("Working tree must be clean before this command.");
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
