---
meta:
  date: 2026-02-04T14:59:26Z
  scope: apps/web
  summary: Harden type apply behavior to use resolved font variables.
---

Summary:
- apply title font variables using computed font family values
- set title variables on both document root and body

Files touched:
- apps/web/app/settings/composites/SettingsView.tsx

Decisions:
- use computed font family to avoid unresolved CSS variable chains

Risks and followups:
- confirm apply behavior across browsers

Commands run:
- date -u +%Y%m%dT%H%M%SZ

Verification:
- not run
