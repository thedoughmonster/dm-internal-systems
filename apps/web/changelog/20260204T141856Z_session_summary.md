---
meta:
  date: 2026-02-04T14:18:56Z
  scope: apps/web
  summary: Use Courier New for card header titles.
---

Summary:
- set card header title font family to Courier New

Files touched:
- apps/web/components/ui/card.tsx

Decisions:
- apply explicit font family override for header titles only

Risks and followups:
- confirm Courier New availability across target platforms

Commands run:
- date -u +%Y%m%dT%H%M%SZ

Verification:
- not run
