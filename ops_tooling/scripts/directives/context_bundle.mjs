#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

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
    "  node ops_tooling/scripts/directives/context_bundle.mjs <build|check|show> [options]",
    "",
    "Options:",
    "  --out <path>            Output compiled context path (default: .codex/context/compiled.md)",
    "  --meta <path>           Output metadata path (default: .codex/context/compiled.meta.json)",
    "  --include <path>        Additional file to include (repeatable, repo-relative)",
    "  --print                 With show, print compiled content",
    "  --json                  Emit JSON summary",
    "  --help                  Show this help",
  ].join("\n");
}

function resolvePath(root, input, fallback) {
  const raw = String(input || fallback);
  return path.resolve(root, raw);
}

function existsFile(filePath) {
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

function listMarkdownFiles(rootDir) {
  if (!fs.existsSync(rootDir)) return [];
  return fs
    .readdirSync(rootDir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith(".md"))
    .map((d) => path.join(rootDir, d.name))
    .sort();
}

function defaultSourceFiles(root) {
  const files = [];
  const push = (rel) => {
    const p = path.join(root, rel);
    if (existsFile(p)) files.push(p);
  };

  push("AGENTS.md");
  push("apps/web/docs/guides/component-paradigm.md");

  for (const role of ["shared", "architect", "executor", "pair", "auditor"]) {
    const roleDir = path.join(root, "docs", "agent-rules", role);
    files.push(...listMarkdownFiles(roleDir));
  }

  return Array.from(new Set(files));
}

function loadSources(root, includes) {
  const files = defaultSourceFiles(root);
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

    sections.push([
      `## Source: ${rel}`,
      "",
      "```markdown",
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

function writeBundle(outPath, metaPath, payload) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.mkdirSync(path.dirname(metaPath), { recursive: true });
  fs.writeFileSync(outPath, payload.compiled, "utf8");
  fs.writeFileSync(metaPath, `${JSON.stringify(payload.meta, null, 2)}\n`, "utf8");
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

function runBuild(root, args) {
  const outPath = resolvePath(root, args.out, ".codex/context/compiled.md");
  const metaPath = resolvePath(root, args.meta, ".codex/context/compiled.meta.json");
  const sources = loadSources(root, args.include);
  const { compiled, digest } = compileBundle(root, sources);

  const meta = {
    bundle_kind: "codex_context_bundle",
    schema_version: "1.0",
    generated_at: new Date().toISOString(),
    repo_root: root,
    out_file: outPath,
    hash: digest,
    sources: sources.map((s) => relative(root, s)),
  };

  writeBundle(outPath, metaPath, { compiled, meta });

  output(args, {
    message: `Built context bundle: ${outPath}`,
    out_file: outPath,
    meta_file: metaPath,
    hash: digest,
    sources: meta.sources,
  });
}

function runCheck(root, args) {
  const outPath = resolvePath(root, args.out, ".codex/context/compiled.md");
  const metaPath = resolvePath(root, args.meta, ".codex/context/compiled.meta.json");
  const meta = readMeta(metaPath);

  if (!existsFile(outPath) || !meta || !Array.isArray(meta.sources)) {
    output(args, {
      message: "Context bundle is missing or metadata invalid",
      status: "missing",
      out_file: outPath,
      meta_file: metaPath,
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
  const upToDate = digest === String(meta.hash || "");

  output(args, {
    message: upToDate ? "Context bundle is up to date" : "Context bundle is stale",
    status: upToDate ? "ok" : "stale",
    out_file: outPath,
    meta_file: metaPath,
    hash: digest,
  });

  if (!upToDate) process.exit(1);
}

function runShow(root, args) {
  const outPath = resolvePath(root, args.out, ".codex/context/compiled.md");
  const metaPath = resolvePath(root, args.meta, ".codex/context/compiled.meta.json");

  if (!existsFile(outPath)) throw new Error(`Context bundle not found: ${outPath}`);

  if (args.print) {
    process.stdout.write(fs.readFileSync(outPath, "utf8"));
    return;
  }

  const meta = readMeta(metaPath);
  output(args, {
    message: `Context bundle: ${outPath}`,
    out_file: outPath,
    meta_file: metaPath,
    hash: meta ? meta.hash : null,
    source_count: meta && Array.isArray(meta.sources) ? meta.sources.length : null,
  });
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

  process.stderr.write(`Unknown command: ${cmd}\n${usage()}\n`);
  process.exit(1);
}

main();
