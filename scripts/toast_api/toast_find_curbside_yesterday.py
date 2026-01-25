#!/usr/bin/env python3
from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.request import Request

from _common import load_config, auth_access_token, orders_headers, toast_dt, _http_json


def list_order_guids(cfg, token: str, start: datetime, end: datetime):
    url = (
        f"{cfg.base_url}/orders/v2/orders"
        f"?restaurantGuid={cfg.restaurant_guid}"
        f"&startDate={toast_dt(start)}"
        f"&endDate={toast_dt(end)}"
    )
    req = Request(url, headers=orders_headers(token, cfg.restaurant_guid), method="GET")
    data, err = _http_json(req)
    if err:
        return None, {"stage": "list", "url": url, **err}
    return data, None


def get_order(cfg, token: str, guid: str):
    url = f"{cfg.base_url}/orders/v2/orders/{guid}"
    req = Request(url, headers=orders_headers(token, cfg.restaurant_guid), method="GET")
    data, err = _http_json(req)
    if err:
        return None, {"stage": "get", "url": url, "guid": guid, **err}
    return data, None


def main() -> int:
    here = Path(__file__).resolve().parent
    cfg = load_config(here / "TOAST_API_HEADERS.json")
    token = auth_access_token(cfg)

    out_dir = here / "snapshots_yesterday"
    out_dir.mkdir(parents=True, exist_ok=True)

    tz = timezone(timedelta(hours=-5))
    today = datetime.now(tz).date()
    yday = today - timedelta(days=1)
    start_day = datetime(yday.year, yday.month, yday.day, 0, 0, 0, tzinfo=tz)
    end_day = start_day + timedelta(days=1)

    errors = []
    guids_all = []

    cur = start_day
    while cur < end_day:
        nxt = min(cur + timedelta(hours=1), end_day)
        guids, err = list_order_guids(cfg, token, cur, nxt)
        if err:
            errors.append(err)
        else:
            if isinstance(guids, list):
                guids_all.extend(guids)
            else:
                errors.append({"stage": "list", "url": "shape", "body_prefix": json.dumps(guids)[:800]})
        cur = nxt

    seen = set()
    guids_all = [g for g in guids_all if not (g in seen or seen.add(g))]

    max_orders = 250
    snap_errors = []
    snapped = []
    for guid in guids_all[:max_orders]:
        order, err = get_order(cfg, token, guid)
        if err:
            snap_errors.append(err)
            continue
        (out_dir / f"{guid}.json").write_text(json.dumps(order, indent=2, sort_keys=True))
        snapped.append(guid)

    (out_dir / "guids.json").write_text(json.dumps(snapped, indent=2))
    (out_dir / "errors.json").write_text(json.dumps(errors + snap_errors, indent=2, sort_keys=True))

    report_lines = [
        f"restaurantGuid: {cfg.restaurant_guid}",
        f"yesterday: {start_day.isoformat()} -> {end_day.isoformat()}",
        f"guids_found: {len(guids_all)}",
        f"snapped: {len(snapped)} (max {max_orders})",
        f"errors: {len(errors) + len(snap_errors)}",
    ]
    (out_dir / "report.txt").write_text("\n".join(report_lines) + "\n")

    print(f"Wrote snapshots to: {out_dir}")
    print(f"Report: {out_dir / 'report.txt'}")
    print(f"Errors: {out_dir / 'errors.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
