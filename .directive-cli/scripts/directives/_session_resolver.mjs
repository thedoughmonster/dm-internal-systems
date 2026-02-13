import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function getRepoRoot() {
  const scriptFile = fileURLToPath(import.meta.url);
  const scriptDir = path.dirname(scriptFile);
  return path.resolve(scriptDir, "../../..");
}

export function getDirectivesRoot() {
  return path.join(getRepoRoot(), "apps/web/.local/directives");
}

export function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

export function assertInside(baseDir, candidatePath) {
  const base = path.resolve(baseDir);
  const target = path.resolve(candidatePath);
  if (target !== base && !target.startsWith(`${base}${path.sep}`)) {
    throw new Error(`Resolved path escapes directives root: ${candidatePath}`);
  }
}

function readMetaFile(metaPath) {
  if (!metaPath) return null;
  if (!fs.existsSync(metaPath)) return null;
  try {
    const raw = fs.readFileSync(metaPath, "utf8");
    const doc = JSON.parse(raw);
    if (!doc || typeof doc !== "object" || Array.isArray(doc)) return null;
    if (!doc.meta || typeof doc.meta !== "object" || Array.isArray(doc.meta)) return null;
    return doc.meta;
  } catch {
    return null;
  }
}

function findDirectiveMetaFile(sessionDir) {
  const files = fs.readdirSync(sessionDir, { withFileTypes: true }).filter((d) => d.isFile()).map((d) => d.name);
  const candidates = files.filter((f) => /^[a-z0-9]+(?:-[a-z0-9]+)*\.meta\.json$/.test(f));
  if (candidates.length !== 1) return null;
  return path.join(sessionDir, candidates[0]);
}

export function listSessions() {
  const root = getDirectivesRoot();
  if (!fs.existsSync(root)) return [];
  const dirs = fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory());
  return dirs.map((d) => {
    const dir = path.join(root, d.name);
    const metaPath = findDirectiveMetaFile(dir);
    const meta = readMetaFile(metaPath);
    return { name: d.name, dir, metaPath, meta };
  });
}

export function resolveSessionDir(sessionRef) {
  const ref = String(sessionRef || "").trim();
  if (!ref) throw new Error("Missing session identifier. Pass --session (directory name or session UUID).");

  const root = getDirectivesRoot();
  const exact = path.join(root, ref);
  if (fs.existsSync(exact) && fs.statSync(exact).isDirectory()) return exact;

  const matches = listSessions().filter((s) => s.meta && String(s.meta.id || "") === ref).map((s) => s.dir);
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) throw new Error(`Session UUID is ambiguous across directories: ${ref}`);

  throw new Error(`Session not found: ${ref}`);
}

function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function dayStampUtc() {
  const now = new Date();
  const yy = String(now.getUTCFullYear()).slice(-2);
  const mm = pad2(now.getUTCMonth() + 1);
  const dd = pad2(now.getUTCDate());
  return `${yy}-${mm}-${dd}`;
}

export function generateSessionDirName(title) {
  const slug = slugify(title) || "directive";
  const stamp = dayStampUtc();
  return `${stamp}_${slug}`;
}
