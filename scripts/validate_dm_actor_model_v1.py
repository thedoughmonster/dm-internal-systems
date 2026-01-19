#!/usr/bin/env python3
import json
import sys
from pathlib import Path

from jsonschema import Draft202012Validator


def format_path(error_path):
    if not error_path:
        return "$"
    parts = ["$"]
    for part in error_path:
        if isinstance(part, int):
            parts.append(f"[{part}]")
        else:
            parts.append(f".{part}")
    return "".join(parts)


def main():
    root = Path(__file__).resolve().parents[1]
    data_path = root / "docs" / "system_map_work_surfaces_v0.json"
    schema_path = root / "docs" / "dm_actor_model_v1.schema.json"

    try:
        data = json.loads(data_path.read_text())
    except Exception as exc:
        print(f"Failed to read {data_path}: {exc}")
        return 1

    if not isinstance(data, dict) or "doc" not in data or not isinstance(data["doc"], dict):
        print("Invalid data format: missing doc object")
        return 1

    data["doc"]["id"] = "dm_actor_model_v1"

    try:
        schema = json.loads(schema_path.read_text())
    except Exception as exc:
        print(f"Failed to read {schema_path}: {exc}")
        return 1

    validator = Draft202012Validator(schema)
    errors = sorted(validator.iter_errors(data), key=lambda e: e.path)

    if errors:
        error = errors[0]
        print(f"Validation error at {format_path(error.path)}: {error.message}")
        return 1

    print("Validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
