#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import {
  getDirectivesRoot,
  resolveSessionDir,
  assertInside,
} from "./_session_resolver.mjs";

function toUtcIso() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isSafeSlug(value) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(value || ""));
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
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
    "  node ops_tooling/scripts/directives/create_directive_task.mjs --session <session-dir-or-uuid> [options]",
    "",
    "Required:",
    "  --session <id>                  Session directory name or session UUID (meta.id)",
    "  --guid <id>                     Legacy alias for --session",
    "",
    "Options:",
    "  --slug <slug>                   Task slug used in filename <slug>.task.json",
    "  --title <text>                  Task title (default: prompted)",
    "  --summary <text>                One-line summary (default: prompted)",
    "  --priority <level>              urgent|high|medium|low (default: medium)",
    "  --session-priority <level>      urgent|high|medium|low (default: medium)",
    "  --owner <name>                  Metadata owner (default: operator)",
    "  --assignee <name>               Metadata assignee (default: executor)",
    "  --effort <size>                 small|medium|large (default: medium)",
    "  --execution-model <name>        Metadata execution_model (default: gpt-5.2-codex)",
    "  --thinking-level <level>        Metadata thinking_level (default: high)",
    "  --no-prompt                     Disable interactive prompts for missing values",
    "  --dry-run                       Print target path and JSON only",
    "  --help                          Show this help",
  ].join("\n");
}

async function resolveInput(args) {
  let session = args.session ? String(args.session).trim() : "";
  if (!session && args.guid) session = String(args.guid).trim();
  let title = args.title ? String(args.title).trim() : "";
  let summary = args.summary ? String(args.summary).trim() : "";

  if (!args["no-prompt"] && stdin.isTTY && (!session || !title || !summary)) {
    const rl = createInterface({ input: stdin, output: stdout });
    if (!session) session = (await rl.question("Session (dir name or UUID): ")).trim();
    if (!title) title = (await rl.question("Task title: ")).trim();
    if (!summary) summary = (await rl.question("Task summary (one line): ")).trim();
    rl.close();
  }

  return {
    session,
    title: title || "new task",
    summary: summary || "Define and execute the next verified task scope.",
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(`${usage()}\n`);
    process.exit(0);
  }

  const input = await resolveInput(args);
  if (!input.session) {
    process.stderr.write(`Missing required --session\n${usage()}\n`);
    process.exit(1);
  }

  const taskSlug = String(args.slug || slugify(input.title) || "new-task").trim();
  if (!isSafeSlug(taskSlug)) {
    process.stderr.write(`Invalid task slug '${taskSlug}'. Use lowercase letters, numbers, and single hyphens only.\n`);
    process.exit(1);
  }

  let sessionDir;
  try {
    sessionDir = resolveSessionDir(input.session);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }

  const directivesRoot = getDirectivesRoot();
  const taskPath = path.join(sessionDir, `${taskSlug}.task.json`);
  try {
    assertInside(directivesRoot, sessionDir);
    assertInside(sessionDir, taskPath);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }

  const now = toUtcIso();
  const doc = {
    kind: "directive_task",
    schema_version: "1.0",
    meta: {
      id: randomUUID(),
      title: input.title,
      status: "todo",
      priority: String(args.priority || "medium"),
      session_priority: String(args["session-priority"] || "medium"),
      owner: String(args.owner || "operator"),
      assignee: String(args.assignee || "executor"),
      bucket: "todo",
      created: now,
      updated: now,
      tags: [],
      effort: String(args.effort || "medium"),
      depends_on: [],
      blocked_by: [],
      related: [],
      summary: input.summary,
      execution_model: String(args["execution-model"] || "gpt-5.2-codex"),
      thinking_level: String(args["thinking-level"] || "high"),
    },
    task: {
      objective: "Define the concrete outcome this task must produce.",
      constraints: ["Keep scope deterministic and drift resistant."],
      allowed_files: [
        {
          path: "apps/web/...",
          access: "edit",
          note: "Replace with exact allowed paths before execution.",
        },
      ],
      steps: [
        {
          id: "step_1",
          instruction: "Define exact file-level actions with completion artifacts.",
          files: ["apps/web/..."],
          artifact: "Concrete output produced and verifiable.",
        },
      ],
      validation: {
        commands: ["# Add exact validation commands here"],
      },
      expected_output: ["State measurable completion evidence."],
      stop_conditions: ["Stop and ask operator when blocked by missing scope or failing unrelated validations."],
      notes: [],
    },
  };

  if (args["dry-run"]) {
    process.stdout.write(`[dry-run] task: ${taskPath}\n\n`);
    process.stdout.write(`${JSON.stringify(doc, null, 2)}\n`);
    process.exit(0);
  }

  if (fs.existsSync(taskPath)) {
    process.stderr.write(`Refusing to overwrite existing task file: ${taskPath}\n`);
    process.exit(1);
  }

  fs.writeFileSync(taskPath, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
  process.stdout.write(`Created ${taskPath}\n`);
}

main();
