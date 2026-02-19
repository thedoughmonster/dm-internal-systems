#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
RUNTIME_SRC="$ROOT_DIR/.runbook/scripts"
RUNTIME_DST="${HOME}/.runbook-cli/scripts"
LAUNCHER_DST="/usr/local/bin/runbook"

if [[ ! -d "$RUNTIME_SRC" ]]; then
  echo "runbook install: missing runtime source at $RUNTIME_SRC" >&2
  exit 1
fi

mkdir -p "$RUNTIME_DST"
cp "$RUNTIME_SRC/runbook_cli.mjs" "$RUNTIME_DST/runbook_cli.mjs"
cp "$RUNTIME_SRC/_list_component.mjs" "$RUNTIME_DST/_list_component.mjs"
chmod 755 "$RUNTIME_DST/runbook_cli.mjs"

cat > "$LAUNCHER_DST" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
RUNTIME="${HOME}/.runbook-cli/scripts/runbook_cli.mjs"
if [[ ! -f "$RUNTIME" ]]; then
  echo "runbook: runtime not installed at $RUNTIME" >&2
  exit 1
fi

ROOT="${RUNBOOK_REPO_ROOT:-}"
if [[ -z "$ROOT" ]]; then
  SEARCH_DIR="$PWD"
  while [[ "$SEARCH_DIR" != "/" ]]; do
    if [[ -f "$SEARCH_DIR/.runbook/phases.json" ]]; then
      ROOT="$SEARCH_DIR"
      break
    fi
    SEARCH_DIR="$(dirname "$SEARCH_DIR")"
  done
fi

if [[ -z "$ROOT" ]]; then
  echo "runbook: unable to locate repository root (.runbook/phases.json)." >&2
  exit 1
fi

exec env RUNBOOK_REPO_ROOT="$ROOT" node "$RUNTIME" "$@"
EOF

chmod 755 "$LAUNCHER_DST"
echo "runbook install: runtime synced to $RUNTIME_DST and launcher installed at $LAUNCHER_DST"
