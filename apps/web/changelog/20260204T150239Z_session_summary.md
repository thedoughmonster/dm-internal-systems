---
meta:
  date: 2026-02-04T15:02:39Z
  scope: apps/web
  summary: Ensure title letter spacing overrides tracking utilities.
---

Summary:
- force title letter spacing to respect the adjustable variable

Files touched:
- apps/web/app/globals.css

Decisions:
- use !important to override tracking utilities on titles

Risks and followups:
- confirm no unintended overrides on non-title text

Commands run:
- date -u +%Y%m%dT%H%M%SZ

Verification:
- not run
