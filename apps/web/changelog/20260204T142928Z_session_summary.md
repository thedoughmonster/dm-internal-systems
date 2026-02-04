---
meta:
  date: 2026-02-04T14:29:28Z
  scope: apps/web
  summary: Show available weights per font in UI kit type accordion.
---

Summary:
- list loaded weights under each font family in the type samples accordion

Files touched:
- apps/web/app/ui-kit/page.tsx

Decisions:
- reflect only weights that are currently loaded via next/font/google

Risks and followups:
- update weights if font imports change

Commands run:
- date -u +%Y%m%dT%H%M%SZ

Verification:
- not run
