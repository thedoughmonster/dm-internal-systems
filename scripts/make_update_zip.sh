#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Usage: scripts/make_update_zip.sh <zip_name> <manifest_path>" >&2
  exit 1
fi

zip_name="$1"
manifest_path="$2"

if [ ! -f "$manifest_path" ]; then
  echo "Manifest not found at $manifest_path" >&2
  exit 1
fi

repo_root="$(pwd)"
inbox_dir="updates/inbox"
mkdir -p "$repo_root/$inbox_dir"

temp_dir="$(mktemp -d)"
cleanup() {
  rm -rf "$temp_dir"
}
trap cleanup EXIT

cp "$manifest_path" "$temp_dir/manifest.json"

payload_dir="$(dirname "$manifest_path")/payload"
if [ -d "$payload_dir" ]; then
  cp -R "$payload_dir" "$temp_dir/payload"
fi

zip_path="${repo_root}/${inbox_dir}/${zip_name}.zip"
(
  cd "$temp_dir"
  zip -qr "$zip_path" .
)

echo "$zip_path"
