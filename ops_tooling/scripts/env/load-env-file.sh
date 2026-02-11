#!/usr/bin/env bash
set -euo pipefail

if [ "${1:-}" = "" ]; then
  echo "Usage: $0 <env-file>" >&2
  exit 1
fi

env_file="$1"

if [ ! -f "$env_file" ]; then
  echo "Env file not found: $env_file" >&2
  exit 1
fi

# Print key names only from an env file without exposing values.
while IFS= read -r line || [ -n "$line" ]; do
  line="${line#"${line%%[![:space:]]*}"}"

  case "$line" in
    ""|\#*)
      continue
      ;;
  esac

  line="${line#export }"

  key="${line%%=*}"
  if [ "$key" = "$line" ] || [ "$key" = "" ]; then
    continue
  fi

  printf '%s\n' "$key"
done < "$env_file"
