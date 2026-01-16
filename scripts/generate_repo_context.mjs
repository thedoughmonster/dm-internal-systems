import { execSync } from "node:child_process";
import fs from "node:fs";

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

function safeJsonParse(s, fallback) {
  try { return JSON.parse(s); } catch { return fallback; }
}

const nowUtc = new Date().toISOString();

const headSha = sh("git rev-parse HEAD");
const headMessage = sh("git log -1 --pretty=%s");
const headAuthorName = sh("git log -1 --pretty=%an");
const headAuthorEmail = sh("git log -1 --pretty=%ae");
const headTimestampUtc = sh("git log -1 --pretty=%cI");

// Use last successful context range if present, else fall back to HEAD~1
let existing = {};
if (fs.existsSync("dm_repo_context.json")) {
  existing = safeJsonParse(fs.readFileSync("dm_repo_context.json", "utf8"), {});
}

const prevHead = existing?.head?.sha;
let baseSha = prevHead && prevHead !== headSha ? prevHead : null;

if (!baseSha) {
  // fallback: previous commit
  try {
    baseSha = sh("git rev-parse HEAD~1");
  } catch {
    baseSha = headSha;
  }
}

const commitLines = sh("git log -10 --pretty=%H|%cI|%an|%ae|%s").split("\n").filter(Boolean);
const commits = commitLines.map((line) => {
  const [sha, timestamp_utc, author_name, author_email, message] = line.split("|");
  return { sha, timestamp_utc, author_name, author_email, message };
});

let changed = [];
try {
  changed = sh(`git diff --name-only ${baseSha}..${headSha}`).split("\n").filter(Boolean);
} catch {
  changed = [];
}

const byTopDir = {};
const byArea = { db: [], canon: [], scripts: [], github: [], other: [] };

for (const p of changed) {
  const top = p.split("/")[0] || p;
  byTopDir[top] = byTopDir[top] || [];
  byTopDir[top].push(p);

  if (p.startsWith("db/")) byArea.db.push(p);
  else if (p.startsWith("canon/")) byArea.canon.push(p);
  else if (p.startsWith("scripts/")) byArea.scripts.push(p);
  else if (p.startsWith(".github/")) byArea.github.push(p);
  else byArea.other.push(p);
}

const output = {
  ...(existing && typeof existing === "object" ? existing : {}),
  schema_version: 1,
  generated_at_utc: nowUtc,
  repo: { default_branch: "main" },
  head: {
    sha: headSha,
    message: headMessage,
    author_name: headAuthorName,
    author_email: headAuthorEmail,
    timestamp_utc: headTimestampUtc
  },
  commits,
  changed_paths: {
    range_base_sha: baseSha,
    range_head_sha: headSha,
    all: changed,
    by_top_dir: byTopDir,
    by_area: byArea
  }
};

fs.writeFileSync("dm_repo_context.json", JSON.stringify(output, null, 2) + "\n", "utf8");
console.log(`Wrote dm_repo_context.json for ${baseSha}..${headSha}`);
