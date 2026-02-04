---
meta:
  date: 2026-02-04T12:58:13Z
  scope: apps/web
  summary: Guard Card header meta redundancy check when headerTitle is not a string.
---

Summary:
- avoid calling trim on non-string headerTitle values

Files touched:
- apps/web/components/ui/card.tsx

Decisions:
- treat non-string titles as empty for redundancy check

Risks and followups:
- none

Commands run:
- date -u +%Y%m%dT%H%M%SZ

Verification:
- not run
