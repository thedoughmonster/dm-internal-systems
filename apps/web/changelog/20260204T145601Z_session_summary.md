---
meta:
  date: 2026-02-04T14:56:01Z
  scope: apps/web
  summary: Apply title type settings only on user action.
---

Summary:
- add apply button for title type settings instead of auto applying on change

Files touched:
- apps/web/app/settings/composites/SettingsView.tsx

Decisions:
- show a brief status message after applying type settings

Risks and followups:
- consider persisting type settings across reloads

Commands run:
- date -u +%Y%m%dT%H%M%SZ

Verification:
- not run
