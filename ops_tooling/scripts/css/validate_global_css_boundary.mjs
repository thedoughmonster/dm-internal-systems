#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const repoRoot = cwd.endsWith(`${path.sep}apps${path.sep}web`) ? path.resolve(cwd, "..", "..") : cwd;
const webRoot = path.join(repoRoot, "apps", "web");
const globalsPath = path.join(webRoot, "app", "globals.css");
const stylesDir = path.join(webRoot, "app", "styles");

const violations = [];

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function checkGlobals() {
  const raw = read(globalsPath);
  const lines = raw.split(/\r?\n/);

  let seenNonImport = false;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line || line.startsWith("/*") || line.startsWith("*")) {
      continue;
    }
    if (line.startsWith("@import")) {
      if (seenNonImport) {
        violations.push(`${globalsPath}:${i + 1} @import must appear before non-import rules.`);
      }
      continue;
    }

    if (!line.startsWith("@tailwind") && !line.startsWith("@charset")) {
      violations.push(`${globalsPath}:${i + 1} globals.css must contain only @import/@tailwind directives.`);
    }
    seenNonImport = true;
  }
}

function checkStyleFile(filePath) {
  const raw = read(filePath);
  const withoutComments = raw.replace(/\/\*[\s\S]*?\*\//g, "");
  const rel = path.relative(webRoot, filePath);

  if (/^\s*@layer\b/m.test(withoutComments)) {
    violations.push(`${rel} contains @layer; split global files must not declare @layer blocks.`);
  }

  const classMatches = [...withoutComments.matchAll(/\.[A-Za-z_][\w-]*/g)].map((m) => m[0].slice(1));
  const isUtilities = rel.endsWith("utilities.css");

  if (!isUtilities && classMatches.length > 0) {
    violations.push(`${rel} contains class selectors outside utilities layer (${classMatches.join(", ")}).`);
  }

  if (isUtilities) {
    for (const cls of classMatches) {
      if (!cls.startsWith("dm-") && cls !== "sbdocs" && cls !== "sbdocs-preview") {
        violations.push(`${rel} contains non-approved utility selector .${cls}.`);
      }
    }
  }
}

function run() {
  checkGlobals();

  const styleFiles = fs
    .readdirSync(stylesDir)
    .filter((name) => name.endsWith(".css"))
    .map((name) => path.join(stylesDir, name));

  styleFiles.forEach(checkStyleFile);

  if (violations.length > 0) {
    console.error("Global CSS boundary validation failed:\n");
    violations.forEach((item) => console.error(`- ${item}`));
    process.exit(1);
  }

  console.log("Global CSS boundary validation passed.");
}

run();
