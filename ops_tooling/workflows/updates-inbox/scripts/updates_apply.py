#!/usr/bin/env python3
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath
from zipfile import ZipFile

ALLOWED_PREFIX = "docs/"
FORBIDDEN_DIRS = {"canonical", "locked", "deprecated"}
FORBIDDEN_FILES = {
    "docs/document_lifecycle_v1.json",
    "docs/DOCUMENT_LIFECYCLE_V1.MD",
}
SCRIPT_PATH = Path(__file__).resolve()


def _repo_root() -> Path:
    for parent in SCRIPT_PATH.parents:
        if (parent / "AGENTS.md").is_file() or (parent / ".git").exists():
            return parent
    return SCRIPT_PATH.parents[0]


def _utc_timestamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def _utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _write_log(zip_name, status, manifest_sha, files_written, notes):
    applied_dir = _repo_root() / "workflows" / "updates-inbox" / "applied"
    applied_dir.mkdir(parents=True, exist_ok=True)
    log_name = f"{_utc_timestamp()}_{Path(zip_name).stem}.json"
    log_path = applied_dir / log_name
    data = {
        "actor": os.environ.get("GITHUB_ACTOR", "dm-bot"),
        "applied_at_utc": _utc_iso(),
        "manifest_sha256": manifest_sha,
        "run_id": os.environ.get("GITHUB_RUN_ID", ""),
        "zip_filename": zip_name,
        "status": status,
        "files_written": files_written,
        "notes": notes,
    }
    log_path.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n")


def _validate_dest(dest: str) -> str:
    if "\\" in dest:
        raise ValueError(f"Invalid dest path (backslashes not allowed): {dest}")
    posix = PurePosixPath(dest)
    if posix.is_absolute():
        raise ValueError(f"Invalid dest path (absolute): {dest}")
    if any(part == ".." for part in posix.parts):
        raise ValueError(f"Invalid dest path (.. not allowed): {dest}")
    if not dest.startswith(ALLOWED_PREFIX):
        raise ValueError(f"Destination not allowed: {dest}")
    if dest in FORBIDDEN_FILES:
        raise ValueError(f"Destination forbidden: {dest}")
    for part in posix.parts[1:-1]:
        if part in FORBIDDEN_DIRS:
            raise ValueError(f"Destination forbidden: {dest}")
    return posix.as_posix()


def _validate_src(src: str) -> PurePosixPath:
    if "\\" in src:
        raise ValueError(f"Invalid src path (backslashes not allowed): {src}")
    posix = PurePosixPath(src)
    if posix.is_absolute():
        raise ValueError(f"Invalid src path (absolute): {src}")
    if any(part == ".." for part in posix.parts):
        raise ValueError(f"Invalid src path (.. not allowed): {src}")
    if not src.startswith("payload/"):
        raise ValueError(f"Invalid src path (must start with payload/): {src}")
    return posix


def _run_validator() -> int:
    validator = _repo_root() / "scripts" / "validate_docs_lifecycle_v1.py"
    result = subprocess.run([sys.executable, str(validator)])
    return result.returncode


def _apply_zip(zip_path: Path) -> bool:
    zip_name = zip_path.name
    files_written = []
    manifest_sha = ""

    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp_root = Path(tmpdir)
            with ZipFile(zip_path) as zf:
                zf.extractall(tmp_root)

            manifest_path = tmp_root / "manifest.json"
            payload_dir = tmp_root / "payload"
            if not manifest_path.is_file():
                raise ValueError("Missing manifest.json at zip root")
            if not payload_dir.is_dir():
                raise ValueError("Missing payload/ directory at zip root")

            manifest_bytes = manifest_path.read_bytes()
            manifest_sha = hashlib.sha256(manifest_bytes).hexdigest()
            manifest = json.loads(manifest_bytes.decode("utf-8"))

            if not isinstance(manifest, dict):
                raise ValueError("manifest.json must be an object")
            if not isinstance(manifest.get("package_id"), str):
                raise ValueError("manifest.json package_id must be a string")
            ops = manifest.get("ops")
            if not isinstance(ops, list):
                raise ValueError("manifest.json ops must be a list")

            for idx, op in enumerate(ops):
                if not isinstance(op, dict):
                    raise ValueError(f"op[{idx}] must be an object")
                if op.get("op") != "copy":
                    raise ValueError(f"op[{idx}].op must be 'copy'")
                src = op.get("src")
                dest = op.get("dest")
                if not isinstance(src, str) or not isinstance(dest, str):
                    raise ValueError(f"op[{idx}] src/dest must be strings")

                src_posix = _validate_src(src)
                dest_posix = _validate_dest(dest)

                src_path = tmp_root.joinpath(*src_posix.parts)
                if not src_path.is_file():
                    raise ValueError(f"Source file missing: {src}")
                resolved_src = src_path.resolve()
                resolved_payload = payload_dir.resolve()
                if os.path.commonpath([resolved_src, resolved_payload]) != str(
                    resolved_payload
                ):
                    raise ValueError(f"Source file escapes payload/: {src}")

                dest_path = _repo_root() / PurePosixPath(dest_posix)
                dest_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(src_path, dest_path)
                files_written.append(dest_posix)

            if _run_validator() != 0:
                _write_log(
                    zip_name,
                    "failed",
                    manifest_sha,
                    files_written,
                    "docs lifecycle validation failed",
                )
                return False

        applied_zips = _repo_root() / "workflows" / "updates-inbox" / "applied" / "zips"
        applied_zips.mkdir(parents=True, exist_ok=True)
        os.replace(zip_path, applied_zips / zip_name)
        _write_log(zip_name, "applied", manifest_sha, files_written, "")
        return True
    except Exception as exc:
        _write_log(zip_name, "failed", manifest_sha, files_written, str(exc))
        print(f"Failed applying {zip_name}: {exc}", file=sys.stderr)
        return False


def main() -> int:
    inbox = _repo_root() / "workflows" / "updates-inbox" / "inbox"
    if not inbox.exists():
        print("No packages in ops_tooling/workflows/updates-inbox/inbox")
        return 0

    zips = sorted(inbox.glob("*.zip"))
    if not zips:
        print("No packages in ops_tooling/workflows/updates-inbox/inbox")
        return 0

    for zip_path in zips:
        if not _apply_zip(zip_path):
            return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
