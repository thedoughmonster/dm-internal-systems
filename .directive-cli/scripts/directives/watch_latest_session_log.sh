#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LOG_DIR="${ROOT_DIR}/.directive-cli/session-logs"

if [[ ! -d "${LOG_DIR}" ]]; then
  echo "No log directory found: ${LOG_DIR}" >&2
  exit 1
fi

LATEST_LOG="$(ls -1t "${LOG_DIR}"/*.log 2>/dev/null | head -n1 || true)"
if [[ -z "${LATEST_LOG}" ]]; then
  echo "No session logs found in ${LOG_DIR}" >&2
  exit 1
fi

echo "Watching: ${LATEST_LOG}"
exec tail -f "${LATEST_LOG}"

