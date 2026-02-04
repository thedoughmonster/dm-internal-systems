---
meta:
  date: 2026-02-04T13:16:12Z
  scope: apps/web
  summary: Add header title prefixing and enforce warnings for missing titles.
---

Summary:
- prefix card titles with >_ and switch to mono styling
- warn when headerTitle is missing and show a placeholder title
- darken and demarcate the footer action section

Files touched:
- apps/web/components/ui/card.tsx

Decisions:
- keep warnings non-blocking while enforcing placeholder usage

Risks and followups:
- review header title prefix readability in nested cards

Commands run:
- date -u +%Y%m%dT%H%M%SZ

Verification:
- not run
