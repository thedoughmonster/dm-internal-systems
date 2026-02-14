#!/usr/bin/env node

import path from "node:path";
import { stdin, stdout } from "node:process";
import { getDirectivesRoot } from "./_session_resolver.mjs";
import { listDirectiveSessions, directiveDisplayRecord } from "./_directive_listing.mjs";
import { selectOption, selectMultiOption } from "./_prompt_helpers.mjs";

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
    "  node .directive-cli/scripts/directives/list_directives.mjs [--compact|--detailed|--detailed-ultra] [--field <meta_key> ...] [--include-archived] [--json] [--interactive]",
  ].join("\n");
}

function normalizeMode(args) {
  if (args["detailed-ultra"]) return "detailed-ultra";
  if (args.detailed) return "detailed";
  return "compact";
}

function explicitMode(args) {
  return Boolean(args["detailed-ultra"] || args.detailed || args.compact);
}

function uniqueSorted(values) {
  return Array.from(new Set((values || []).map((v) => String(v || "").trim()).filter(Boolean))).sort();
}

function inferFieldChoices(directives) {
  const common = [
    "priority",
    "session_priority",
    "owner",
    "assignee",
    "bucket",
    "directive_branch",
    "directive_base_branch",
    "commit_policy",
    "summary",
    "tags",
    "effort",
  ];
  const discovered = new Set(common);
  for (const d of directives) {
    const meta = d && d.meta && typeof d.meta === "object" ? d.meta : {};
    for (const key of Object.keys(meta)) discovered.add(key);
  }
  return Array.from(discovered).sort();
}

async function resolveInteractiveDisplay(directives) {
  const mode = await selectOption({
    input: stdin,
    output: stdout,
    label: "Select list mode:",
    options: [
      { label: "compact (status + title)", value: "compact" },
      { label: "detailed (status + title + created/updated)", value: "detailed" },
      { label: "detailed-ultra (wide metadata)", value: "detailed-ultra" },
      { label: "custom fields", value: "custom" },
    ],
    defaultIndex: 0,
  });

  const choices = inferFieldChoices(directives);
  if (mode === "custom") {
    const fields = await selectMultiOption({
      input: stdin,
      output: stdout,
      label: "Select custom fields:",
      options: choices.map((f) => ({ label: f, value: f })),
      defaultSelectedValues: [],
    });
    return { mode: "compact", fields: uniqueSorted(fields) };
  }

  const addExtra = await selectOption({
    input: stdin,
    output: stdout,
    label: "Add extra custom fields?",
    options: [
      { label: "No", value: "no" },
      { label: "Yes", value: "yes" },
    ],
    defaultIndex: 0,
  });
  if (addExtra !== "yes") return { mode, fields: [] };

  const fields = await selectMultiOption({
    input: stdin,
    output: stdout,
    label: "Select extra fields:",
    options: choices.map((f) => ({ label: f, value: f })),
    defaultSelectedValues: [],
  });
  return { mode, fields: uniqueSorted(fields) };
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

  return Promise.resolve().then(async () => {
    const directivesRoot = getDirectivesRoot();
    const directives = listDirectiveSessions(directivesRoot, { includeArchived: Boolean(args["include-archived"]) });
    let mode = normalizeMode(args);
    let fields = uniqueSorted(Array.isArray(args.field) ? args.field : []);

    const shouldPromptDisplay = Boolean(args.interactive || (stdin.isTTY && !args.json && !explicitMode(args) && fields.length === 0));
    if (shouldPromptDisplay) {
      const selected = await resolveInteractiveDisplay(directives);
      mode = selected.mode;
      fields = selected.fields;
    }
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

    if (fields.length > 0 || explicitMode(args)) {
      const modeFlag = mode === "compact" ? "--compact" : mode === "detailed" ? "--detailed" : "--detailed-ultra";
      const fieldFlags = fields.map((f) => `--field ${f}`).join(" ");
      const composed = `dc directive list ${modeFlag}${fieldFlags ? ` ${fieldFlags}` : ""}`.trim();
      process.stdout.write(`command=${composed}\n`);
    }
    printTable(rows, mode);
  });
}

try {
  await main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
