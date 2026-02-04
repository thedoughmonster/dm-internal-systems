---
meta:
  date: 2026-02-04T12:40:09Z
  scope: apps/web
  summary: Wire Card footer meta/actions into directives view cards.
---

Summary:
- add terminal meta stacks to directives session and entry cards
- move directive actions into Card footer actions

Files touched:
- apps/web/app/directives/composites/DirectivesView.tsx

Decisions:
- keep directive summary in CardContent and machine info in footer meta

Risks and followups:
- verify footer layout and card spacing in the directives UI

Commands run:
- date -u +%Y%m%dT%H%M%SZ

Verification:
- not run
