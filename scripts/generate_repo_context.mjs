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

const repoSlug = process.env.GITHUB_REPOSITORY || "thedoughmonster/dm-internal-systems";
const [repoOwner, repoName] = repoSlug.split("/");
const defaultBranch = "main";

function rawUrlPinned(sha, path) {
  return `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${sha}/${path}`;
}

function rawUrlLatest(path) {
  return `https://raw.githubusercontent.com/${repoOwner}/${repoName}/refs/heads/${defaultBranch}/${path}`;
}

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
  try {
    baseSha = sh("git rev-parse HEAD~1");
  } catch {
    baseSha = headSha;
  }
}

// Recent commits using a delimiter that cannot collide with commit message text
const US = "\x1f";
const commitRaw = sh("git log -10 --pretty=format:%H%x1f%cI%x1f%an%x1f%ae%x1f%s");

const commits = splitLines(commitRaw).map((line) => {
  const [sha, timestamp_utc, author_name, author_email, message] = line.split(US);
  return {
    sha: sha ?? null,
    timestamp_utc: timestamp_utc ?? null,
    author_name: author_name ?? null,
    author_email: author_email ?? null,
    message: message ?? null
  };
});

// Compute changed files in the chosen range
let changedEntries = [];
try {
  const changedPaths = splitLines(sh(`git diff --name-only ${baseSha}..${headSha}`));
  changedEntries = changedPaths.map((path) => {
    const area = classifyArea(path);
    return {
      path,
      area,
      raw_url_pinned: rawUrlPinned(headSha, path),
      raw_url_latest: rawUrlLatest(path)
    };
  });
} catch {
  changedEntries = [];
}

// Index changed paths by top dir and by area
const byTopDir = {};
const byArea = { db: [], canon: [], scripts: [], github: [], other: [] };

for (const entry of changedEntries) {
  const p = entry.path;
  const top = p.includes("/") ? p.split("/")[0] : "(root)";
  (byTopDir[top] ||= []).push(entry);
  byArea[entry.area].push(entry);
}

// Preserve stable fields if you add them later
const directoriesExisting = Array.isArray(existing?.directories) ? existing.directories : [];
const invariantsExisting =
  existing?.invariants && typeof existing.invariants === "object" ? existing.invariants : {};

// Enrich directories with raw URLs
const directories = directoriesExisting.map((d) => {
  const agentsPath =
    typeof d.agents_md === "string"
      ? d.agents_md
      : d.agents_md && typeof d.agents_md.path === "string"
        ? d.agents_md.path
        : null;

  return {
    ...d,
    raw_base_url_pinned: rawUrlPinned(headSha, d.path.replace(/\/$/, "") + "/"),
    raw_base_url_latest: rawUrlLatest(d.path.replace(/\/$/, "") + "/"),
    agents_md: agentsPath
      ? {
          path: agentsPath,
          raw_url_pinned: rawUrlPinned(headSha, agentsPath),
          raw_url_latest: rawUrlLatest(agentsPath)
        }
      : null
  };
});

const output = {
  schema_version: 1,
  generated_at_utc: nowUtc,
  repo: {
    owner: repoOwner,
    name: repoName,
    default_branch: defaultBranch,
    raw_context_latest_url: rawUrlLatest("dm_repo_context.json")
  },
  self: {
    path: "dm_repo_context.json",
    raw_url_pinned: rawUrlPinned(headSha, "dm_repo_context.json"),
    raw_url_latest: rawUrlLatest("dm_repo_context.json")
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
    all: changedEntries,
    by_top_dir: byTopDir,
    by_area: byArea
  },
  directories,
  invariants: invariantsExisting
};

fs.writeFileSync("dm_repo_context.json", JSON.stringify(output, null, 2) + "\n", "utf8");
console.log(`Wrote dm_repo_context.json for ${baseSha}..${headSha}`);
