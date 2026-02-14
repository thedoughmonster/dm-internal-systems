#!/usr/bin/env node

import path from "node:path";
import { getDirectivesRoot } from "./_session_resolver.mjs";
import { listDirectiveSessions, directiveDisplayRecord } from "./_directive_listing.mjs";

function parseArgs(argv) {
  const args = { field: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (key === "field") {
      if (!next || next.startsWith("--")) throw new Error("Missing value for --field");
      args.field.push(next);
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
    "  node .directive-cli/scripts/directives/list_directives.mjs [--compact|--detailed|--detailed-ultra] [--field <meta_key> ...] [--include-archived] [--json]",
  ].join("\n");
}

function normalizeMode(args) {
  if (args["detailed-ultra"]) return "detailed-ultra";
  if (args.detailed) return "detailed";
  return "compact";
}

function printTable(rows, mode) {
  if (rows.length === 0) {
    process.stdout.write("No directives found.\n");
    return;
  }
  const keys = Object.keys(rows[0]);
  process.stdout.write(`mode=${mode}\n`);
  for (const row of rows) {
    const parts = [];
    for (const k of keys) {
      if (k === "session") continue;
      parts.push(`${k}=${row[k]}`);
    }
    process.stdout.write(`${parts.join(" | ")}\n`);
  }
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

  const directivesRoot = getDirectivesRoot();
  const directives = listDirectiveSessions(directivesRoot, { includeArchived: Boolean(args["include-archived"]) });
  const mode = normalizeMode(args);
  const fields = Array.isArray(args.field) ? args.field : [];
  const rows = directives.map((d) => directiveDisplayRecord(d, { mode, fields }));

  if (args.json) {
    process.stdout.write(`${JSON.stringify({
      directives_root: path.relative(process.cwd(), directivesRoot).replace(/\\/g, "/"),
      count: rows.length,
      mode,
      fields,
      rows,
    }, null, 2)}\n`);
    return;
  }

  printTable(rows, mode);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
