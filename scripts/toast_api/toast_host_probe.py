#!/usr/bin/env python3
from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.request import Request

from _common import load_config, auth_access_token, orders_headers, toast_dt, _http_json


def main() -> int:
    here = Path(__file__).resolve().parent
    cfg = load_config(here / "TOAST_API_HEADERS.json")
    token = auth_access_token(cfg)

    tz = timezone(timedelta(hours=-5))
    end = datetime.now(tz)
    start = end - timedelta(minutes=30)

    url = (
        f"{cfg.base_url}/orders/v2/orders"
        f"?restaurantGuid={cfg.restaurant_guid}"
        f"&startDate={toast_dt(start)}"
        f"&endDate={toast_dt(end)}"
    )

    headers = orders_headers(token, cfg.restaurant_guid)

    debug = {
        "url": url,
        "header_keys": sorted(headers.keys()),
        "restaurant_guid_len": len(cfg.restaurant_guid),
        "restaurant_guid_prefix": cfg.restaurant_guid[:8],
        "auth_prefix": "Bearer " + token[:10] + "...",
    }
    print("DEBUG", json.dumps(debug))

    req = Request(url, headers=headers, method="GET")
    data, err = _http_json(req)
    if err:
        print("ERR", json.dumps(err))
        return 1

    raw = json.dumps(data)
    print("OK body_prefix", raw[:300])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
