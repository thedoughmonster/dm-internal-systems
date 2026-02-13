import fs from "node:fs";
import path from "node:path";
import { resolveSessionDir, getRepoRoot } from "./_session_resolver.mjs";

export function toUtcIso() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function readJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

export function writeJson(filePath, doc) {
  fs.writeFileSync(filePath, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
}

export function findDirectiveMetaFile(sessionDir) {
  const files = fs
    .readdirSync(sessionDir, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => d.name);
  const metas = files.filter((f) => /^[a-z0-9]+(?:-[a-z0-9]+)*\.meta\.json$/.test(f));
  if (metas.length !== 1) {
    throw new Error(`Expected exactly one <directive_slug>.meta.json in ${sessionDir}`);
  }
  return path.join(sessionDir, metas[0]);
}

export function resolveTaskFile(sessionDir, taskRef) {
  const raw = String(taskRef || "").trim();
  if (!raw) throw new Error("Missing required --task");

  const candidates = fs
    .readdirSync(sessionDir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith(".task.json"))
    .map((d) => d.name)
    .sort();

  if (raw.endsWith(".task.json")) {
    if (!candidates.includes(raw)) throw new Error(`Task file not found: ${raw}`);
    return path.join(sessionDir, raw);
  }

  const slug = raw;
  const name = `${slug}.task.json`;
  if (candidates.includes(name)) return path.join(sessionDir, name);

  throw new Error(`Task not found: ${raw}`);
}

export function resolveDirectiveContext(sessionRef) {
  const sessionDir = resolveSessionDir(sessionRef);
  const directiveMetaPath = findDirectiveMetaFile(sessionDir);
  const directiveDoc = readJson(directiveMetaPath);
  if (!directiveDoc || typeof directiveDoc !== "object" || Array.isArray(directiveDoc) || !directiveDoc.meta) {
    throw new Error(`Invalid directive metadata file: ${directiveMetaPath}`);
  }

  return {
    repoRoot: getRepoRoot(),
    sessionDir,
    directiveMetaPath,
    directiveDoc,
  };
}

export function findDirectiveHandoffFile(sessionDir, directiveDoc) {
  const slug = String((directiveDoc && directiveDoc.meta && directiveDoc.meta.directive_slug) || "").trim();
  if (!slug) return null;
  const handoffPath = path.join(sessionDir, `${slug}.handoff.json`);
  if (!fs.existsSync(handoffPath)) return null;
  return handoffPath;
}

export function readDirectiveHandoffIfPresent(sessionDir, directiveDoc) {
  const handoffPath = findDirectiveHandoffFile(sessionDir, directiveDoc);
  if (!handoffPath) return null;
  const handoffDoc = readJson(handoffPath);
  if (!handoffDoc || typeof handoffDoc !== "object" || Array.isArray(handoffDoc)) {
    throw new Error(`Invalid handoff file: ${handoffPath}`);
  }
  if (!handoffDoc.handoff || typeof handoffDoc.handoff !== "object" || Array.isArray(handoffDoc.handoff)) {
    throw new Error(`Missing handoff object: ${handoffPath}`);
  }
  return { handoffPath, handoffDoc };
}

export function listTaskFiles(sessionDir) {
  return fs
    .readdirSync(sessionDir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith(".task.json"))
    .map((d) => path.join(sessionDir, d.name))
    .sort();
}
