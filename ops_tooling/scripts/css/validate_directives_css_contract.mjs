#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const repoRoot = cwd.endsWith(`${path.sep}apps${path.sep}web`) ? path.resolve(cwd, "..", "..") : cwd;
const webRoot = path.join(repoRoot, "apps", "web");
const directivesRoot = path.join(webRoot, "app", "directives");

const COLOR_PROPS = new Set([
  "color",
  "background",
  "background-color",
  "border-color",
  "outline-color",
  "fill",
  "stroke",
  "border",
  "border-top",
  "border-right",
  "border-bottom",
  "border-left",
  "box-shadow",
  "text-shadow",
]);

const SPACING_PROPS = new Set([
  "margin",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "margin-inline",
  "margin-inline-start",
  "margin-inline-end",
  "margin-block",
  "margin-block-start",
  "margin-block-end",
  "padding",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "padding-inline",
  "padding-inline-start",
  "padding-inline-end",
  "padding-block",
  "padding-block-start",
  "padding-block-end",
  "gap",
  "row-gap",
  "column-gap",
  "inset",
  "inset-inline",
  "inset-inline-start",
  "inset-inline-end",
  "inset-block",
  "inset-block-start",
  "inset-block-end",
  "top",
  "right",
  "bottom",
  "left",
]);

const RADIUS_PROPS = new Set([
  "border-radius",
  "border-top-left-radius",
  "border-top-right-radius",
  "border-bottom-left-radius",
  "border-bottom-right-radius",
]);

const SHADOW_PROPS = new Set(["box-shadow", "text-shadow"]);

const ALLOW_LITERALS = new Set([
  "0",
  "0px",
  "none",
  "auto",
  "inherit",
  "initial",
  "unset",
  "transparent",
  "currentColor",
  "currentcolor",
]);

const violations = [];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (entry.isFile() && full.endsWith(".module.css")) {
      out.push(full);
    }
  }
  return out;
}

function needsToken(prop) {
  return (
    COLOR_PROPS.has(prop) ||
    SPACING_PROPS.has(prop) ||
    RADIUS_PROPS.has(prop) ||
    SHADOW_PROPS.has(prop)
  );
}

function isAllowedLiteral(value) {
  return ALLOW_LITERALS.has(value.trim());
}

function validateFile(filePath) {
  const rel = path.relative(webRoot, filePath);
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (line.includes(":global(")) {
      const prev = i > 0 ? lines[i - 1].trim() : "";
      const inlineJustified = /\/\*.*justif.*global.*\*\//i.test(line);
      const prevJustified = /^\/\*/.test(prev) && /justif.*global/i.test(prev);
      if (!inlineJustified && !prevJustified) {
        violations.push(`${rel}:${i + 1} :global(...) requires adjacent justification comment.`);
      }

      const match = line.match(/:global\(([^)]+)\)/);
      if (match) {
        const selector = match[1];
        if (/[\s,>+~]/.test(selector)) {
          violations.push(`${rel}:${i + 1} :global(...) selector must be minimal (no combinators/lists).`);
        }
      }
    }

    const decl = line.match(/^\s*([a-z-]+)\s*:\s*([^;]+);\s*$/i);
    if (!decl) {
      continue;
    }

    const prop = decl[1].toLowerCase();
    const value = decl[2].trim();

    if (!needsToken(prop)) {
      continue;
    }

    if (value.includes("var(--")) {
      continue;
    }

    if (isAllowedLiteral(value)) {
      continue;
    }

    violations.push(`${rel}:${i + 1} ${prop} must use tokenized value via var(--dm-*), found: ${value}`);
  }
}

function run() {
  const files = walk(directivesRoot);
  files.forEach(validateFile);

  if (violations.length > 0) {
    console.error("Directives CSS contract validation failed:\n");
    violations.forEach((item) => console.error(`- ${item}`));
    process.exit(1);
  }

  console.log("Directives CSS contract validation passed.");
}

run();
