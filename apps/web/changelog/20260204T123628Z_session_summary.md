---
meta:
  date: 2026-02-04T12:36:28Z
  scope: apps/web
  summary: Add Card footer props with terminal-style meta stack and button actions.
---

Summary:
- add footer meta and action props to Card and render a terminal-style stack
- increase header gradient contrast

Files touched:
- apps/web/components/ui/card.tsx

Decisions:
- enforce footer content via props to keep card structure consistent
- warn when footer actions use raw button elements

Risks and followups:
- validate footer layout in directives view once footer props are wired

Commands run:
- date -u +%Y%m%dT%H%M%SZ

Verification:
- not run
