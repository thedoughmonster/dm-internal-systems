#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

function repoRoot() {
  const file = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(file), "../..");
}

function phasesPath(root) {
  return path.join(root, ".runbook", "phases.json");
}

function usage() {
  return [
    "Usage:",
    "  runbook",
    "  runbook --phase <phase-id>",
    "  runbook --help",
    "",
    "Notes:",
    "  Reads phases from .runbook/phases.json",
    "  In non-interactive mode, pass --phase <phase-id>",
  ].join("\n");
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      args._.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

function loadPhases(root) {
  const p = phasesPath(root);
  if (!fs.existsSync(p)) throw new Error(`Missing phase file: ${p}`);
  const doc = JSON.parse(fs.readFileSync(p, "utf8"));
  const rows = Array.isArray(doc.phases) ? doc.phases : [];
  const phases = rows
    .map((row) => ({
      id: String(row && row.id ? row.id : "").trim(),
      subphases: Array.isArray(row && row.subphases) ? row.subphases.map((s) => String(s).trim()).filter(Boolean) : [],
    }))
    .filter((row) => row.id);
  if (phases.length === 0) throw new Error("No phases configured in .runbook/phases.json");
  return phases;
}

async function selectPhaseInteractive(phases) {
  const lines = ["Select runbook phase:"];
  for (let i = 0; i < phases.length; i += 1) {
    const phase = phases[i];
    const sub = phase.subphases.length ? ` [${phase.subphases.join(", ")}]` : "";
    lines.push(`  ${i + 1}) ${phase.id}${sub}`);
  }
  stdout.write(`${lines.join("\n")}\n`);
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    while (true) {
      const raw = String(await rl.question("Select phase number: ")).trim();
      const n = Number(raw);
      if (Number.isInteger(n) && n >= 1 && n <= phases.length) return phases[n - 1].id;
    }
  } finally {
    rl.close();
  }
}

async function main() {
  const root = repoRoot();
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) {
    stdout.write(`${usage()}\n`);
    return;
  }

  const phases = loadPhases(root);
  let selected = String(args.phase || "").trim();
  if (!selected) {
    if (!(stdin.isTTY && stdout.isTTY)) {
      throw new Error("Non-interactive mode requires --phase <phase-id>.");
    }
    selected = await selectPhaseInteractive(phases);
  }

  const found = phases.find((p) => p.id === selected);
  if (!found) {
    throw new Error(`Unknown phase '${selected}'.`);
  }

  const payload = {
    kind: "runbook_phase_selection",
    phase: found.id,
    subphases: found.subphases,
  };
  stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

try {
  await main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
