import fs from "node:fs";
import path from "node:path";

function lower(value) {
  return String(value || "").trim().toLowerCase();
}

export function isArchivedStatus(status) {
  return ["archived", "done", "completed", "cancelled"].includes(lower(status));
}

function humanizeSlug(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function loadJson(filePath) {
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function listDirectiveSessions(directivesRoot, { includeArchived = false } = {}) {
  if (!fs.existsSync(directivesRoot)) return [];
  const sessions = fs
    .readdirSync(directivesRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const out = [];
  for (const session of sessions) {
    const sessionDir = path.join(directivesRoot, session);
    const files = fs.readdirSync(sessionDir);
    const metaFile = files.find((f) => f.endsWith(".meta.json"));
    if (!metaFile) continue;

    const metaPath = path.join(sessionDir, metaFile);
    const metaDoc = loadJson(metaPath);
    const meta = metaDoc && metaDoc.meta && typeof metaDoc.meta === "object" ? metaDoc.meta : {};
    const status = String(meta.status || "open");
    if (!includeArchived && isArchivedStatus(status)) continue;

    const title = String(meta.title || humanizeSlug(metaFile.replace(/\.meta\.json$/u, "")) || humanizeSlug(session));
    out.push({
      session,
      session_dir: sessionDir,
      meta_file: metaFile,
      title,
      status,
      created: String(meta.created || ""),
      updated: String(meta.updated || ""),
      meta,
    });
  }

  return out;
}

function metaFieldValue(meta, field) {
  const v = meta ? meta[field] : undefined;
  if (v === undefined || v === null || v === "") return "-";
  if (Array.isArray(v)) return v.join(",");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export function directiveDisplayRecord(directive, { mode = "compact", fields = [] } = {}) {
  const rec = {
    session: directive.session,
    status: directive.status,
    title: directive.title,
  };

  const normalizedMode = String(mode || "compact").trim().toLowerCase();
  if (normalizedMode === "detailed" || normalizedMode === "detailed-ultra") {
    rec.created = directive.created || "-";
    rec.updated = directive.updated || "-";
  }

  if (normalizedMode === "detailed-ultra") {
    const m = directive.meta || {};
    rec.priority = m.priority ?? "-";
    rec.session_priority = m.session_priority ?? "-";
    rec.owner = m.owner ?? "-";
    rec.assignee = m.assignee ?? "-";
    rec.bucket = m.bucket ?? "-";
    rec.directive_branch = m.directive_branch ?? "-";
    rec.directive_base_branch = m.directive_base_branch ?? "-";
    rec.commit_policy = m.commit_policy ?? "-";
  }

  for (const f of fields) {
    const key = String(f || "").trim();
    if (!key) continue;
    rec[key] = metaFieldValue(directive.meta || {}, key);
  }

  return rec;
}
