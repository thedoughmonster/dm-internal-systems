#!/usr/bin/env python3
from __future__ import annotations

import shutil
import sys
import time
import zipfile
from pathlib import Path


def die(msg: str, code: int = 1) -> None:
    print(msg, file=sys.stderr)
    raise SystemExit(code)


def copytree_overwrite(src: Path, dst: Path) -> None:
    """
    Copy src tree into dst, overwriting files that already exist.
    """
    for p in src.rglob("*"):
        rel = p.relative_to(src)
        target = dst / rel
        if p.is_dir():
            target.mkdir(parents=True, exist_ok=True)
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(p, target)


def main() -> int:
    if len(sys.argv) != 2:
        die("Usage: python extract_to_repo.py <path-to-zip>")

    repo_root = Path.cwd()
    zip_path = Path(sys.argv[1]).expanduser().resolve()
    if not zip_path.exists():
        die(f"Zip not found: {zip_path}")

    tmp = repo_root / ".tmp_toast_api_envkit_extract"
    if tmp.exists():
        shutil.rmtree(tmp)
    tmp.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(zip_path, "r") as z:
        z.extractall(tmp)

    # Find the payload root.
    # Preferred: payload contains scripts/toast_api/*
    # Some zips have an extra top-level folder, so search.
    candidates = list(tmp.rglob("scripts/toast_api"))
    if not candidates:
        die("Zip payload did not contain scripts/toast_api. Nothing to install.")
    payload_toast_api = candidates[0]
    payload_root = payload_toast_api.parent.parent  # -> the folder that contains "scripts"

    # Backup existing scripts/toast_api if present
    dest_toast_api = repo_root / "scripts" / "toast_api"
    if dest_toast_api.exists():
        backup_root = repo_root / ".backup_toast_api"
        backup_root.mkdir(parents=True, exist_ok=True)
        stamp = time.strftime("%Y%m%d_%H%M%S")
        backup_path = backup_root / stamp
        backup_path.mkdir(parents=True, exist_ok=True)
        shutil.copytree(dest_toast_api, backup_path / "toast_api")
        print(f"Backed up existing scripts/toast_api to: {backup_path}")

    # Install: copy scripts/toast_api into repo scripts/toast_api
    (repo_root / "scripts").mkdir(parents=True, exist_ok=True)
    dest_toast_api.mkdir(parents=True, exist_ok=True)
    copytree_overwrite(payload_toast_api, dest_toast_api)
    print(f"Installed scripts/toast_api to: {dest_toast_api}")

    # Also copy ENV_KEYS.txt / README if they exist in payload scripts/toast_api
    # (already included above), so nothing else required.

    # Cleanup temp
    shutil.rmtree(tmp)
    print("Done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())