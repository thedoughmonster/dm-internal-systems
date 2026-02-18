#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$REPO_ROOT"

chmod +x .githooks/pre-commit
git config core.hooksPath .githooks

echo "Configured git hooks path to .githooks"
