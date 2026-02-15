#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { selectOption } from "./_prompt_helpers.mjs";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const t = argv[i];
    if (!t.startsWith("--")) continue;
    const k = t.slice(2);
    const n = argv[i + 1];
    if (!n || n.startsWith("--")) args[k] = true;
    else {
      args[k] = n;
      i += 1;
    }
  }
  return args;
}

function usage() {
  return [
    "Usage:",
    "  node .directive-cli/scripts/directives/codex_usage.mjs [options]",
    "",
    "Options:",
    "  --hours <n>            Window size in hours (default: 24)",
    "  --since <iso|epoch>    Window start (overrides --hours)",
    "  --until <iso|epoch>    Window end (default: now)",
    "  --top <n>              Number of sessions to show (default: 10)",
    "  --log-file <path>      Override codex log path",
    "  --json                 Emit JSON output",
    "  --help                 Show this help",
  ].join("\n");
}

function parseTime(raw, flagName) {
  const value = String(raw || "").trim();
  if (!value) return NaN;
  if (/^\d+$/.test(value)) return Number(value);
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) {
    throw new Error(`Invalid ${flagName} value: '${value}'`);
  }
  return Math.floor(ms / 1000);
}

function fmt(n) {
  return new Intl.NumberFormat("en-US").format(n);
}

function parseLogLine(line) {
  const row = String(line || "");
  if (!row.includes("post sampling token usage")) return null;
  const tsMatch = row.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)/);
  const threadMatch = row.match(/thread_id=([a-z0-9-]+)/i);
  const totalMatch = row.match(/total_usage_tokens=(\d+)/);
  const estimatedMatch = row.match(/estimated_token_count=Some\((\d+)\)/);
  if (!tsMatch || !threadMatch || !totalMatch) return null;
  const ts = Math.floor(Date.parse(tsMatch[1]) / 1000);
  if (!Number.isFinite(ts)) return null;
  return {
    ts,
    threadId: threadMatch[1],
    totalUsageTokens: Number(totalMatch[1]),
    estimatedTokenCount: estimatedMatch ? Number(estimatedMatch[1]) : null,
  };
}

function computeWindowDelta(points, sinceTs, untilTs) {
  const inWindow = points.filter((p) => p.ts >= sinceTs && p.ts <= untilTs);
  if (inWindow.length === 0) return null;

  let baseline = null;
  for (let i = points.length - 1; i >= 0; i -= 1) {
    if (points[i].ts <= sinceTs) {
      baseline = points[i];
      break;
    }
  }
  const end = inWindow[inWindow.length - 1];
  const start = baseline || inWindow[0];
  const delta = Math.max(0, end.totalUsageTokens - start.totalUsageTokens);
  const estDelta = (end.estimatedTokenCount != null && start.estimatedTokenCount != null)
    ? Math.max(0, end.estimatedTokenCount - start.estimatedTokenCount)
    : null;
  return {
    delta,
    estimatedDelta: estDelta,
    startTs: start.ts,
    endTs: end.ts,
    pointsInWindow: inWindow.length,
  };
}

async function promptCustomWindow() {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const since = String(await rl.question("Since (ISO or epoch, required): ")).trim();
    if (!since) throw new Error("Custom range requires a --since value.");
    const until = String(await rl.question("Until (ISO or epoch, blank=now): ")).trim();
    return { since, until: until || undefined };
  } finally {
    rl.close();
  }
}

async function maybePromptWindow(args) {
  const hasWindowArg = Boolean(args.hours || args.since || args.until);
  if (hasWindowArg) return;
  if (!(stdin.isTTY && stdout.isTTY)) return;

  const choice = await selectOption({
    input: stdin,
    output: stdout,
    label: "Select usage time window:",
    options: [
      { label: "Last 1 hour", value: "1" },
      { label: "Last 24 hours", value: "24" },
      { label: "Last 7 days", value: "168" },
      { label: "Last 30 days", value: "720" },
      { label: "Custom since/until", value: "custom" },
    ],
    defaultIndex: 1,
  });

  if (choice === "custom") {
    const custom = await promptCustomWindow();
    args.since = custom.since;
    if (custom.until) args.until = custom.until;
    return;
  }
  args.hours = choice;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(`${usage()}\n`);
    process.exit(0);
  }

  await maybePromptWindow(args);

  const defaultLog = path.join(os.homedir(), ".codex", "log", "codex-tui.log");
  const logFile = String(args["log-file"] || defaultLog).trim();
  if (!fs.existsSync(logFile)) {
    throw new Error(`Codex log file not found: ${logFile}`);
  }

  const untilTs = args.until ? parseTime(args.until, "--until") : Math.floor(Date.now() / 1000);
  if (!Number.isFinite(untilTs)) throw new Error("Invalid --until");
  let sinceTs;
  if (args.since) {
    sinceTs = parseTime(args.since, "--since");
    if (!Number.isFinite(sinceTs)) throw new Error("Invalid --since");
  } else {
    const hours = args.hours ? Number(args.hours) : 24;
    if (!Number.isFinite(hours) || hours <= 0) throw new Error("Invalid --hours (must be > 0)");
    sinceTs = untilTs - Math.floor(hours * 3600);
  }
  if (sinceTs > untilTs) throw new Error("--since must be before --until");

  const topN = args.top ? Number(args.top) : 10;
  if (!Number.isInteger(topN) || topN <= 0) throw new Error("Invalid --top (must be integer > 0)");

  const rows = fs
    .readFileSync(logFile, "utf8")
    .split("\n")
    .map(parseLogLine)
    .filter(Boolean);

  const byThread = new Map();
  for (const row of rows) {
    const list = byThread.get(row.threadId) || [];
    list.push(row);
    byThread.set(row.threadId, list);
  }
  for (const list of byThread.values()) {
    list.sort((a, b) => a.ts - b.ts);
  }

  const sessions = [];
  for (const [threadId, points] of byThread.entries()) {
    const delta = computeWindowDelta(points, sinceTs, untilTs);
    if (!delta) continue;
    sessions.push({
      thread_id: threadId,
      usage_tokens: delta.delta,
      estimated_tokens: delta.estimatedDelta,
      start_ts: delta.startTs,
      end_ts: delta.endTs,
      points_in_window: delta.pointsInWindow,
    });
  }
  sessions.sort((a, b) => b.usage_tokens - a.usage_tokens);
  const limited = sessions.slice(0, topN);
  const totalUsage = sessions.reduce((sum, s) => sum + s.usage_tokens, 0);
  const totalEstimated = sessions.reduce((sum, s) => sum + (s.estimated_tokens || 0), 0);
  const hasEstimated = sessions.some((s) => s.estimated_tokens != null);

  const result = {
    kind: "codex_usage_window",
    schema_version: "1.0",
    log_file: logFile,
    since_ts: sinceTs,
    until_ts: untilTs,
    since_iso: new Date(sinceTs * 1000).toISOString(),
    until_iso: new Date(untilTs * 1000).toISOString(),
    session_count: sessions.length,
    total_usage_tokens: totalUsage,
    total_estimated_tokens: hasEstimated ? totalEstimated : null,
    top: limited,
  };

  if (args.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  process.stdout.write(`Window: ${result.since_iso} -> ${result.until_iso}\n`);
  process.stdout.write(`Log file: ${result.log_file}\n`);
  process.stdout.write(`Sessions observed: ${fmt(result.session_count)}\n`);
  process.stdout.write(`Total usage tokens: ${fmt(result.total_usage_tokens)}\n`);
  if (result.total_estimated_tokens != null) {
    process.stdout.write(`Total estimated tokens: ${fmt(result.total_estimated_tokens)}\n`);
  }
  process.stdout.write("\nTop sessions by usage:\n");
  if (limited.length === 0) {
    process.stdout.write("  (no usage records in this window)\n");
    return;
  }
  for (const item of limited) {
    const est = item.estimated_tokens != null ? ` est=${fmt(item.estimated_tokens)}` : "";
    process.stdout.write(
      `  - ${item.thread_id} usage=${fmt(item.usage_tokens)}${est} points=${item.points_in_window}\n`,
    );
  }
}

try {
  await main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.stderr.write(`${usage()}\n`);
  process.exit(1);
}
