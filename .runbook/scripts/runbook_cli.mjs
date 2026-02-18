#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stdin, stdout } from "node:process";
import { spawnSync } from "node:child_process";
import { printList, selectFromList, toPhaseOptions } from "./_list_component.mjs";

function repoRoot() {
  const file = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(file), "../..");
}

function phasesPath(root) {
  return path.join(root, ".runbook", "phases.json");
}

function phaseInstructionPath(root, phaseId) {
  return path.join(root, ".runbook", "instructions", `${phaseId}.md`);
}

function usage() {
  return [
    "Usage:",
    "  runbook",
    "  runbook --phase <phase-id>",
    "  runbook --phase <phase-id> --dry-run",
    "  runbook --help",
    "",
    "Notes:",
    "  Reads phases from .runbook/phases.json",
    "  In non-interactive mode, pass --phase <phase-id>",
  ].join("\n");
}

function loadPhasePrompt(root, phaseId) {
  const p = phaseInstructionPath(root, phaseId);
  if (!fs.existsSync(p)) {
    throw new Error(`Missing runbook phase instruction file: ${p}`);
  }
  const body = fs.readFileSync(p, "utf8").trim();
  return [
    `Runbook phase: ${phaseId}`,
    "Use this as authoritative guidance for this session:",
    "",
    body,
  ].join("\n");
}

function launchCodexForPhase(root, phase, { dryRun = false } = {}) {
  if (phase !== "architect-discovery") return false;
  const prompt = loadPhasePrompt(root, phase);
  const args = [prompt];
  if (dryRun) {
    stdout.write(`[RUNBOOK] dry-run launch: codex <architect-discovery prompt>\n`);
    return true;
  }
  if (!(stdin.isTTY && stdout.isTTY)) {
    throw new Error("Cannot launch interactive codex from non-interactive shell.");
  }
  const result = spawnSync("codex", args, {
    stdio: "inherit",
    env: process.env,
  });
  if (result.error) throw result.error;
  if (typeof result.status === "number" && result.status !== 0) process.exit(result.status);
  return true;
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
  return selectFromList({
    input: stdin,
    output: stdout,
    title: "Select runbook phase:",
    options: toPhaseOptions(phases),
    defaultIndex: 0,
  });
}

function printPhaseList(phases) {
  printList({
    title: "Runbook phases:",
    options: toPhaseOptions(phases),
    output: stdout,
  });
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
    printPhaseList(phases);
    if (!(stdin.isTTY && stdout.isTTY)) return;
    selected = await selectPhaseInteractive(phases);
  }

  const found = phases.find((p) => p.id === selected);
  if (!found) {
    throw new Error(`Unknown phase '${selected}'.`);
  }

  if (launchCodexForPhase(root, found.id, { dryRun: Boolean(args["dry-run"]) })) {
    return;
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
