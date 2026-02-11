#!/usr/bin/env bash
set -euo pipefail

prod_ref="dm_brain_prod"
test_ref="dm_brain_test"

if [ "${SUPABASE_PROJECT_REF:-}" = "" ]; then
  echo "Missing required environment variable: SUPABASE_PROJECT_REF" >&2
  exit 1
fi

if [ "${SUPABASE_PROJECT_REF}" != "$test_ref" ]; then
  echo "Invalid SUPABASE_PROJECT_REF for integration tests. Expected test project." >&2
  exit 1
fi

for var_name in SUPABASE_PROJECT_REF NEXT_PUBLIC_SUPABASE_URL SUPABASE_URL; do
  value="${!var_name:-}"
  if [ "$value" != "" ] && printf '%s' "$value" | rg -q "$prod_ref"; then
    echo "Blocked: $var_name references production project." >&2
    exit 1
  fi
done

echo "Test environment guard passed."
