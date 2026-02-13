#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const yaml = require("js-yaml");

function getRepoRoot() {
  const scriptFile = fileURLToPath(import.meta.url);
  const scriptDir = path.dirname(scriptFile);
  return path.resolve(scriptDir, "../../..");
}

function usage() {
  return "Usage: node .directive-cli/scripts/directives/migrate_frontmatter_to_meta_yml.mjs [--dry-run]";
}

function parseArgs(argv) {
  const args = {};
  for (const token of argv) {
    if (token === "--dry-run") args["dry-run"] = true;
    else if (token === "--help") args.help = true;
  }
  return args;
}

function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function parseTaskMarkdownSections(raw) {
  const headings = [];
  const re = /^#{1,6}\s+(.+?)\s*$/gm;
  for (const m of raw.matchAll(re)) headings.push({ idx: m.index, title: m[1].trim(), full: m[0] });
  const get = (name) => {
    const i = headings.findIndex((h) => h.title.toLowerCase() === name.toLowerCase());
    if (i < 0) return "";
    const start = headings[i].idx + headings[i].full.length;
    const end = i + 1 < headings.length ? headings[i + 1].idx : raw.length;
    return raw.slice(start, end).trim();
  };
  return {
    objective: get("Objective"),
    constraints: get("Constraints"),
    allowedFiles: get("Allowed files"),
    steps: get("Steps"),
    validation: get("Validation"),
    expectedOutput: get("Expected output"),
    stopConditions: get("Stop conditions"),
    notes: get("Notes"),
  };
}

function linesList(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "))
    .map((l) => l.slice(2).trim());
}

function parseValidationCommands(text) {
  const t = String(text || "");
  const fenced = t.match(/```(?:bash)?\n([\s\S]*?)```/m);
  const src = fenced ? fenced[1] : t;
  return src.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}

function parseSteps(text) {
  const out = [];
  const matches = String(text || "").matchAll(/^\s*(\d+)\.\s+(.+)\s*$/gm);
  for (const m of matches) {
    out.push({
      id: `step_${m[1]}`,
      instruction: m[2].trim(),
      files: [],
      artifact: "",
    });
  }
  return out;
}

function writeJson(filePath, doc, dryRun) {
  if (!dryRun) fs.writeFileSync(filePath, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
}

function migrateSession(sessionDir, dryRun) {
  const actions = [];
  let meta = null;
  let directiveSlug = "";

  const files = fs.readdirSync(sessionDir, { withFileTypes: true }).filter((d) => d.isFile()).map((d) => d.name);

  const existingMeta = files.filter((f) => /^[a-z0-9]+(?:-[a-z0-9]+)*\.meta\.json$/.test(f));
  if (existingMeta.length === 1) {
    const p = path.join(sessionDir, existingMeta[0]);
    meta = parseJson(p).meta;
    directiveSlug = existingMeta[0].replace(/\.meta\.json$/, "");
  } else if (files.includes("SESSION.meta.json")) {
    const p = path.join(sessionDir, "SESSION.meta.json");
    meta = parseJson(p).meta;
  } else if (files.includes("README.meta.json")) {
    const p = path.join(sessionDir, "README.meta.json");
    meta = parseJson(p).meta;
  } else if (files.includes("README.meta.yml")) {
    const y = yaml.load(fs.readFileSync(path.join(sessionDir, "README.meta.yml"), "utf8"));
    meta = y?.meta || null;
  }

  if (!meta) return actions;
  if (!meta.id) meta.id = randomUUID();
  directiveSlug = directiveSlug || slugify(meta.directive_slug || meta.title || path.basename(sessionDir) || "directive");
  meta.directive_slug = directiveSlug;
  if (!meta.directive_branch) meta.directive_branch = `feat/${directiveSlug}`;
  if (!meta.directive_base_branch) meta.directive_base_branch = "dev";
  if (!meta.directive_merge_status) meta.directive_merge_status = "open";
  if (!meta.commit_policy) meta.commit_policy = "end_of_directive";

  const outMetaPath = path.join(sessionDir, `${directiveSlug}.meta.json`);
  writeJson(outMetaPath, { kind: "directive_session_meta", schema_version: "1.0", meta }, dryRun);
  actions.push(`migrated session meta -> ${outMetaPath}`);

  for (const legacy of ["SESSION.meta.json", "README.meta.json", "README.meta.yml", "SESSION.md", "README.md"]) {
    const p = path.join(sessionDir, legacy);
    if (fs.existsSync(p) && p !== outMetaPath && !dryRun) fs.unlinkSync(p);
  }

  const handoffCandidates = ["HANDOFF.json", "HANDOFF.yml", "HANDOFF.md", `${directiveSlug}.handoff.json`]
    .map((f) => path.join(sessionDir, f))
    .filter((p) => fs.existsSync(p));
  for (const hp of handoffCandidates) {
    let doc = null;
    if (hp.endsWith(".json")) doc = parseJson(hp);
    else if (hp.endsWith(".yml")) doc = yaml.load(fs.readFileSync(hp, "utf8"));
    else if (hp.endsWith(".md")) {
      const raw = fs.readFileSync(hp, "utf8");
      const m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
      if (m) doc = yaml.load(m[1]);
    }
    if (!doc || typeof doc !== "object" || Array.isArray(doc) || !doc.handoff) continue;
    const outHandoff = path.join(sessionDir, `${directiveSlug}.handoff.json`);
    writeJson(outHandoff, { handoff: doc.handoff }, dryRun);
    actions.push(`migrated handoff -> ${outHandoff}`);
    if (!dryRun && hp !== outHandoff) fs.unlinkSync(hp);
    break;
  }

  for (const f of files) {
    const full = path.join(sessionDir, f);
    if (/^[a-z0-9]+(?:-[a-z0-9]+)*\.task\.json$/.test(f)) continue;
    if (/^TASK_.*\.md$/.test(f)) {
      const taskSlug = slugify(f.replace(/^TASK_/, "").replace(/\.md$/, ""));
      const raw = fs.readFileSync(full, "utf8");
      const sec = parseTaskMarkdownSections(raw);
      let taskMeta = null;
      const legacyBase = f.replace(/\.md$/, "");
      const taskMetaPath = path.join(sessionDir, `${legacyBase}.meta.json`);
      const taskMetaYmlPath = path.join(sessionDir, `${legacyBase}.meta.yml`);
      if (fs.existsSync(taskMetaPath)) taskMeta = parseJson(taskMetaPath).meta;
      else if (fs.existsSync(taskMetaYmlPath)) {
        const y = yaml.load(fs.readFileSync(taskMetaYmlPath, "utf8"));
        taskMeta = y?.meta || null;
      }
      if (!taskMeta) taskMeta = {
        id: randomUUID(),
        title: taskSlug,
        status: "todo",
        priority: "medium",
        session_priority: String(meta.session_priority || "medium"),
        summary: "",
        execution_model: "gpt-5.2-codex",
        thinking_level: "high",
      };
      if (!taskMeta.id) taskMeta.id = randomUUID();
      const out = {
        kind: "directive_task",
        schema_version: "1.0",
        meta: taskMeta,
        task: {
          objective: sec.objective || "",
          constraints: linesList(sec.constraints),
          allowed_files: linesList(sec.allowedFiles).map((line) => ({ path: line, access: "edit" })),
          steps: parseSteps(sec.steps),
          validation: { commands: parseValidationCommands(sec.validation) },
          expected_output: linesList(sec.expectedOutput),
          stop_conditions: linesList(sec.stopConditions),
          notes: linesList(sec.notes),
        },
      };
      const outTask = path.join(sessionDir, `${taskSlug}.task.json`);
      writeJson(outTask, out, dryRun);
      actions.push(`migrated task -> ${outTask}`);
      if (!dryRun) {
        for (const legacy of [full, taskMetaPath, taskMetaYmlPath]) {
          if (fs.existsSync(legacy) && legacy !== outTask) fs.unlinkSync(legacy);
        }
      }
    }
  }

  return actions;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(`${usage()}\n`);
    process.exit(0);
  }

  const root = path.join(getRepoRoot(), "apps/web/.local/directives");
  if (!fs.existsSync(root)) {
    process.stdout.write("No directives directory found.\n");
    process.exit(0);
  }

  const actions = [];
  for (const d of fs.readdirSync(root, { withFileTypes: true }).filter((x) => x.isDirectory())) {
    actions.push(...migrateSession(path.join(root, d.name), Boolean(args["dry-run"])));
  }

  if (actions.length === 0) {
    process.stdout.write("No migration needed.\n");
    process.exit(0);
  }
  for (const a of actions) process.stdout.write(`${a}\n`);
  process.stdout.write(`Migration complete: ${actions.length} action(s)\n`);
}

main();
