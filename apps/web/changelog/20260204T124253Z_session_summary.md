---
meta:
  date: 2026-02-04T12:42:53Z
  scope: apps/web
  summary: Make Card terminal footer widget low profile with tighter spacing.
---

Summary:
- switch footer meta widget to inline sizing and reduce padding
- tighten line height and spacing for terminal meta entries
- darken terminal widget surface

Files touched:
- apps/web/components/ui/card.tsx

Decisions:
- use inline-flex and reduced padding for compact layout

Risks and followups:
- confirm footer meta readability in nested cards

Commands run:
- date -u +%Y%m%dT%H%M%SZ

Verification:
- not run
