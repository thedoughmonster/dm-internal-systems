---
meta:
  date: 2026-02-04T14:46:15Z
  scope: apps/web
  summary: Add Tektur default title font and settings view type controls.
---

Summary:
- set title font variables to Tektur by default and load Tektur in layout
- move title font controls into Settings with a new Type section
- remove the UI kit font sample block

Files touched:
- apps/web/app/layout.tsx
- apps/web/app/globals.css
- apps/web/app/settings/composites/SettingsView.tsx
- apps/web/app/ui-kit/page.tsx

Decisions:
- store title typography as CSS variables updated by settings controls

Risks and followups:
- confirm settings state should persist across reloads
- validate default title weight and spacing with Tektur

Commands run:
- date -u +%Y%m%dT%H%M%SZ

Verification:
- not run
