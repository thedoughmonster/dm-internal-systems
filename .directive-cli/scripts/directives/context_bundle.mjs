#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { selectOption } from "./_prompt_helpers.mjs";
import { listDirectiveSessions } from "./_directive_listing.mjs";

const ROLES = ["architect", "executor", "pair", "auditor"];
const COLORS = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m",
  red: "\x1b[31m",
};

function repoRoot() {
  const scriptFile = fileURLToPath(import.meta.url);
  const scriptDir = path.dirname(scriptFile);
  return path.resolve(scriptDir, "../../..");
}

function parseArgs(argv) {
  const args = { include: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      if (!args._) args._ = [];
      args._.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (key === "include") {
      if (!next || next.startsWith("--")) throw new Error("Missing value for --include");
      args.include.push(next);
      i += 1;
      continue;
    }
    if (!next || next.startsWith("--")) args[key] = true;
    else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

function usage() {
  return [
    "Usage:",
    "  dc agent <build|check|show|bootstrap|start> [options]",
    "",
    "Bundle options:",
    "  --out <path>            Output compiled context path (default: .codex/context/compiled.md)",
    "  --meta <path>           Output metadata path (default: .codex/context/compiled.meta.json)",
    "  --policy-out <path>     Output compiled policy bundle path (default: derived from --out)",
    "  --role <name>           Role bundle target: architect|executor|pair|auditor",
    "  --all-roles             Build/check/show all role bundles",
    "  --include <path>        Additional file to include (repeatable, repo-relative)",
    "  --print                 With show, print compiled content",
    "",
    "Bootstrap options:",
    "  --codex-home <path>     Codex home (default: ~/.codex)",
    "  --profile <name>        Profile name (required; prompts with options in TTY if omitted)",
    "  --role <name>           Role for bundle/profile: architect|executor|pair|auditor",
    "  --directive <name>      Optional directive session for start/show selection",
    "  --session <name>        Alias for --directive (compatibility)",
    "  --task <slug>           Optional task slug (or directive/task) for start",
    "  --file <name>           Optional file name for interactive show",
    "  --codex-bin <path>      Codex executable path for start (default: codex)",
    "  --config <path>         dc config path (default: .codex/dc.config.json)",
    "  --session-log-dir <p>   Session log directory (default: .directive-cli/session-logs)",
    "  --no-bootstrap          With start, skip bootstrap/update before launch",
    "  --dry-run               Preview config changes without writing",
    "",
    "General:",
    "  --json                  Emit JSON summary",
    "  --help                  Show this help",
  ].join("\n");
}

function resolvePath(root, input, fallback) {
  const raw = String(input || fallback);
  return path.resolve(root, raw);
}

function colorize(color, text) {
  if (!stdout.isTTY) return text;
  return `${COLORS[color] || ""}${text}${COLORS.reset}`;
}

function resolveHomePath(input, fallback) {
  const raw = String(input || fallback);
  if (raw.startsWith("~/")) return path.join(os.homedir(), raw.slice(2));
  return path.resolve(raw);
}

function existsFile(filePath) {
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

function sanitizeRoleName(value) {
  return String(value || "").trim().toLowerCase();
}

function assertValidRole(role) {
  if (!ROLES.includes(role)) {
    throw new Error(`Invalid role '${role}'. Expected one of: ${ROLES.join(", ")}`);
  }
}

function listMarkdownFiles(rootDir) {
  if (!fs.existsSync(rootDir)) return [];
  return fs
    .readdirSync(rootDir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith(".md"))
    .map((d) => path.join(rootDir, d.name))
    .sort();
}

function listJsonFiles(rootDir) {
  if (!fs.existsSync(rootDir)) return [];
  return fs
    .readdirSync(rootDir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith(".json"))
    .map((d) => path.join(rootDir, d.name))
    .sort();
}

function defaultSourceFiles(root, role) {
  if (role) assertValidRole(role);
  const files = [];
  const push = (rel) => {
    const p = path.join(root, rel);
    if (existsFile(p)) files.push(p);
  };

  push(".directive-cli/AGENTS.md");
  push("apps/web/docs/guides/component-paradigm.md");
  files.push(...listJsonFiles(path.join(root, ".directive-cli", "policies")));

  files.push(...listMarkdownFiles(path.join(root, ".directive-cli", "docs", "agent-rules", "shared")));

  if (role) {
    files.push(...listMarkdownFiles(path.join(root, ".directive-cli", "docs", "agent-rules", role)));
  } else {
    for (const roleDirName of ROLES) {
      files.push(...listMarkdownFiles(path.join(root, ".directive-cli", "docs", "agent-rules", roleDirName)));
    }
  }

  return Array.from(new Set(files));
}

function loadSources(root, includes, role) {
  const files = defaultSourceFiles(root, role);
  for (const include of includes || []) {
    const full = path.resolve(root, include);
    if (!existsFile(full)) throw new Error(`Included file not found: ${include}`);
    files.push(full);
  }
  return Array.from(new Set(files));
}

function relative(root, abs) {
  return path.relative(root, abs).replace(/\\/g, "/");
}

function roleBundleDefaults(role) {
  if (!role) {
    return {
      out: ".codex/context/compiled.md",
      meta: ".codex/context/compiled.meta.json",
    };
  }
  return {
    out: `.codex/context/${role}.compiled.md`,
    meta: `.codex/context/${role}.compiled.meta.json`,
  };
}

function resolveRolePaths(root, args, role) {
  const defaults = roleBundleDefaults(role);
  const allRolesMode = Boolean(args["all-roles-mode"]);
  if (role && allRolesMode) {
    const outBase = resolvePath(root, args.out, defaults.out);
    const metaBase = resolvePath(root, args.meta, defaults.meta);
    return {
      outPath: path.join(path.dirname(outBase), `${role}.compiled.md`),
      metaPath: path.join(path.dirname(metaBase), `${role}.compiled.meta.json`),
    };
  }
  return {
    outPath: resolvePath(root, args.out, defaults.out),
    metaPath: resolvePath(root, args.meta, defaults.meta),
  };
}

function derivePolicyOutPath(outPath) {
  const base = String(outPath || "");
  const dir = path.dirname(base);
  const file = path.basename(base);
  if (file === "compiled.md") {
    return path.join(dir, "policy.compiled.json");
  }
  if (base.endsWith(".compiled.md")) {
    return base.replace(/\.compiled\.md$/u, ".policy.compiled.json");
  }
  if (base.endsWith(".md")) {
    return base.replace(/\.md$/u, ".policy.compiled.json");
  }
  return `${base}.policy.compiled.json`;
}

function resolvePolicyOutPath(root, args, role) {
  const allRolesMode = Boolean(args["all-roles-mode"]);
  if (allRolesMode && role) {
    const policyBase = args["policy-out"]
      ? resolvePath(root, args["policy-out"], ".codex/context/policy.compiled.json")
      : derivePolicyOutPath(resolveRolePaths(root, args, role).outPath);
    return path.join(path.dirname(policyBase), `${role}.policy.compiled.json`);
  }
  if (args["policy-out"]) return resolvePath(root, args["policy-out"], "");
  const { outPath } = resolveRolePaths(root, args, role);
  return derivePolicyOutPath(outPath);
}

function compileBundle(root, sourceFiles) {
  const sections = [];
  const hash = crypto.createHash("sha256");

  for (const abs of sourceFiles) {
    const rel = relative(root, abs);
    const content = fs.readFileSync(abs, "utf8").replace(/\r\n/g, "\n");
    hash.update(rel);
    hash.update("\n");
    hash.update(content);
    hash.update("\n");

    const ext = path.extname(rel).toLowerCase();
    const fence = ext === ".json" ? "json" : "markdown";

    sections.push([
      `## Source: ${rel}`,
      "",
      `\`\`\`${fence}`,
      content,
      "```",
      "",
    ].join("\n"));
  }

  const compiled = [
    "# Codex Context Bundle",
    "",
    `Generated at: ${new Date().toISOString()}`,
    "",
    ...sections,
  ].join("\n");

  return {
    compiled,
    digest: hash.digest("hex"),
  };
}

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((v) => stableStringify(v)).join(",")}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(",")}}`;
}

function loadPolicySources(root) {
  const policyDir = path.join(root, ".directive-cli", "policies");
  const files = listJsonFiles(policyDir);
  return files.map((abs) => ({
    abs,
    rel: relative(root, abs),
    doc: JSON.parse(fs.readFileSync(abs, "utf8")),
  }));
}

function compilePolicyBundle(root, role) {
  const sources = loadPolicySources(root);
  const hash = crypto.createHash("sha256");
  for (const src of sources) {
    hash.update(src.rel);
    hash.update("\n");
    hash.update(stableStringify(src.doc));
    hash.update("\n");
  }
  const digest = hash.digest("hex");
  const doc = {
    kind: "directive_cli_policy_bundle",
    schema_version: "1.0",
    generated_at: new Date().toISOString(),
    role: role || "all",
    hash: digest,
    sources: sources.map((s) => s.rel),
    policies: sources.map((s) => ({ source: s.rel, document: s.doc })),
  };
  return { doc, digest, sources: doc.sources };
}

function writeBundle(outPath, metaPath, payload) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.mkdirSync(path.dirname(metaPath), { recursive: true });
  fs.writeFileSync(outPath, payload.compiled, "utf8");
  fs.writeFileSync(metaPath, `${JSON.stringify(payload.meta, null, 2)}\n`, "utf8");
}

function writePolicyBundle(policyOutPath, policyBundle) {
  fs.mkdirSync(path.dirname(policyOutPath), { recursive: true });
  fs.writeFileSync(policyOutPath, `${JSON.stringify(policyBundle.doc, null, 2)}\n`, "utf8");
}

function readMeta(metaPath) {
  if (!existsFile(metaPath)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    return data;
  } catch {
    return null;
  }
}

function output(args, payload) {
  if (args.json) {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return;
  }
  process.stdout.write(`${payload.message}\n`);
}

function computeBundle(root, args, role) {
  const { outPath, metaPath } = resolveRolePaths(root, args, role);
  const policyOutPath = resolvePolicyOutPath(root, args, role);
  const sources = loadSources(root, args.include, role);
  const { compiled, digest } = compileBundle(root, sources);
  const policyBundle = compilePolicyBundle(root, role);
  const meta = {
    bundle_kind: "codex_context_bundle",
    schema_version: "1.0",
    generated_at: new Date().toISOString(),
    role: role || "all",
    repo_root: root,
    out_file: outPath,
    hash: digest,
    sources: sources.map((s) => relative(root, s)),
    policy_file: policyOutPath,
    policy_hash: policyBundle.digest,
    policy_sources: policyBundle.sources,
  };
  return { outPath, metaPath, compiled, meta, policyOutPath, policyBundle };
}

function runBuild(root, args) {
  if (args["all-roles"]) {
    const built = [];
    for (const role of ROLES) {
      const bundle = computeBundle(root, { ...args, "all-roles-mode": true }, role);
      writeBundle(bundle.outPath, bundle.metaPath, bundle);
      writePolicyBundle(bundle.policyOutPath, bundle.policyBundle);
      built.push({
        role,
        out_file: bundle.outPath,
        meta_file: bundle.metaPath,
        policy_file: bundle.policyOutPath,
        policy_hash: bundle.policyBundle.digest,
        hash: bundle.meta.hash,
      });
    }
    output(args, {
      message: `Built role bundles: ${ROLES.join(", ")}`,
      bundles: built,
    });
    return { bundles: built };
  }

  const role = args.role ? sanitizeRoleName(args.role) : "";
  if (role) assertValidRole(role);
  const bundle = computeBundle(root, args, role || undefined);
  writeBundle(bundle.outPath, bundle.metaPath, bundle);
  writePolicyBundle(bundle.policyOutPath, bundle.policyBundle);
  output(args, {
    message: `Built context bundle: ${bundle.outPath}`,
    role: role || "all",
    out_file: bundle.outPath,
    meta_file: bundle.metaPath,
    policy_file: bundle.policyOutPath,
    policy_hash: bundle.policyBundle.digest,
    hash: bundle.meta.hash,
    sources: bundle.meta.sources,
  });
  return bundle;
}

function runCheck(root, args) {
  if (args["all-roles"]) {
    for (const role of ROLES) {
      runCheck(root, { ...args, role, "all-roles": false, "all-roles-mode": true, json: false });
    }
    output(args, {
      message: "All role bundles are up to date",
      status: "ok",
      roles: ROLES,
    });
    return;
  }

  const role = args.role ? sanitizeRoleName(args.role) : "";
  if (role) assertValidRole(role);
  const { outPath, metaPath } = resolveRolePaths(root, args, role || undefined);
  const policyOutPath = resolvePolicyOutPath(root, args, role || undefined);
  const meta = readMeta(metaPath);

  if (!existsFile(outPath) || !existsFile(policyOutPath) || !meta || !Array.isArray(meta.sources)) {
    output(args, {
      message: "Context bundle is missing or metadata invalid",
      status: "missing",
      out_file: outPath,
      meta_file: metaPath,
      policy_file: policyOutPath,
    });
    process.exit(1);
  }

  const sourceAbs = meta.sources.map((s) => path.resolve(root, s));
  for (const f of sourceAbs) {
    if (!existsFile(f)) {
      output(args, {
        message: `Context bundle stale: missing source ${relative(root, f)}`,
        status: "stale",
        out_file: outPath,
        meta_file: metaPath,
      });
      process.exit(1);
    }
  }

  const { digest } = compileBundle(root, sourceAbs);
  const policyBundle = compilePolicyBundle(root, role || undefined);
  const policyDoc = readMeta(policyOutPath);
  const upToDate = digest === String(meta.hash || "")
    && String(meta.policy_hash || "") === policyBundle.digest
    && policyDoc
    && String(policyDoc.hash || "") === policyBundle.digest;

  output(args, {
    message: upToDate ? "Context bundle is up to date" : "Context bundle is stale",
    status: upToDate ? "ok" : "stale",
    role: role || "all",
    out_file: outPath,
    meta_file: metaPath,
    policy_file: policyOutPath,
    policy_hash: policyBundle.digest,
    hash: digest,
  });

  if (!upToDate) process.exit(1);
}

async function runShow(root, args) {
  if (args["all-roles"]) {
    const summaries = ROLES.map((role) => {
      const { outPath, metaPath } = resolveRolePaths(root, { ...args, "all-roles-mode": true }, role);
      const meta = readMeta(metaPath);
      return {
        role,
        out_file: outPath,
        meta_file: metaPath,
        policy_file: meta ? String(meta.policy_file || resolvePolicyOutPath(root, { ...args, "all-roles-mode": true }, role)) : resolvePolicyOutPath(root, { ...args, "all-roles-mode": true }, role),
        hash: meta ? meta.hash : null,
        policy_hash: meta ? meta.policy_hash : null,
      };
    });
    if (args.json) {
      output(args, {
        message: "Role bundle summary",
        bundles: summaries,
      });
      return;
    }
    process.stdout.write(`${colorize("cyan", "Role bundle summary")}\n`);
    for (const row of summaries) {
      process.stdout.write(
        `  ${colorize("green", row.role)}  ${row.out_file}  ${colorize("magenta", row.hash || "no-hash")}  ${row.policy_file}\n`,
      );
    }
    return;
  }

  if (stdin.isTTY && !args.out && !args.meta && !args.role && !args["all-roles"] && !args.print) {
    return runDirectiveFileShow(root, args);
  }

  const role = args.role ? sanitizeRoleName(args.role) : "";
  if (role) assertValidRole(role);
  const { outPath, metaPath } = resolveRolePaths(root, args, role || undefined);
  const policyOutPath = resolvePolicyOutPath(root, args, role || undefined);

  if (!existsFile(outPath)) throw new Error(`Context bundle not found: ${outPath}`);

  if (args.print) {
    process.stdout.write(fs.readFileSync(outPath, "utf8"));
    return;
  }

  const meta = readMeta(metaPath);
  if (args.json) {
    output(args, {
      message: `Context bundle: ${outPath}`,
      role: role || "all",
      out_file: outPath,
      meta_file: metaPath,
      policy_file: policyOutPath,
      hash: meta ? meta.hash : null,
      policy_hash: meta ? meta.policy_hash : null,
      source_count: meta && Array.isArray(meta.sources) ? meta.sources.length : null,
    });
    return;
  }

  process.stdout.write(`${colorize("cyan", "Context bundle:")} ${outPath}\n`);
  process.stdout.write(`${colorize("cyan", "Role:")} ${role || "all"}\n`);
  process.stdout.write(`${colorize("cyan", "Meta file:")} ${metaPath}\n`);
  process.stdout.write(`${colorize("cyan", "Policy file:")} ${policyOutPath}\n`);
  process.stdout.write(`${colorize("cyan", "Hash:")} ${colorize("magenta", meta ? String(meta.hash || "n/a") : "n/a")}\n`);
  process.stdout.write(`${colorize("cyan", "Policy hash:")} ${colorize("magenta", meta ? String(meta.policy_hash || "n/a") : "n/a")}\n`);
  process.stdout.write(
    `${colorize("cyan", "Sources:")} ${meta && Array.isArray(meta.sources) ? meta.sources.length : "n/a"}\n`,
  );
}

async function runDirectiveFileShow(root, args) {
  const directive = await requireStartDirective(args, root);
  if (!directive) throw new Error("Missing required --directive for non-interactive show.");
  const files = listDirectiveFiles(directive);
  if (files.length === 0) throw new Error(`No json files found in directive: ${directive.session}`);

  let chosen = null;
  const explicitFile = String(args.file || "").trim();
  if (explicitFile) {
    chosen = files.find((f) => f.name === explicitFile);
    if (!chosen) throw new Error(`File not found in directive: ${explicitFile}`);
  } else {
    const selected = await selectOption({
      input: stdin,
      output: stdout,
      label: "Select file:",
      options: files.map((f) => ({ label: f.name, value: f.name })),
      defaultIndex: 0,
    });
    chosen = files.find((f) => f.name === selected) || null;
    if (!chosen) throw new Error("Invalid file selection.");
  }

  const content = fs.readFileSync(chosen.path, "utf8");
  try {
    process.stdout.write(`${JSON.stringify(JSON.parse(content), null, 2)}\n`);
  } catch {
    process.stdout.write(content);
  }
}

function sanitizeProfileName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "project";
}

function listExistingProfiles(configPath) {
  if (!existsFile(configPath)) return [];
  const content = fs.readFileSync(configPath, "utf8");
  const found = new Set();
  const re = /^\[profiles\.([a-zA-Z0-9_-]+)\]\s*$/gm;
  for (const match of content.matchAll(re)) {
    const raw = String(match[1] || "").trim();
    if (!raw) continue;
    found.add(sanitizeProfileName(raw));
  }
  return Array.from(found).sort();
}

function lower(value) {
  return String(value || "").trim().toLowerCase();
}

function humanizeSlug(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function statusColor(status) {
  const s = lower(status);
  if (s === "todo" || s === "open") return "yellow";
  if (s === "in_progress" || s === "ready") return "cyan";
  if (s === "blocked") return "red";
  if (s === "done" || s === "completed") return "green";
  if (s === "archived" || s === "cancelled") return "dim";
  return "magenta";
}

function statusTag(status) {
  return `[${String(status || "open")}]`;
}

function isArchivedStatus(status) {
  return ["archived", "done", "completed", "cancelled"].includes(lower(status));
}

function loadJson(filePath) {
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function readDcConfig(root, args) {
  const configPath = path.resolve(root, String(args.config || ".codex/dc.config.json"));
  const doc = loadJson(configPath);
  if (!doc) return { configPath, agent: "", model: "" };

  const agent = sanitizeRoleName(doc.agent && doc.agent.name ? doc.agent.name : "");
  const model = String(doc.model && doc.model.name ? doc.model.name : "").trim();
  return { configPath, agent, model };
}

function listAvailableDirectiveTasks(root) {
  const base = path.join(root, "apps", "web", ".local", "directives");
  if (!fs.existsSync(base)) return [];
  const sessions = fs
    .readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const tasks = [];
  for (const session of sessions) {
    const sessionDir = path.join(base, session);
    const files = fs.readdirSync(sessionDir);
    const metaFile = files.find((f) => f.endsWith(".meta.json"));
    if (!metaFile) continue;
    const metaDoc = loadJson(path.join(sessionDir, metaFile));
    const meta = metaDoc && metaDoc.meta ? metaDoc.meta : {};
    if (isArchivedStatus(meta.status)) continue;
    const directiveSlug = metaFile.replace(/\.meta\.json$/u, "");
    const directiveTitle = String(meta.title || directiveSlug);

    const taskFiles = files.filter((f) => f.endsWith(".task.json")).sort();
    for (const file of taskFiles) {
      const taskDoc = loadJson(path.join(sessionDir, file));
      const taskMeta = taskDoc && taskDoc.meta ? taskDoc.meta : {};
      if (isArchivedStatus(taskMeta.status)) continue;
      const taskSlug = file.replace(/\.task\.json$/u, "");
      tasks.push({
        session,
        directive_slug: directiveSlug,
        directive_title: directiveTitle,
        task_slug: taskSlug,
        task_title: String(taskMeta.title || taskSlug),
        task_status: String(taskMeta.status || "todo"),
        task_file: path.join(sessionDir, file),
      });
    }
  }

  return tasks;
}

function listTasksForDirective(root, session) {
  if (!session) return [];
  return listAvailableDirectiveTasks(root).filter((t) => t.session === session);
}

function listAvailableDirectives(root) {
  const base = path.join(root, "apps", "web", ".local", "directives");
  return listDirectiveSessions(base, { includeArchived: false }).map((d) => ({
    session: d.session,
    session_dir: d.session_dir,
    directive_slug: String((d.meta && d.meta.directive_slug) || d.meta_file.replace(/\.meta\.json$/u, "")),
    title: d.title,
    status: d.status,
  }));
}

function listDirectiveFiles(directive) {
  const files = fs
    .readdirSync(directive.session_dir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith(".json"))
    .map((d) => d.name)
    .sort();
  return files.map((name) => ({
    name,
    path: path.join(directive.session_dir, name),
  }));
}

async function requireBootstrapProfile(args, configPath) {
  if (args.profile && String(args.profile).trim()) return sanitizeProfileName(args.profile);

  if (stdin.isTTY) {
    const existing = listExistingProfiles(configPath);
    const rl = createInterface({ input: stdin, output: stdout });
    try {
      if (existing.length > 0) {
        const selected = await selectOption({
          input: stdin,
          output: stdout,
          label: "Select profile:",
          options: [
            ...existing.map((p) => ({ label: p, value: p })),
            { label: "create-new", value: "__create_new__" },
          ],
          defaultIndex: 0,
        });
        if (selected !== "__create_new__") return selected;
        const custom = (await rl.question("New profile name (required): ")).trim();
        if (!custom) throw new Error("Missing required new profile name for context bootstrap.");
        return sanitizeProfileName(custom);
      }

      const input = (await rl.question("Profile name (required): ")).trim();
      if (!input) throw new Error("Missing required profile selection for context bootstrap.");
      return sanitizeProfileName(input);
    } finally {
      rl.close();
    }
  }

  throw new Error("Missing required --profile for context bootstrap.");
}

async function requireBundleRole(args) {
  if (args.role && String(args.role).trim()) {
    const explicit = sanitizeRoleName(args.role);
    assertValidRole(explicit);
    return explicit;
  }

  if (stdin.isTTY) {
    return await selectOption({
      input: stdin,
      output: stdout,
      label: "Select role:",
      options: ROLES.map((r) => ({ label: r, value: r })),
      defaultIndex: 0,
    });
  }

  throw new Error("Missing required --role for context bootstrap.");
}

function selectTaskByArgs(tasks, args) {
  const rawTask = String(args.task || "").trim();
  const rawSession = String(args.directive || args.session || "").trim();
  if (!rawTask) return null;

  let session = rawSession;
  let taskSlug = rawTask;
  if (rawTask.includes("/")) {
    const [s, t] = rawTask.split("/", 2);
    session = s;
    taskSlug = t;
  }

  const candidates = tasks.filter((t) => {
    if (session && t.session !== session) return false;
    return t.task_slug === taskSlug;
  });

  if (candidates.length === 1) return candidates[0];
  if (candidates.length > 1) {
    throw new Error(`Task slug '${taskSlug}' is ambiguous. Pass --directive <name> or --task <directive/${taskSlug}>.`);
  }
  throw new Error(`Task not found or unavailable: ${session ? `${session}/` : ""}${taskSlug}`);
}

async function requireStartTask(args, root) {
  const tasks = listAvailableDirectiveTasks(root);
  const explicit = selectTaskByArgs(tasks, args);
  if (explicit) return explicit;

  if (!stdin.isTTY) return null;

  const directiveKey = String(args.directive || args.session || "").trim();
  if (!directiveKey) return null;
  const scoped = tasks.filter((t) => t.session === directiveKey);

  if (scoped.length === 0) {
    process.stdout.write(`${colorize("cyan", "Available tasks (optional):")} ${colorize("dim", "(none)")}\n`);
    return null;
  }
  const selected = await selectOption({
    input: stdin,
    output: stdout,
    label: "Select task (optional):",
    options: [
      { label: "skip task selection", value: "__skip__" },
      ...scoped.map((t) => ({
        label: `${t.task_slug}  [${t.task_status}]  ${t.task_title}`,
        value: t.task_slug,
      })),
    ],
    defaultIndex: 0,
  });
  if (selected === "__skip__") return null;
  return scoped.find((t) => t.task_slug === selected) || null;
}

async function requireStartDirective(args, root) {
  const explicit = String(args.directive || args.session || "").trim();
  const directives = listAvailableDirectives(root);
  if (explicit) {
    const found = directives.find((d) => d.session === explicit);
    if (!found) throw new Error(`Directive not found or archived: ${explicit}`);
    return found;
  }

  if (!stdin.isTTY) return null;
  if (directives.length === 0) throw new Error("No available directives found.");

  const selected = await selectOption({
    input: stdin,
    output: stdout,
    label: "Select directive:",
    options: directives.map((d) => ({
      label: `${statusTag(d.status)} ${d.title}`,
      color: statusColor(d.status),
      value: d.session,
    })),
    defaultIndex: 0,
  });
  const matched = directives.find((d) => d.session === selected);
  if (!matched) throw new Error("Invalid directive selection.");
  return matched;
}

function upsertProfileBlock(configPath, profileName, block, dryRun) {
  const begin = `# BEGIN dc-context profile ${profileName}`;
  const end = `# END dc-context profile ${profileName}`;

  const current = existsFile(configPath) ? fs.readFileSync(configPath, "utf8") : "";
  const startIdx = current.indexOf(begin);
  const endIdx = current.indexOf(end);

  const fullBlock = `${begin}\n${block}\n${end}`;
  let next;

  if (startIdx >= 0 && endIdx > startIdx) {
    const before = current.slice(0, startIdx).replace(/[\s\n]*$/, "\n");
    const after = current.slice(endIdx + end.length).replace(/^\n*/, "\n");
    next = `${before}${fullBlock}${after}`.replace(/\n{3,}/g, "\n\n");
  } else {
    const prefix = current.trim().length ? `${current.replace(/\s*$/, "")}\n\n` : "";
    next = `${prefix}${fullBlock}\n`;
  }

  if (!dryRun) {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, next, "utf8");
  }
}

function normalizeAbsolutePath(filePath) {
  return path.resolve(String(filePath || ""));
}

function startupInstructionsPathFromBundle(bundleOutPath) {
  return path.join(path.dirname(normalizeAbsolutePath(bundleOutPath)), "startup.md");
}

function roleStatePath(codexHome) {
  return path.join(codexHome, "context", "role.state.json");
}

function readLastRole(codexHome) {
  const p = roleStatePath(codexHome);
  if (!existsFile(p)) return "";
  try {
    const doc = JSON.parse(fs.readFileSync(p, "utf8"));
    return String(doc && doc.last_role ? doc.last_role : "").trim().toLowerCase();
  } catch {
    return "";
  }
}

function writeLastRole(codexHome, role) {
  const p = roleStatePath(codexHome);
  const doc = {
    kind: "dc_role_state",
    schema_version: "1.0",
    updated_at: new Date().toISOString(),
    last_role: role,
  };
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
}

function createLiveSessionLog(root, profileName, role, selectedDirective, selectedTask, logDirArg) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+Z$/, "Z");
  const safeProfile = String(profileName || "profile").replace(/[^a-zA-Z0-9_-]+/g, "-");
  const safeRole = String(role || "role").replace(/[^a-zA-Z0-9_-]+/g, "-");
  const sessionHint = selectedDirective
    ? String(selectedDirective.session || "directive").replace(/[^a-zA-Z0-9._-]+/g, "-")
    : "no-directive";
  const taskHint = selectedTask
    ? String(selectedTask.task_slug || "task").replace(/[^a-zA-Z0-9._-]+/g, "-")
    : "no-task";
  const logsDir = logDirArg
    ? path.resolve(root, String(logDirArg))
    : path.join(root, ".directive-cli", "session-logs");
  const logPath = path.join(logsDir, `${stamp}_${safeProfile}_${safeRole}_${sessionHint}_${taskHint}.log`);
  fs.mkdirSync(logsDir, { recursive: true });
  const header = [
    `# dc session log`,
    `generated_at: ${new Date().toISOString()}`,
    `profile: ${profileName}`,
    `role: ${role}`,
    `directive: ${selectedDirective ? selectedDirective.session : ""}`,
    `task: ${selectedTask ? selectedTask.task_slug : ""}`,
    "",
  ].join("\n");
  fs.writeFileSync(logPath, header, "utf8");
  return logPath;
}

function buildDcCommandReference() {
  return {
    kind: "dc_command_reference",
    schema_version: "1.0",
    generated_at: new Date().toISOString(),
    policy: {
      no_guessing: true,
      help_on_ambiguity: [
        "dc help",
        "dc <category> --help",
        "dc <category> <command> --help",
      ],
      scripted_actions_only: true,
      require_operator_go_ahead_before_execution: true,
    },
    audiences: {
      operator_only: [
        "dc init",
        "dc directive new",
        "dc agent build",
        "dc agent bootstrap",
        "dc agent start",
      ],
      operator_and_machine: [
        "dc repo map",
        "dc directive view",
        "dc directive archive",
        "dc directive migrate",
        "dc validate",
        "dc test",
        "dc help",
        "dc agent check",
        "dc agent show",
      ],
      machine_only: [
        "dc policy validate",
        "dc runbook executor-task-cycle",
        "dc runbook executor-directive-closeout",
        "dc runbook executor-directive-cleanup",
        "dc runbook architect-authoring",
        "dc directive task",
        "dc directive handoff",
        "dc directive start",
        "dc task start",
        "dc task finish",
        "dc directive finish",
        "dc directive cleanup",
        "dc meta update",
        "dc meta architect",
        "dc meta executor",
      ],
    },
    commands: {
      directive: [
        "dc directive new",
        "dc directive task",
        "dc directive handoff",
        "dc directive view",
        "dc directive archive",
        "dc directive start",
        "dc directive finish",
        "dc directive cleanup",
        "dc directive migrate",
      ],
      task: [
        "dc task start",
        "dc task finish",
      ],
      meta: [
        "dc meta update",
        "dc meta architect",
        "dc meta executor",
      ],
      runbook: [
        "dc runbook executor-task-cycle",
        "dc runbook executor-directive-closeout",
        "dc runbook executor-directive-cleanup",
        "dc runbook architect-authoring",
      ],
      utility: [
        "dc validate",
        "dc test",
        "dc policy validate",
        "dc repo map",
      ],
      agent: [
        "dc agent build",
        "dc agent check",
        "dc agent show",
        "dc agent bootstrap",
        "dc agent start",
      ],
    },
  };
}

function writeDcCommandReference(root, args, role) {
  const { outPath } = resolveRolePaths(root, args, role || undefined);
  const refPath = path.join(path.dirname(outPath), "dc.commands.json");
  fs.mkdirSync(path.dirname(refPath), { recursive: true });
  fs.writeFileSync(refPath, `${JSON.stringify(buildDcCommandReference(), null, 2)}\n`, "utf8");
  return refPath;
}

function writeStartupInstructionsFile(startupFilePath, startupContextPath, commandRefPath, bundlePath, role, profileName) {
  const startupJson = fs.readFileSync(startupContextPath, "utf8").trim();
  const commandRefJson = fs.readFileSync(commandRefPath, "utf8").trim();
  const bundleContent = fs.readFileSync(bundlePath, "utf8").trimEnd();
  const content = [
    "# dc startup context",
    "",
    `Generated at: ${new Date().toISOString()}`,
    `Role: ${role}`,
    `Profile: ${profileName}`,
    "",
    "Startup enforcement:",
    "- Role assignment is already satisfied by startup context.",
    "- Required reading is already bundled below.",
    "- Do not re-run manual role prompts.",
    "- Do not perform broad directive/task rediscovery when directive/task is present in startup context.",
    "- Prefer scripted lifecycle commands (dc directive/task/runbook/meta/validate).",
    "",
    "## Startup Context",
    "",
    "```json",
    startupJson,
    "```",
    "",
    "## DC Command Reference",
    "",
    "```json",
    commandRefJson,
    "```",
    "",
    "## Role Bundle",
    "",
    bundleContent,
    "",
  ].join("\n");
  fs.mkdirSync(path.dirname(startupFilePath), { recursive: true });
  fs.writeFileSync(startupFilePath, `${content}\n`, "utf8");
}

async function runBootstrap(root, args) {
  const codexHome = resolveHomePath(args["codex-home"], path.join(os.homedir(), ".codex"));
  const configPath = path.join(codexHome, "config.toml");
  const role = await requireBundleRole(args);
  const profileName = await requireBootstrapProfile(args, configPath);
  const launchConfig = readDcConfig(root, args);
  const commandRefPath = writeDcCommandReference(root, args, role);
  const includePaths = Array.isArray(args.include) ? args.include.slice() : [];
  includePaths.push(relative(root, commandRefPath));

  const bundle = runBuild(root, { ...args, role, include: includePaths, json: false });
  let startupContextPath = String(args["__startup_context_path"] || "").trim();
  if (!startupContextPath) {
    startupContextPath = writeStartupContext(root, args, role, profileName, null, null, launchConfig);
  }
  const startupFilePath = startupInstructionsPathFromBundle(bundle.outPath);
  writeStartupInstructionsFile(startupFilePath, startupContextPath, commandRefPath, bundle.outPath, role, profileName);
  const startupPath = startupFilePath.replace(/\\/g, "/");

  const profileBlock = [
    `[profiles.${profileName}]`,
    `instructions_file = "${startupPath}"`,
    `repo_instructions_file = "${startupPath}"`,
    `dc_role = "${role}"`,
    `generated_by = "dc agent bootstrap"`,
  ].join("\n");

  upsertProfileBlock(configPath, profileName, profileBlock, Boolean(args["dry-run"]));

  output(args, {
    message: `${args["dry-run"] ? "Previewed" : "Updated"} codex profile '${profileName}' in ${configPath}`,
    status: "ok",
    role,
    profile: profileName,
    codex_home: codexHome,
    config_toml: configPath,
    startup_file: startupFilePath,
    startup_context_file: startupContextPath,
    command_reference_file: commandRefPath,
    bundle_file: bundle.outPath,
    policy_bundle_file: bundle.policyOutPath,
  });
}

function launchCodex(codexBin, profileName, selectedDirective, selectedTask, launchConfig, role, sessionLogPath, roleTransition) {
  const env = { ...process.env };
  if (role) env.DC_ROLE = String(role);
  if (sessionLogPath) env.DC_SESSION_LOG = String(sessionLogPath);
  if (roleTransition) env.DC_ROLE_TRANSITION = String(roleTransition);
  if (launchConfig && launchConfig.agent) env.DC_AGENT = launchConfig.agent;
  if (launchConfig && launchConfig.model) env.DC_MODEL = launchConfig.model;
  if (selectedDirective) {
    env.DC_DIRECTIVE_SESSION = selectedDirective.session;
    env.DC_DIRECTIVE_SLUG = selectedDirective.directive_slug;
  }
  if (selectedTask) {
    env.DC_TASK_SESSION = selectedTask.session;
    env.DC_TASK_SLUG = selectedTask.task_slug;
    env.DC_TASK_FILE = selectedTask.task_file;
  }
  const initialPrompt = buildInitialPrompt(selectedDirective, selectedTask, launchConfig, roleTransition);
  const codexArgs = ["--profile", profileName];
  if (initialPrompt) codexArgs.push(initialPrompt);
  const result = spawnSync(codexBin, codexArgs, {
    stdio: "inherit",
    env,
  });

  if (result.error) {
    if (result.error.code === "ENOENT") {
      throw new Error(`Codex executable not found: ${codexBin}`);
    }
    throw result.error;
  }

  if (typeof result.status === "number" && result.status !== 0) {
    process.exit(result.status);
  }
}

function buildInitialPrompt(selectedDirective, selectedTask, launchConfig, roleTransition) {
  const lines = [
    "Startup context is preselected by dc agent start. Use it as authoritative.",
    "Do not ask for role selection.",
  ];
  if (roleTransition) lines.push(`Role transition: ${roleTransition}`);
  if (launchConfig && launchConfig.model) lines.push(`Configured model: ${launchConfig.model}`);
  if (selectedDirective) {
    lines.push(
      `Selected directive session: ${selectedDirective.session}`,
      `Directive title: ${selectedDirective.title}`,
    );
  }
  if (selectedTask) {
    lines.push(`Selected task: ${selectedTask.task_slug}`);
  } else if (selectedDirective) {
    lines.push("No task selected yet.");
  }
  lines.push("First response must briefly confirm active role/directive/task context and run a discovery check with operator.");
  lines.push("Discovery check must include: intended outcome, constraints, definition of done, and whether execution should start now.");
  lines.push("Model gate: ask operator whether to keep current model or switch via /model before execution.");
  lines.push("Thinking gate: ask operator to confirm desired thinking depth before execution.");
  lines.push("Before running commands or editing files, ask the operator for explicit go-ahead and wait for approval.");
  lines.push("Do not execute any lifecycle command until operator confirms execution.");
  lines.push("Use repository lifecycle scripts for actions (dc directive/task/meta/runbook/validate) instead of ad-hoc commands.");
  return lines.join("\n");
}

function writeStartupContext(root, args, role, profileName, selectedDirective, selectedTask, launchConfig, roleTransition, sessionLogPath) {
  const { outPath } = resolveRolePaths(root, args, role || undefined);
  const startupPath = path.join(path.dirname(outPath), `${role || "all"}.startup.json`);
  const directiveTasks = selectedDirective ? listTasksForDirective(root, selectedDirective.session) : [];
  const taskSelectionState = selectedTask
    ? "selected"
    : selectedDirective
      ? (directiveTasks.length === 0 ? "none_available" : "available_unselected")
      : "not_requested";
  const nextActions = [];
  if (role === "architect" && selectedDirective && taskSelectionState === "none_available") {
    nextActions.push(
      `Create initial tasks in selected directive with 'dc directive task --session ${selectedDirective.session} --title ... --summary ...'`,
      "Populate task contract fields (objective, constraints, allowed_files, steps, validation) before handoff.",
    );
  }
  const doc = {
    kind: "dc_startup_context",
    schema_version: "1.0",
    generated_at: new Date().toISOString(),
    profile: profileName,
    role,
    directive: selectedDirective
      ? {
        session: selectedDirective.session,
        slug: selectedDirective.directive_slug,
        title: selectedDirective.title,
        status: selectedDirective.status,
      }
      : null,
    task: selectedTask
      ? {
        session: selectedTask.session,
        slug: selectedTask.task_slug,
        title: selectedTask.task_title,
        status: selectedTask.task_status,
        file: selectedTask.task_file,
      }
      : null,
    runtime: {
      agent: launchConfig.agent || "codex",
      model: launchConfig.model || null,
      session_log_file: sessionLogPath || null,
    },
    startup_rules: {
      role_assignment_already_satisfied: true,
      required_reading_already_in_bundle: true,
      skip_manual_role_prompt: true,
      skip_manual_directive_listing_when_directive_selected: Boolean(selectedDirective),
      skip_manual_task_listing_when_task_selected: Boolean(selectedTask),
      task_selection_state: taskSelectionState,
      prefer_scripted_lifecycle_commands: true,
      prohibit_command_guessing: true,
      require_help_lookup_on_command_ambiguity: true,
      require_operator_discovery_phase: true,
      require_operator_go_ahead_before_execution: true,
      require_model_gate: true,
      require_thinking_gate: true,
    },
    role_transition: roleTransition || "",
    operator_discovery: {
      required: true,
      checklist: [
        "Confirm intended outcome in operator words.",
        "Confirm hard constraints and excluded scope.",
        "Confirm definition of done and validation evidence expected.",
        "Ask whether to start execution now or refine plan first.",
      ],
      before_any_command: true,
    },
    model_thinking_gate: {
      required: true,
      checklist: [
        "Ask operator whether to keep or switch model.",
        "Ask operator to set/confirm thinking depth.",
        "Pause execution until operator confirms model/thinking state.",
      ],
    },
    next_actions: nextActions,
  };
  fs.mkdirSync(path.dirname(startupPath), { recursive: true });
  fs.writeFileSync(startupPath, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
  return startupPath;
}

async function runStart(root, args) {
  const codexHome = resolveHomePath(args["codex-home"], path.join(os.homedir(), ".codex"));
  const configPath = path.join(codexHome, "config.toml");
  const profileName = await requireBootstrapProfile(args, configPath);
  const role = await requireBundleRole(args);
  const launchConfig = readDcConfig(root, args);
  if (launchConfig.agent && launchConfig.agent !== "codex") {
    throw new Error(`Configured agent '${launchConfig.agent}' is not supported by 'dc agent start'. Run 'dc init --agent codex' or use an agent-specific start command.`);
  }
  const selectedDirective = await requireStartDirective(args, root);
  const directiveKey = selectedDirective ? selectedDirective.session : String(args.directive || args.session || "").trim();
  const selectedTask = await requireStartTask({ ...args, directive: directiveKey, session: directiveKey }, root);
  const directiveTasks = selectedDirective ? listTasksForDirective(root, selectedDirective.session) : [];
  const codexBin = String(args["codex-bin"] || "codex");
  const previousRole = readLastRole(codexHome);
  const roleTransition = previousRole && previousRole !== role
    ? `${previousRole} -> ${role}`
    : (previousRole === role ? `${role} (unchanged)` : `none -> ${role}`);
  const sessionLogPath = createLiveSessionLog(
    root,
    profileName,
    role,
    selectedDirective,
    selectedTask,
    args["session-log-dir"],
  );
  const startupContextPath = writeStartupContext(
    root,
    args,
    role,
    profileName,
    selectedDirective,
    selectedTask,
    launchConfig,
    roleTransition,
    sessionLogPath,
  );

  if (!args["no-bootstrap"]) {
    const includes = Array.isArray(args.include) ? args.include.slice() : [];
    includes.push(relative(root, startupContextPath));
    await runBootstrap(root, {
      ...args,
      role,
      profile: profileName,
      include: includes,
      "__startup_context_path": startupContextPath,
      json: false,
    });
  }

  output(args, {
    message: `Starting codex with profile '${profileName}'`,
    status: "ok",
    role,
    profile: profileName,
    selected_directive: selectedDirective ? selectedDirective.session : null,
    selected_task: selectedTask ? `${selectedTask.session}/${selectedTask.task_slug}` : null,
    agent: launchConfig.agent || "codex",
    model: launchConfig.model || null,
    codex_bin: codexBin,
    role_transition: roleTransition,
    session_log_file: sessionLogPath,
    observe_log_command: `tail -f ${sessionLogPath}`,
  });
  output(args, {
    message: `Observe live session log: tail -f ${sessionLogPath}`,
    status: "info",
    role,
    profile: profileName,
  });
  output(args, {
    message: `Role switch announcement: ${roleTransition}`,
    status: "info",
    role,
    profile: profileName,
  });
  output(args, {
    message: "Model/thinking gate: confirm desired model and thinking depth with operator before any execution.",
    status: "info",
    role,
    profile: profileName,
  });
  if (selectedDirective && !selectedTask && directiveTasks.length === 0 && role === "architect") {
    output(args, {
      message: `Selected directive '${selectedDirective.session}' has no tasks yet. Proceed with task authoring flow.`,
      status: "info",
      role,
      selected_directive: selectedDirective.session,
      next_step: "dc directive task --session <session> ...",
    });
  }

  writeLastRole(codexHome, role);
  if (args["dry-run"]) return;
  launchCodex(codexBin, profileName, selectedDirective, selectedTask, launchConfig, role, sessionLogPath, roleTransition);
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error.message}\n${usage()}\n`);
    process.exit(1);
  }

  if (args.help) {
    process.stdout.write(`${usage()}\n`);
    process.exit(0);
  }

  const cmd = args._ && args._[0] ? String(args._[0]) : "";
  if (!cmd) {
    process.stderr.write(`${usage()}\n`);
    process.exit(1);
  }

  const root = repoRoot();
  if (cmd === "build") return runBuild(root, args);
  if (cmd === "check") return runCheck(root, args);
  if (cmd === "show") return runShow(root, args);
  if (cmd === "bootstrap") return runBootstrap(root, args);
  if (cmd === "start") return runStart(root, args);

  process.stderr.write(`Unknown command: ${cmd}\n${usage()}\n`);
  process.exit(1);
}

Promise.resolve(main()).catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
