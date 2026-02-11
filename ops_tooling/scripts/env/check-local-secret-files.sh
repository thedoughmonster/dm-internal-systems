#!/usr/bin/env bash
set -euo pipefail

test_file=".env.test.local"
prod_file=".env.prod.local"

for file in "$test_file" "$prod_file"; do
  if [ ! -f "$file" ]; then
    echo "Missing required env file: $file" >&2
    exit 1
  fi
done

required_keys="$(sed -n 's/^\([A-Z0-9_]\+\)=.*/\1/p' .env.test.example)"
if [ "$required_keys" = "" ]; then
  echo "No required keys found in .env.test.example" >&2
  exit 1
fi

check_file() {
  local file="$1"
  local key=""

  while IFS= read -r key; do
    if ! rg -q "^${key}=" "$file"; then
      echo "Missing required key in $file: $key" >&2
      exit 1
    fi

    value="$(sed -n "s/^${key}=//p" "$file" | tail -n 1)"
    if [ "$value" = "" ]; then
      echo "Empty value for key in $file: $key" >&2
      exit 1
    fi

    if [ "$value" = "__REPLACE_ME__" ]; then
      echo "Placeholder value detected in $file for key: $key" >&2
      exit 1
    fi
  done <<EOF
$required_keys
EOF
}

check_file "$test_file"
check_file "$prod_file"

echo "Local secret source files are present and populated."
