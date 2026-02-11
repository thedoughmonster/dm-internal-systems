#!/usr/bin/env python3
import argparse
import json
import os
import sys
import tempfile
from typing import Any, Dict, List, Tuple


def load_json(path: str) -> Any:
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def read_actor_input(path: str | None) -> Tuple[bool, Any, List[Dict[str, str]]]:
    if path:
        try:
            return True, load_json(path), []
        except json.JSONDecodeError as exc:
            return True, None, [
                {"path": "$", "message": f"invalid JSON: {exc.msg}"}
            ]
    raw = sys.stdin.read()
    if raw.strip() == "":
        return False, None, []
    try:
        return True, json.loads(raw), []
    except json.JSONDecodeError as exc:
        return True, None, [{"path": "$", "message": f"invalid JSON: {exc.msg}"}]


def derive_schema(model_doc: Dict[str, Any]) -> Tuple[List[str], List[str], Dict[str, List[str]], Dict[str, List[str]]]:
    schema = model_doc["doc"]["schemas"]["actor"]
    required = list(schema.get("required", []))
    properties = schema.get("properties", {})
    allowed = list(properties.keys())
    enums = model_doc["doc"]["enums"]

    scalar_enums: Dict[str, List[str]] = {}
    array_enums: Dict[str, List[str]] = {}

    for field, definition in properties.items():
        if "enum_ref" in definition:
            enum_ref = definition["enum_ref"]
            scalar_enums[field] = list(enums[enum_ref]["values"])
        elif "items" in definition and "enum_ref" in definition["items"]:
            enum_ref = definition["items"]["enum_ref"]
            array_enums[field] = list(enums[enum_ref]["values"])

    return required, allowed, scalar_enums, array_enums


def normalize_actor_input(raw: Any) -> Tuple[List[Tuple[str, Any]], List[Dict[str, str]]]:
    if isinstance(raw, dict) and "actors" in raw:
        actors = raw.get("actors")
        if not isinstance(actors, list):
            return [], [{"path": "$.actors", "message": "actors must be an array"}]
        return [(f"$.actors[{idx}]", actor) for idx, actor in enumerate(actors)], []

    if isinstance(raw, list):
        return [(f"$[{idx}]", actor) for idx, actor in enumerate(raw)], []

    return [("$", raw)], []


def prefix_issue_path(path: str, prefix: str) -> str:
    if prefix == "$":
        return path
    if path == "$":
        return prefix
    if path.startswith("$"):
        return prefix + path[1:]
    return prefix + path


def validate_actor(
    actor: Any,
    required: List[str],
    allowed: List[str],
    scalar_enums: Dict[str, List[str]],
    array_enums: Dict[str, List[str]],
) -> List[Dict[str, str]]:
    issues: List[Dict[str, str]] = []

    if not isinstance(actor, dict):
        return [{"path": "$", "message": "actor must be an object"}]

    for field in required:
        if field not in actor:
            issues.append({"path": f"$.{field}", "message": "missing required field"})

    for field in actor.keys():
        if field not in allowed:
            issues.append({"path": f"$.{field}", "message": "unknown field"})

    for field, allowed_values in scalar_enums.items():
        if field in actor:
            value = actor[field]
            if value not in allowed_values:
                issues.append(
                    {
                        "path": f"$.{field}",
                        "message": "invalid value, expected one of: " + ", ".join(allowed_values),
                    }
                )

    for field, allowed_values in array_enums.items():
        if field in actor:
            value = actor[field]
            if not isinstance(value, list):
                issues.append({"path": f"$.{field}", "message": "expected array"})
                continue
            for idx, item in enumerate(value):
                if item not in allowed_values:
                    issues.append(
                        {
                            "path": f"$.{field}[{idx}]",
                            "message": "invalid value, expected one of: " + ", ".join(allowed_values),
                        }
                    )

    return issues


def load_actors_doc(path: str) -> Dict[str, Any]:
    data = load_json(path)
    if not isinstance(data, dict) or "actors" not in data or not isinstance(data["actors"], list):
        raise ValueError("actors doc must be an object with an actors array")
    return data


def write_atomic_json(path: str, payload: Dict[str, Any]) -> None:
    directory = os.path.dirname(path)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=directory, delete=False) as handle:
        temp_path = handle.name
        json.dump(payload, handle, indent=2, sort_keys=True, ensure_ascii=False)
        handle.write("\n")
    os.replace(temp_path, path)


def main() -> int:
    parser = argparse.ArgumentParser(description="Append a validated actor to dm_actors_v1.json")
    parser.add_argument("--actor-json", dest="actor_json", default=None, help="Path to actor JSON")
    parser.add_argument(
        "--actors-doc",
        dest="actors_doc",
        default="contracts/actors/dm_actors_v1.json",
        help="Path to actors doc",
    )
    parser.add_argument(
        "--model-doc",
        dest="model_doc",
        default="contracts/actors/dm_actor_model_v1.json",
        help="Path to actor model doc",
    )
    parser.add_argument("--validate-only", dest="validate_only", action="store_true")
    args = parser.parse_args()
    intake_path = "ops_tooling/updates/actors_inbox/dm_actors_v1.src.json"

    has_input, actor, input_issues = read_actor_input(args.actor_json)
    if not has_input:
        if args.validate_only:
            return 0
        print("E_ACTOR_SCHEMA_VALIDATION")
        print("path: $")
        print("message: no actor input provided")
        return 1

    if input_issues:
        print("E_ACTOR_SCHEMA_VALIDATION")
        for issue in input_issues:
            print(f"path: {issue['path']}")
            print(f"message: {issue['message']}")
        return 1

    normalized, normalize_issues = normalize_actor_input(actor)
    if normalize_issues:
        print("E_ACTOR_SCHEMA_VALIDATION")
        for issue in normalize_issues:
            print(f"path: {issue['path']}")
            print(f"message: {issue['message']}")
        return 1

    if len(normalized) == 0:
        print("NO_ACTORS_TO_APPEND no actors to append")
        return 0

    model_doc = load_json(args.model_doc)
    required, allowed, scalar_enums, array_enums = derive_schema(model_doc)

    issues: List[Dict[str, str]] = []
    actor_entries: List[Dict[str, Any]] = []
    for prefix, candidate in normalized:
        entry_issues = validate_actor(candidate, required, allowed, scalar_enums, array_enums)
        for issue in entry_issues:
            issues.append(
                {
                    "path": prefix_issue_path(issue["path"], prefix),
                    "message": issue["message"],
                }
            )
        if isinstance(candidate, dict):
            actor_entries.append(candidate)
        else:
            actor_entries.append(candidate)

    if issues:
        print("E_ACTOR_SCHEMA_VALIDATION")
        for issue in issues:
            print(f"path: {issue['path']}")
            print(f"message: {issue['message']}")
        return 1

    actors_doc = load_actors_doc(args.actors_doc)
    existing_names = {
        existing.get("name")
        for existing in actors_doc["actors"]
        if isinstance(existing, dict) and "name" in existing
    }
    batch_names = set()
    for entry in actor_entries:
        if not isinstance(entry, dict):
            continue
        name = entry.get("name")
        if name is None:
            continue
        if name in batch_names:
            print("E_ACTOR_NAME_DUPLICATE")
            print(f"name: {name}")
            return 1
        if name in existing_names:
            print("E_ACTOR_NAME_DUPLICATE")
            print(f"name: {name}")
            return 1
        batch_names.add(name)

    if args.validate_only:
        return 0

    actors_doc["actors"].extend(actor_entries)
    write_atomic_json(args.actors_doc, actors_doc)
    if args.actor_json is not None and args.actor_json == intake_path:
        try:
            write_atomic_json(intake_path, {"actors": []})
        except Exception as exc:
            print("E_ACTOR_INTAKE_CLEAR_FAILED")
            print(f"path: {intake_path}")
            print(f"message: {exc}")
            return 1

    if len(actor_entries) == 1:
        actor_name = actor_entries[0].get("name") if isinstance(actor_entries[0], dict) else None
        print(f"APPENDED_OK name={actor_name}")
        return 0

    print(f"APPENDED_OK count={len(actor_entries)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
