#!/usr/bin/env python3
import os
import sys
from pathlib import Path

ALLOWED_STATES = {"draft", "validated", "canonical", "locked", "deprecated"}
AUTH_JSON = Path("docs") / "document_lifecycle_v1.json"
AUTH_MD = Path("docs") / "DOCUMENT_LIFECYCLE_V1.MD"


def _collect_docs_files(docs_root: Path):
    files = []
    for root, _dirs, filenames in os.walk(docs_root):
        for name in filenames:
            path = Path(root) / name
            if path == AUTH_JSON or path == AUTH_MD:
                continue
            files.append(path)
    return files


def _is_state_path_ok(rel_parts):
    if len(rel_parts) != 3:
        return False
    return rel_parts[1] in ALLOWED_STATES


def main() -> int:
    if not AUTH_JSON.is_file():
        print(f"Missing authority file: {AUTH_JSON}")
        return 1
    if not AUTH_MD.is_file():
        print(f"Missing authority file: {AUTH_MD}")
        return 1

    docs_root = Path("docs")
    if not docs_root.exists():
        return 0

    docs_files = _collect_docs_files(docs_root)
    if not docs_files:
        return 0

    violations = []
    files_by_dir = {}

    for path in docs_files:
        rel = path.relative_to(docs_root)
        parts = rel.parts

        if len(parts) < 3:
            violations.append(
                f"Invalid path (missing state): docs/{rel.as_posix()}"
            )
            continue
        if len(parts) > 3:
            violations.append(
                f"Invalid path (extra nesting): docs/{rel.as_posix()}"
            )
            continue
        if parts[1] not in ALLOWED_STATES:
            violations.append(
                f"Invalid state folder '{parts[1]}' for: docs/{rel.as_posix()}"
            )
            continue

        files_by_dir.setdefault(rel.parent, []).append(path)

        name = path.name
        suffix = path.suffix
        if suffix.lower() == ".json":
            if name != name.lower() or suffix != ".json":
                violations.append(
                    f"JSON filename must be lowercase: docs/{rel.as_posix()}"
                )
        if suffix.lower() == ".md":
            if name != name.upper() or suffix != ".MD":
                violations.append(
                    f"MD filename must be uppercase with .MD: docs/{rel.as_posix()}"
                )

    for rel_dir, paths in files_by_dir.items():
        json_stems = set()
        md_stems = set()
        for path in paths:
            suffix = path.suffix
            if suffix.lower() == ".json":
                json_stems.add(path.stem.lower())
            if suffix.lower() == ".md":
                md_stems.add(path.stem.lower())
        missing_md = sorted(json_stems - md_stems)
        missing_json = sorted(md_stems - json_stems)
        for stem in missing_md:
            violations.append(
                f"Missing MD pair for JSON '{stem}' in: docs/{rel_dir.as_posix()}"
            )
        for stem in missing_json:
            violations.append(
                f"Missing JSON pair for MD '{stem}' in: docs/{rel_dir.as_posix()}"
            )

    if violations:
        for msg in sorted(violations):
            print(msg)
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
