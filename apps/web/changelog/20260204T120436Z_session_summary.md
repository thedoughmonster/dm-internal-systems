---
meta:
  date: 2026-02-04T12:04:36Z
  scope: apps/web
  summary: Refine Card surface shading and header gradient for closer contrast.
---

Summary:
- soften nested Card surface contrast and reduce header bar height
- tighten header gradient to stay closer to the body shade

Files touched:
- apps/web/components/ui/card.tsx

Decisions:
- reduce surface mix deltas to keep nested cards subtle
- use a small two stop gradient to differentiate the header

Risks and followups:
- validate nested cards in directives view for preferred contrast

Commands run:
- date -u +%Y%m%dT%H%M%SZ

Verification:
- not run
