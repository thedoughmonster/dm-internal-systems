---
meta:
  date: 2026-02-04T14:37:06Z
  scope: apps/web
  summary: Render card title prefix in the same typeface as the header.
---

Summary:
- remove muted styling from the >_ prefix so it renders in the title font

Files touched:
- apps/web/components/ui/card.tsx

Decisions:
- keep prefix as plain text within the title

Risks and followups:
- none

Commands run:
- date -u +%Y%m%dT%H%M%SZ

Verification:
- not run
