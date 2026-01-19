#!/usr/bin/env python3
import argparse
import json
import sys
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


def main() -> int:
    parser = argparse.ArgumentParser(description="Append a validated actor to dm_actors_v1.json")
    parser.add_argument("--actor-json", dest="actor_json", default=None, help="Path to actor JSON")
    parser.add_argument(
        "--actors-doc",
        dest="actors_doc",
        default="docs/dm_actors_v1.json",
        help="Path to actors doc",
    )
    parser.add_argument(
        "--model-doc",
        dest="model_doc",
        default="docs/dm_actor_model_v1.json",
        help="Path to actor model doc",
    )
    parser.add_argument("--validate-only", dest="validate_only", action="store_true")
    args = parser.parse_args()

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

    model_doc = load_json(args.model_doc)
    required, allowed, scalar_enums, array_enums = derive_schema(model_doc)
    issues = validate_actor(actor, required, allowed, scalar_enums, array_enums)

    if issues:
        print("E_ACTOR_SCHEMA_VALIDATION")
        for issue in issues:
            print(f"path: {issue['path']}")
            print(f"message: {issue['message']}")
        return 1

    actors_doc = load_actors_doc(args.actors_doc)
    actor_id = actor.get("id")
    for existing in actors_doc["actors"]:
        if isinstance(existing, dict) and existing.get("id") == actor_id:
            print("E_ACTOR_ID_DUPLICATE")
            print(f"id: {actor_id}")
            return 1

    if args.validate_only:
        return 0

    actors_doc["actors"].append(actor)
    with open(args.actors_doc, "w", encoding="utf-8") as handle:
        json.dump(actors_doc, handle, indent=2)
        handle.write("\n")

    print(f"APPENDED_OK id={actor_id}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
