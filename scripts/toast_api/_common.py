#!/usr/bin/env python3
"""
Shared helpers for Toast API probes.

Design goals:
- No third party deps (uses urllib only)
- Secrets never printed
- Deterministic output (writes JSON/text files when asked)

Preferred config:
- Read from environment variables (optionally loaded from repo root .env.local)

Supported env vars:
- TOAST_CLIENT_ID
- TOAST_CLIENT_SECRET
- TOAST_USER_ACCESS_TYPE            (default: TOAST_MACHINE_CLIENT)
- TOAST_RESTAURANT_GUID
- TOAST_BASE_URL                    (default: https://ws-api.toasttab.com)

Optional env vars for your broader system (not used by these scripts today):
- SUPABASE_ANON_KEY
- DEBUG_KEY

Legacy fallback (still supported):
- scripts/toast_api/TOAST_API_HEADERS.json with keys:
  {
    "userAccessType": "TOAST_MACHINE_CLIENT",
    "clientId": "...",
    "clientSecret": "...",
    "restaurantGuid": "...",
    "baseUrl": "https://ws-api.toasttab.com"   // optional
  }
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional, Tuple
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


@dataclass(frozen=True)
class ToastConfig:
    user_access_type: str
    client_id: str
    client_secret: str
    restaurant_guid: str
    base_url: str = "https://ws-api.toasttab.com"


def _parse_env_file(env_path: Path) -> Dict[str, str]:
    """Minimal .env parser."""
    out: Dict[str, str] = {}
    for line in env_path.read_text(encoding="utf-8", errors="replace").splitlines():
        s = line.strip()
        if not s or s.startswith("#") or "=" not in s:
            continue
        k, v = s.split("=", 1)
        k = k.strip()
        v = v.strip()
        if not k:
            continue
        if len(v) >= 2 and ((v[0] == v[-1] == '"') or (v[0] == v[-1] == "'")):
            v = v[1:-1]
        out[k] = v
    return out


def _find_repo_root(start: Path) -> Optional[Path]:
    cur = start.resolve()
    for _ in range(12):
        if (cur / ".git").exists():
            return cur
        if (cur / "supabase" / "config.toml").exists():
            return cur
        if cur.parent == cur:
            break
        cur = cur.parent
    return None


def _maybe_load_dotenv() -> None:
    """Load repo root .env.local into process env (no overwrite)."""
    here = Path(__file__).resolve().parent
    root = _find_repo_root(here)
    if not root:
        return
    env_path = root / ".env.local"
    if not env_path.exists():
        return
    data = _parse_env_file(env_path)
    for k, v in data.items():
        os.environ.setdefault(k, v)


def load_config(path: Path) -> ToastConfig:
    """Load config from env (preferred) with legacy JSON fallback."""
    _maybe_load_dotenv()

    client_id = os.environ.get("TOAST_CLIENT_ID")
    client_secret = os.environ.get("TOAST_CLIENT_SECRET")
    restaurant_guid = os.environ.get("TOAST_RESTAURANT_GUID")
    user_access_type = os.environ.get("TOAST_USER_ACCESS_TYPE") or "TOAST_MACHINE_CLIENT"
    base_url = os.environ.get("TOAST_BASE_URL") or "https://ws-api.toasttab.com"

    if client_id and client_secret and restaurant_guid:
        return ToastConfig(
            user_access_type=user_access_type,
            client_id=client_id,
            client_secret=client_secret,
            restaurant_guid=restaurant_guid,
            base_url=base_url,
        )

    if not path.exists():
        missing = []
        if not client_id:
            missing.append("TOAST_CLIENT_ID")
        if not client_secret:
            missing.append("TOAST_CLIENT_SECRET")
        if not restaurant_guid:
            missing.append("TOAST_RESTAURANT_GUID")
        raise FileNotFoundError(
            f"Missing config file: {path}. Also missing env vars: {', '.join(missing)}"
        )

    data = json.loads(path.read_text(encoding="utf-8"))
    for k in ["userAccessType", "clientId", "clientSecret", "restaurantGuid"]:
        if not data.get(k):
            raise ValueError(f"Missing required field in {path.name}: {k}")

    return ToastConfig(
        user_access_type=data["userAccessType"],
        client_id=data["clientId"],
        client_secret=data["clientSecret"],
        restaurant_guid=data["restaurantGuid"],
        base_url=data.get("baseUrl") or "https://ws-api.toasttab.com",
    )


def toast_dt(dt: datetime) -> str:
    base = dt.strftime("%Y-%m-%dT%H:%M:%S")
    ms = f"{int(dt.microsecond / 1000):03d}"
    tz = dt.strftime("%z")
    return f"{base}.{ms}{tz}"


def _http_json(req: Request, timeout: int = 20) -> Tuple[Optional[Any], Optional[Dict[str, Any]]]:
    try:
        with urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8")
        return json.loads(raw) if raw else None, None
    except HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        return None, {"http": e.code, "reason": str(getattr(e, "reason", "")), "body_prefix": body[:800]}
    except URLError as e:
        return None, {"http": None, "reason": str(e.reason), "body_prefix": ""}


def auth_access_token(cfg: ToastConfig) -> str:
    url = f"{cfg.base_url}/authentication/v1/authentication/login"
    payload = json.dumps(
        {"clientId": cfg.client_id, "clientSecret": cfg.client_secret, "userAccessType": cfg.user_access_type}
    ).encode("utf-8")

    req = Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )

    data, err = _http_json(req)
    if err:
        raise RuntimeError(f"Auth failed: {err}")
    if not isinstance(data, dict):
        raise RuntimeError("Auth returned unexpected response shape (not an object)")

    tok_obj = data.get("token")
    token = None
    if isinstance(tok_obj, dict):
        token = tok_obj.get("accessToken") or tok_obj.get("token")
    elif isinstance(tok_obj, str):
        token = tok_obj

    if not token:
        raise RuntimeError("Auth returned no access token (token.accessToken missing)")
    return token


def orders_headers(token: str, restaurant_guid: str) -> Dict[str, str]:
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "Restaurant-External-Id": restaurant_guid,
        "restaurant-external-id": restaurant_guid,
        "Toast-Restaurant-External-Id": restaurant_guid,
    }
