---
meta:
  date: 2026-02-04T12:57:32Z
  scope: apps/web
  summary: Move card meta into header and make it expandable.
---

Summary:
- replace footer meta with header meta line in Card
- add expandable header to reveal wrapped meta line
- wire directives view to use header meta instead of footer meta

Files touched:
- apps/web/components/ui/card.tsx
- apps/web/app/directives/composites/DirectivesView.tsx

Decisions:
- use native details/summary for tap to expand behavior
- keep footer reserved for action buttons

Risks and followups:
- confirm header expansion behavior across browsers

Commands run:
- date -u +%Y%m%dT%H%M%SZ

Verification:
- not run
