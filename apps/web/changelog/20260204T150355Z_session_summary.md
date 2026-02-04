---
meta:
  date: 2026-02-04T15:03:55Z
  scope: apps/web
  summary: Restore live letter-spacing preview in type settings.
---

Summary:
- remove dm-title class from preview to avoid !important override
- keep preview styling via inline font styles

Files touched:
- apps/web/app/settings/composites/SettingsView.tsx

Decisions:
- let preview bypass global title CSS variables

Risks and followups:
- none

Commands run:
- date -u +%Y%m%dT%H%M%SZ

Verification:
- not run
