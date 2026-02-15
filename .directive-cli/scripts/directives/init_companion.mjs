#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { selectOption } from "./_prompt_helpers.mjs";

const KNOWN_AGENTS = ["codex", "claude-code", "aider", "custom"];
const ROLES = ["architect", "executor", "pair", "auditor"];

function repoRoot() {
  const scriptFile = fileURLToPath(import.meta.url);
  const scriptDir = path.dirname(scriptFile);
  return path.resolve(scriptDir, "../../..");
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      if (!args._) args._ = [];
      args._.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    i += 1;
  }
  return args;
}

function usage() {
  return [
    "Usage:",
    "  dc init [options]",
    "",
    "Options:",
    "  --agent <name>         Agent runtime (codex|claude-code|aider|custom)",
    "  --model <name>         Default model name",
    "  --home-default <path>  Default codex home for all roles (optional)",
    "  --home-architect <p>   Role-specific codex home override (optional)",
    "  --home-executor <p>    Role-specific codex home override (optional)",
    "  --home-pair <p>        Role-specific codex home override (optional)",
    "  --home-auditor <p>     Role-specific codex home override (optional)",
    "  --config <path>        Config file path (default: .codex/dc.config.json)",
    "  --no-prompt            Fail instead of prompting for missing values",
    "  --json                 Emit JSON output",
    "  --help                 Show this help",
  ].join("\n");
}

function sanitizeAgent(value) {
  return String(value || "").trim().toLowerCase();
}

function sanitizeModel(value) {
  return String(value || "").trim();
}

function output(args, payload) {
  if (args.json) {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return;
  }
  process.stdout.write(`${payload.message}\n`);
}

async function resolveAgent(args) {
  const explicit = sanitizeAgent(args.agent);
  if (explicit) return explicit;
  if (args["no-prompt"] || !stdin.isTTY) throw new Error("Missing required --agent");
  return await selectOption({
    input: stdin,
    output: stdout,
    label: "Select agent:",
    options: KNOWN_AGENTS.map((a) => ({ label: a, value: a })),
    defaultIndex: 0,
  });
}

async function resolveModel(args) {
  const explicit = sanitizeModel(args.model);
  if (explicit) return explicit;
  if (args["no-prompt"] || !stdin.isTTY) throw new Error("Missing required --model");

  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const input = (await rl.question("Model name (required): ")).trim();
    if (!input) throw new Error("Missing required model name.");
    return input;
  } finally {
    rl.close();
  }
}

function resolveConfigPath(root, args) {
  return path.resolve(root, String(args.config || ".codex/dc.config.json"));
}

function collectRoleHomes(args) {
  const homes = {};
  const defaultHome = String(args["home-default"] || "").trim();
  if (defaultHome) homes.default = defaultHome;
  for (const role of ROLES) {
    const key = `home-${role}`;
    const value = String(args[key] || "").trim();
    if (value) homes[role] = value;
  }
  return homes;
}

function main() {
  return Promise.resolve().then(async () => {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
      process.stdout.write(`${usage()}\n`);
      return;
    }

    const root = repoRoot();
    const agent = await resolveAgent(args);
    const model = await resolveModel(args);
    const configPath = resolveConfigPath(root, args);

    const config = {
      schema_version: "1.0",
      updated_at: new Date().toISOString(),
      agent: {
        name: agent,
      },
      model: {
        name: model,
      },
    };
    const homes = collectRoleHomes(args);
    if (Object.keys(homes).length > 0) {
      config.homes = homes;
    }

    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");

    output(args, {
      message: `Initialized dc config at ${configPath}`,
      config_file: configPath,
      agent,
      model,
      homes: Object.keys(homes).length > 0 ? homes : null,
    });
  });
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
