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

export function normalizeScopePath(rawPath) {
  const raw = String(rawPath || "").trim();
  if (!raw) return "";
  let out = raw.replace(/`/g, "").trim();
  out = out.replace(/\\/g, "/");
  out = out.replace(/\s+\([^)]*\)\s*$/u, "");
  out = out.replace(/^\.\//, "");

  if (out.endsWith("/...")) out = out.slice(0, -4);
  if (out.includes("*")) out = out.slice(0, out.indexOf("*"));
  out = out.replace(/\/+$/u, "");

  if (!out || out === ".") return "";
  if (path.isAbsolute(out)) return "";
  if (out.startsWith("../") || out.includes("/../")) return "";
  return out;
}

function inScope(filePath, prefixes) {
  const normalizedFile = String(filePath || "").replace(/\\/g, "/").trim();
  return prefixes.some((prefix) => normalizedFile === prefix || normalizedFile.startsWith(`${prefix}/`));
}

export function directiveScopePrefixes(repoRoot, sessionDir) {
  const prefixes = new Set();
  const relSession = path.relative(repoRoot, sessionDir).replace(/\\/g, "/");
  if (relSession) prefixes.add(relSession);

  for (const taskPath of listTaskFiles(sessionDir)) {
    let taskDoc;
    try {
      taskDoc = readJson(taskPath);
    } catch {
      continue;
    }
    const allowedFiles = Array.isArray(taskDoc?.task?.allowed_files) ? taskDoc.task.allowed_files : [];
    for (const entry of allowedFiles) {
      if (!entry || typeof entry !== "object") continue;
      const normalized = normalizeScopePath(entry.path);
      if (normalized) prefixes.add(normalized);
    }
  }
  return Array.from(prefixes).sort();
}

export function assertDirtyFilesWithinDirectiveScope(repoRoot, sessionDir, dirtyFiles, { extraAllowed = [] } = {}) {
  const base = directiveScopePrefixes(repoRoot, sessionDir);
  const extras = Array.isArray(extraAllowed) ? extraAllowed.map((p) => normalizeScopePath(p)).filter(Boolean) : [];
  const allowed = Array.from(new Set([...base, ...extras]));
  if (allowed.length === 0) return;

  const disallowed = (dirtyFiles || []).filter((f) => !inScope(f, allowed));
  if (disallowed.length === 0) return;

  const show = disallowed.slice(0, 20).map((f) => `  - ${f}`).join("\n");
  const more = disallowed.length > 20 ? `\n  ... (${disallowed.length - 20} more)` : "";
  throw new Error(
    `Out-of-scope dirty files detected for directive flow.\nDirty files:\n${show}${more}\n` +
    `Allowed scope prefixes:\n${allowed.map((p) => `  - ${p}`).join("\n")}`,
  );
}

function pathsIntersect(a, b) {
  return a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`);
}

function linkedByDependency(a, b) {
  const depsA = new Set(Array.isArray(a.depends_on) ? a.depends_on.map((v) => String(v)) : []);
  const depsB = new Set(Array.isArray(b.depends_on) ? b.depends_on.map((v) => String(v)) : []);
  const idA = String(a.id || "");
  const idB = String(b.id || "");
  return (idA && depsB.has(idA)) || (idB && depsA.has(idB));
}

export function findTaskAllowedFileIntersections(sessionDir) {
  const entries = [];
  for (const taskPath of listTaskFiles(sessionDir)) {
    let taskDoc;
    try {
      taskDoc = readJson(taskPath);
    } catch {
      continue;
    }
    const meta = taskDoc && taskDoc.meta && typeof taskDoc.meta === "object" ? taskDoc.meta : {};
    const allowedFiles = Array.isArray(taskDoc?.task?.allowed_files) ? taskDoc.task.allowed_files : [];
    const prefixes = Array.from(new Set(
      allowedFiles
        .map((entry) => (entry && typeof entry === "object" ? normalizeScopePath(entry.path) : ""))
        .filter(Boolean),
    )).sort();
    entries.push({
      task_file: path.basename(taskPath),
      task_slug: path.basename(taskPath, ".task.json"),
      id: String(meta.id || ""),
      depends_on: Array.isArray(meta.depends_on) ? meta.depends_on : [],
      prefixes,
    });
  }

  const conflicts = [];
  for (let i = 0; i < entries.length; i += 1) {
    for (let j = i + 1; j < entries.length; j += 1) {
      const a = entries[i];
      const b = entries[j];
      const overlaps = [];
      for (const pa of a.prefixes) {
        for (const pb of b.prefixes) {
          if (pathsIntersect(pa, pb)) overlaps.push({ left: pa, right: pb });
        }
      }
      if (overlaps.length === 0) continue;
      conflicts.push({
        task_a: a.task_file,
        task_b: b.task_file,
        linked_by_dependency: linkedByDependency(a, b),
        overlaps,
      });
    }
  }
  return conflicts;
}
