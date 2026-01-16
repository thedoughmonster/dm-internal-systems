// scripts/generate_repo_context.mjs
import { execSync } from "node:child_process";
import fs from "node:fs";

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

function safeJsonParse(s, fallback = {}) {
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

function splitLines(s) {
  if (!s) return [];
  return s.split("\n").map((x) => x.trim()).filter(Boolean);
}

function classifyArea(path) {
  if (path.startsWith("db/")) return "db";
  if (path.startsWith("canon/")) return "canon";
  if (path.startsWith("scripts/")) return "scripts";
  if (path.startsWith(".github/")) return "github";
  return "other";
}

const nowUtc = new Date().toISOString();

const headSha = sh("git rev-parse HEAD");
const headMessage = sh("git log -1 --pretty=format:%s");
const headAuthorName = sh("git log -1 --pretty=format:%an");
const headAuthorEmail = sh("git log -1 --pretty=format:%ae");
const headTimestampUtc = sh("git log -1 --pretty=format:%cI");

// Load existing context if present
let existing = {};
if (fs.existsSync("dm_repo_context.json")) {
  existing = safeJsonParse(fs.readFileSync("dm_repo_context.json", "utf8"), {});
}

// Determine base SHA for diff range
const prevHead = existing?.head?.sha;
let baseSha = prevHead && prevHead !== headSha ? prevHead : null;

if (!baseSha) {
  // Fallback to previous commit, else HEAD (new repo)
  try {
    baseSha = sh("git rev-parse HEAD~1");
  } catch {
    baseSha = headSha;
  }
}

// Build recent commits list using a delimiter that cannot collide with messages
// Use ASCII Unit Separator (0x1F) between fields
const US = "\x1f";
const commitRaw = sh(
  `git log -10 --pretty=format:%H%x1f%cI%x1f%an%x1f%ae%x1f%s`
);

const commits = splitLines(commitRaw).map((line) => {
  const parts = line.split(US);
  const [sha, timestamp_utc, author_name, author_email, message] = parts;
  return {
    sha: sha ?? null,
    timestamp_utc: timestamp_utc ?? null,
    author_name: author_name ?? null,
    author_email: author_email ?? null,
    message: message ?? null
  };
});

// Compute changed files in the chosen range
let changed = [];
try {
  changed = splitLines(sh(`git diff --name-only ${baseSha}..${headSha}`));
} catch {
  changed = [];
}

// Index by top dir and by area
const byTopDir = {};
const byArea = { db: [], canon: [], scripts: [], github: [], other: [] };

for (const p of changed) {
  const top = p.includes("/") ? p.split("/")[0] : p;
  (byTopDir[top] ||= []).push(p);

  const area = classifyArea(p);
  byArea[area].push(p);
}

// Merge output with existing, but force our known keys
const output = {
  schema_version: 1,
  generated_at_utc: nowUtc,
  repo: {
    default_branch: existing?.repo?.default_branch ?? "main"
  },
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
  },
  // Preserve optional stable fields if you add them later
  directories: Array.isArray(existing?.directories) ? existing.directories : [],
  invariants: existing?.invariants && typeof existing.invariants === "object" ? existing.invariants : {}
};

fs.writeFileSync("dm_repo_context.json", JSON.stringify(output, null, 2) + "\n", "utf8");
console.log(`Wrote dm_repo_context.json for ${baseSha}..${headSha}`);
