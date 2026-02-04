---
meta:
  date: 2026-02-04T14:54:06Z
  scope: apps/web
  summary: Align Settings sidebar with the global sidebar paradigm.
---

Summary:
- wire Settings into GlobalSidebarSlot with the sidebar accordion menu
- replace local nav with the shared sidebar menu pattern
- scope title weight selection to available font weights

Files touched:
- apps/web/app/settings/composites/SettingsView.tsx

Decisions:
- keep settings content in the main pane and sidebar items in the global sidebar

Risks and followups:
- confirm desired default section selection for Settings sidebar

Commands run:
- date -u +%Y%m%dT%H%M%SZ

Verification:
- not run
