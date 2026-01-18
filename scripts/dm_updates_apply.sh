#!/usr/bin/env bash
set -euo pipefail

inbox_dir="updates/inbox"
applied_dir="updates/applied"

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

require_rel_path() {
  local path="$1"
  if [[ -z "$path" ]]; then
    fail "Path must not be empty."
  fi
  if [[ "$path" = /* ]]; then
    fail "Path must be relative: $path"
  fi
  if [[ "$path" == "../"* || "$path" == *"/../"* || "$path" == *"/.." ]]; then
    fail "Path must not contain .. segments: $path"
  fi
}

validate_manifest() {
  local manifest_path="$1"
  python3 - "$manifest_path" <<'PY'
import json
import sys

manifest_path = sys.argv[1]
with open(manifest_path, "r", encoding="utf-8") as fh:
    data = json.load(fh)

if data.get("schema_version") != 1:
    raise SystemExit("manifest schema_version must be 1")

ops = data.get("ops")
if not isinstance(ops, list):
    raise SystemExit("manifest ops must be a list")

allowed = {"copy_files", "write_file", "append_verified_behavior", "run"}
for idx, op in enumerate(ops):
    if not isinstance(op, dict):
        raise SystemExit(f"manifest op {idx} must be an object")
    op_type = op.get("op")
    if op_type not in allowed:
        raise SystemExit(f"manifest op {idx} has unsupported op type: {op_type}")
    if op_type == "copy_files":
        items = op.get("items")
        if not isinstance(items, list) or not items:
            raise SystemExit("copy_files items must be a non-empty list")
        for item in items:
            if not isinstance(item, dict):
                raise SystemExit("copy_files item must be an object")
            if not isinstance(item.get("src"), str) or not isinstance(item.get("dst"), str):
                raise SystemExit("copy_files item must include src and dst strings")
    elif op_type == "write_file":
        if not isinstance(op.get("path"), str) or not isinstance(op.get("content"), str):
            raise SystemExit("write_file must include path and content strings")
    elif op_type == "append_verified_behavior":
        required = ["date", "change", "files", "verification"]
        for key in required:
            if key not in op:
                raise SystemExit(f"append_verified_behavior missing required field: {key}")
        if not isinstance(op.get("date"), str) or not isinstance(op.get("change"), str):
            raise SystemExit("append_verified_behavior date and change must be strings")
        if not isinstance(op.get("files"), list) or not all(isinstance(x, str) for x in op.get("files")):
            raise SystemExit("append_verified_behavior files must be a list of strings")
        if not isinstance(op.get("verification"), list) or not all(
            isinstance(x, str) for x in op.get("verification")
        ):
            raise SystemExit("append_verified_behavior verification must be a list of strings")
        notes = op.get("notes")
        if notes is not None and (not isinstance(notes, list) or not all(isinstance(x, str) for x in notes)):
            raise SystemExit("append_verified_behavior notes must be a list of strings")
    elif op_type == "run":
        if not isinstance(op.get("cmd"), str):
            raise SystemExit("run must include cmd string")
PY
}

append_verified_behavior() {
  local date="$1"
  local change="$2"
  local files_json="$3"
  local verification_json="$4"
  local notes_json="$5"

  if [ ! -f docs/verified_behaviors.md ]; then
    fail "docs/verified_behaviors.md not found for append_verified_behavior"
  fi

  local files_block
  local verification_block
  local notes_block

  files_block=$(python3 - "$files_json" <<'PY'
import json
import sys
items = json.loads(sys.argv[1])
for item in items:
    print(f"- {item}")
PY
)

  verification_block=$(python3 - "$verification_json" <<'PY'
import json
import sys
items = json.loads(sys.argv[1])
for item in items:
    print(f"- {item}")
PY
)

  notes_block=""
  if [ -n "$notes_json" ]; then
    notes_block=$(python3 - "$notes_json" <<'PY'
import json
import sys
items = json.loads(sys.argv[1])
for item in items:
    print(f"- {item}")
PY
)
  fi

  local block
  block="## Verified Behavior
Date: ${date}
Change: ${change}
Files:
${files_block}
Verification:
${verification_block}"

  if [ -n "$notes_block" ]; then
    block="${block}
Notes:
${notes_block}"
  fi

  local tmp_file
  tmp_file="$(mktemp)"

  awk -v block="$block" '
    {
      print $0
      if (!inserted && $0 == "---") {
        print ""
        print block
        print ""
        inserted = 1
      }
    }
  ' docs/verified_behaviors.md > "$tmp_file"

  if ! grep -q "^## Verified Behavior" "$tmp_file"; then
    rm -f "$tmp_file"
    fail "Failed to append verified behavior entry"
  fi

  mv "$tmp_file" docs/verified_behaviors.md
}

apply_run_command() {
  local cmd="$1"

  if [[ "$cmd" == *"rm -rf /"* || "$cmd" == *"mkfs"* || "$cmd" == *"dd if="* || "$cmd" == *"shutdown"* || "$cmd" == *"reboot"* ]]; then
    fail "Disallowed command in run op: $cmd"
  fi

  echo "RUN: $cmd"
  set +e
  bash -lc "$cmd"
  local status=$?
  set -e
  if [ "$status" -ne 0 ]; then
    fail "Run op failed with status $status"
  fi
}

apply_zip() {
  local zip_name="$1"
  local zip_path="${inbox_dir}/${zip_name}"
  echo "BEGIN UPDATE PACKAGE: ${zip_name}"

  local temp_dir
  temp_dir="$(mktemp -d)"
  cleanup() {
    rm -rf "$temp_dir"
  }
  trap cleanup RETURN

  unzip -q "$zip_path" -d "$temp_dir"
  if [ ! -f "$temp_dir/manifest.json" ]; then
    fail "manifest.json missing in ${zip_name}"
  fi

  local manifest_path="$temp_dir/manifest.json"
  validate_manifest "$manifest_path"

  local manifest_sha256
  manifest_sha256="$(sha256sum "$manifest_path" | awk '{print $1}')"
  local op_count
  op_count="$(python3 - "$manifest_path" <<'PY'
import json
import sys
with open(sys.argv[1], "r", encoding="utf-8") as fh:
    data = json.load(fh)
print(len(data.get("ops", [])))
PY
)"

  for ((i = 0; i < op_count; i++)); do
    op_type="$(python3 - "$manifest_path" "$i" <<'PY'
import json
import sys
with open(sys.argv[1], "r", encoding="utf-8") as fh:
    data = json.load(fh)
op = data["ops"][int(sys.argv[2])]
print(op["op"])
PY
)"

    case "$op_type" in
      copy_files)
        while IFS=$'\t' read -r src dst; do
          require_rel_path "$src"
          require_rel_path "$dst"
          if [ ! -f "$temp_dir/$src" ]; then
            fail "copy_files missing source: $src"
          fi
          mkdir -p "$(dirname "$dst")"
          cp -f "$temp_dir/$src" "$dst"
        done < <(python3 - "$manifest_path" "$i" <<'PY'
import json
import sys
with open(sys.argv[1], "r", encoding="utf-8") as fh:
    data = json.load(fh)
op = data["ops"][int(sys.argv[2])]
for item in op["items"]:
    print(f"{item['src']}\t{item['dst']}")
PY
        )
        ;;
      write_file)
        path="$(python3 - "$manifest_path" "$i" <<'PY'
import json
import sys
with open(sys.argv[1], "r", encoding="utf-8") as fh:
    data = json.load(fh)
op = data["ops"][int(sys.argv[2])]
print(op["path"])
PY
)"
        content="$(python3 - "$manifest_path" "$i" <<'PY'
import json
import sys
with open(sys.argv[1], "r", encoding="utf-8") as fh:
    data = json.load(fh)
op = data["ops"][int(sys.argv[2])]
print(op["content"])
PY
)"
        require_rel_path "$path"
        mkdir -p "$(dirname "$path")"
        printf "%s" "$content" > "$path"
        ;;
      append_verified_behavior)
        date_val="$(python3 - "$manifest_path" "$i" <<'PY'
import json
import sys
with open(sys.argv[1], "r", encoding="utf-8") as fh:
    data = json.load(fh)
op = data["ops"][int(sys.argv[2])]
print(op["date"])
PY
)"
        change_val="$(python3 - "$manifest_path" "$i" <<'PY'
import json
import sys
with open(sys.argv[1], "r", encoding="utf-8") as fh:
    data = json.load(fh)
op = data["ops"][int(sys.argv[2])]
print(op["change"])
PY
)"
        files_json="$(python3 - "$manifest_path" "$i" <<'PY'
import json
import sys
with open(sys.argv[1], "r", encoding="utf-8") as fh:
    data = json.load(fh)
op = data["ops"][int(sys.argv[2])]
print(json.dumps(op["files"]))
PY
)"
        verification_json="$(python3 - "$manifest_path" "$i" <<'PY'
import json
import sys
with open(sys.argv[1], "r", encoding="utf-8") as fh:
    data = json.load(fh)
op = data["ops"][int(sys.argv[2])]
print(json.dumps(op["verification"]))
PY
)"
        notes_json="$(python3 - "$manifest_path" "$i" <<'PY'
import json
import sys
with open(sys.argv[1], "r", encoding="utf-8") as fh:
    data = json.load(fh)
op = data["ops"][int(sys.argv[2])]
notes = op.get("notes")
print("" if notes is None else json.dumps(notes))
PY
)"
        append_verified_behavior "$date_val" "$change_val" "$files_json" "$verification_json" "$notes_json"
        ;;
      run)
        cmd="$(python3 - "$manifest_path" "$i" <<'PY'
import json
import sys
with open(sys.argv[1], "r", encoding="utf-8") as fh:
    data = json.load(fh)
op = data["ops"][int(sys.argv[2])]
print(op["cmd"])
PY
)"
        apply_run_command "$cmd"
        ;;
      *)
        fail "Unsupported op type: $op_type"
        ;;
    esac
  done

  rm -f "$zip_path"

  if [ -d "$applied_dir" ]; then
    applied_at_utc="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    receipt_name="$(date -u +"%Y%m%dT%H%M%SZ")_${zip_name}.json"
    receipt_path="${applied_dir}/${receipt_name}"
    python3 - "$receipt_path" "$applied_at_utc" "$zip_name" "$manifest_sha256" <<'PY'
import json
import os
import sys

receipt_path = sys.argv[1]
data = {
    "applied_at_utc": sys.argv[2],
    "zip_filename": sys.argv[3],
    "manifest_sha256": sys.argv[4],
}

actor = os.environ.get("GITHUB_ACTOR")
run_id = os.environ.get("GITHUB_RUN_ID")
if actor:
    data["actor"] = actor
if run_id:
    data["run_id"] = run_id

with open(receipt_path, "w", encoding="utf-8") as fh:
    json.dump(data, fh, indent=2, sort_keys=True)
    fh.write("\n")
PY
  fi

  echo "END UPDATE PACKAGE: ${zip_name}"
}

if [ ! -d "$inbox_dir" ]; then
  echo "Updates inbox not found at $inbox_dir. Skipping."
  exit 0
fi

mapfile -t zips < <(find "$inbox_dir" -maxdepth 1 -type f -name "*.zip" -printf "%f\n" | LC_ALL=C sort)

if [ "${#zips[@]}" -eq 0 ]; then
  echo "No update packages found."
  exit 0
fi

for zip_name in "${zips[@]}"; do
  apply_zip "$zip_name"
done
