---
meta:
  date: 2026-02-04T14:57:12Z
  scope: apps/web
  summary: Fix type preview to reflect un-applied settings.
---

Summary:
- apply selected font family directly in the type preview block

Files touched:
- apps/web/app/settings/composites/SettingsView.tsx

Decisions:
- keep preview independent of applied CSS variable values

Risks and followups:
- none

Commands run:
- date -u +%Y%m%dT%H%M%SZ

Verification:
- not run
