---
meta:
  date: 2026-02-04T14:20:37Z
  scope: apps/web
  summary: Remove size and weight utilities from card header title.
---

Summary:
- drop text size and font weight classes from card header title

Files touched:
- apps/web/components/ui/card.tsx

Decisions:
- rely on base CardTitle typography with Courier font override

Risks and followups:
- check header size consistency across cards

Commands run:
- date -u +%Y%m%dT%H%M%SZ

Verification:
- not run
