Toast API mini-kit (no deps)

This kit can be configured two ways.

Preferred: environment variables (optionally loaded from repo root .env.local)
- TOAST_CLIENT_ID
- TOAST_CLIENT_SECRET
- TOAST_USER_ACCESS_TYPE (default: TOAST_MACHINE_CLIENT)
- TOAST_RESTAURANT_GUID
- TOAST_BASE_URL (default: https://ws-api.toasttab.com)

Legacy fallback: ops_tooling/scripts/toast_api/TOAST_API_HEADERS.json (do not commit)
{
  "userAccessType": "TOAST_MACHINE_CLIENT",
  "clientId": "...",
  "clientSecret": "...",
  "restaurantGuid": "...",
  "baseUrl": "https://ws-api.toasttab.com"
}

Quick start:
1) Put your Toast keys in repo root .env.local:
   TOAST_CLIENT_ID=...
   TOAST_CLIENT_SECRET=...
   TOAST_USER_ACCESS_TYPE=TOAST_MACHINE_CLIENT
   TOAST_RESTAURANT_GUID=...
   TOAST_BASE_URL=https://ws-api.toasttab.com

2) Probe connectivity:
   python ops_tooling/scripts/toast_api/toast_host_probe.py

3) Pull snapshots for yesterday:
   python ops_tooling/scripts/toast_api/toast_find_curbside_yesterday.py

4) Inspect shape of one snapshot:
   python ops_tooling/scripts/toast_api/toast_order_shape.py ops_tooling/scripts/toast_api/snapshots_yesterday/<GUID>.json > ops_tooling/scripts/toast_api/snapshots_yesterday/order_shape.txt
