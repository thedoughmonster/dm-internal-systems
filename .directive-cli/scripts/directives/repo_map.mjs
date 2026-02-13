#!/usr/bin/env node

import path from "node:path";
import { getRepoRoot, getDirectivesRoot } from "./_session_resolver.mjs";

const root = getRepoRoot();

const rows = [
  ["Repo root", root],
  ["Directive CLI", path.join(root, ".directive-cli")],
  ["Directive scripts", path.join(root, ".directive-cli/scripts/directives")],
  ["Directive rules", path.join(root, ".directive-cli/docs/agent-rules")],
  ["Directive sessions", getDirectivesRoot()],
  ["Web app", path.join(root, "apps/web")],
  ["Root changelog", path.join(root, "changelog")],
  ["Web changelog", path.join(root, "apps/web/changelog")],
];

const width = Math.max(...rows.map((r) => r[0].length));
for (const [k, v] of rows) {
  process.stdout.write(`${k.padEnd(width)} : ${v}\n`);
}
