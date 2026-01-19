#!/usr/bin/env bash
set -e

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [ -z "$ROOT" ]; then
  echo "Not inside a git repo (git rev-parse failed)."
  exit 1
fi

OUTPUT="$ROOT/repo_tree.txt"
cd "$ROOT"

if command -v tree >/dev/null 2>&1; then
  tree \
    -a \
    -I "node_modules|.git|.next|dist|build|coverage|.vercel|.turbo|*.log" \
    --dirsfirst \
    > "$OUTPUT"
else
  find . \
    -not -path "./.git/*" \
    -not -path "./node_modules/*" \
    -not -path "./.next/*" \
    -not -path "./dist/*" \
    -not -path "./build/*" \
    -not -path "./coverage/*" \
    -not -path "./.vercel/*" \
    -not -path "./.turbo/*" \
    | sort \
    > "$OUTPUT"
fi

echo "Directory tree written to $OUTPUT"
