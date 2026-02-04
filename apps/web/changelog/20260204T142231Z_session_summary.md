---
meta:
  date: 2026-02-04T14:22:31Z
  scope: apps/web
  summary: Update card header title size to 15px.
---

Summary:
- set header title font size explicitly to 15px

Files touched:
- apps/web/components/ui/card.tsx

Decisions:
- use inline style to hit exact size requirement

Risks and followups:
- verify title sizing alongside other typography

Commands run:
- date -u +%Y%m%dT%H%M%SZ

Verification:
- not run
