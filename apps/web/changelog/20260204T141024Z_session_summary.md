---
meta:
  date: 2026-02-04T14:10:24Z
  scope: apps/web
  summary: Add footer placeholder when no card actions are present.
---

Summary:
- always render card footer section with a low profile placeholder when empty

Files touched:
- apps/web/components/ui/card.tsx

Decisions:
- use the >_ No crumbs detected placeholder for empty footer state

Risks and followups:
- verify footer presence is acceptable across cards that previously had no footer

Commands run:
- date -u +%Y%m%dT%H%M%SZ

Verification:
- not run
