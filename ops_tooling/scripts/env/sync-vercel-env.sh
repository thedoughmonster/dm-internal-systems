#!/usr/bin/env bash
set -euo pipefail

scope=""
source_file=""

while [ $# -gt 0 ]; do
  case "$1" in
    --scope)
      scope="${2:-}"
      shift 2
      ;;
    --source-file)
      source_file="${2:-}"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      echo "Usage: $0 --scope <preview|development|production> --source-file <path>" >&2
      exit 1
      ;;
  esac
done

if [ "$scope" = "" ] || [ "$source_file" = "" ]; then
  echo "Usage: $0 --scope <preview|development|production> --source-file <path>" >&2
  exit 1
fi

if [ ! -f "$source_file" ]; then
  echo "Source file not found: $source_file" >&2
  exit 1
fi

case "$scope" in
  preview|development)
    if [ "$(basename "$source_file")" != ".env.test.local" ]; then
      echo "Invalid mapping: $scope must use .env.test.local" >&2
      exit 1
    fi
    ;;
  production)
    if [ "$(basename "$source_file")" != ".env.prod.local" ]; then
      echo "Invalid mapping: production must use .env.prod.local" >&2
      exit 1
    fi
    ;;
  *)
    echo "Invalid scope: $scope" >&2
    exit 1
    ;;
esac

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
loader="$script_dir/load-env-file.sh"

if [ ! -x "$loader" ]; then
  chmod +x "$loader"
fi

keys="$("$loader" "$source_file")"
if [ "$keys" = "" ]; then
  echo "No env keys found in $source_file" >&2
  exit 1
fi

for key in $keys; do
  value="$(sed -n "s/^${key}=//p" "$source_file" | tail -n 1)"
  if [ "$value" = "" ]; then
    echo "Missing value for key: $key" >&2
    exit 1
  fi

  vercel env rm "$key" "$scope" --yes >/dev/null 2>&1 || true
  printf '%s' "$value" | vercel env add "$key" "$scope" >/dev/null
done

echo "Vercel env sync completed for scope: $scope"
