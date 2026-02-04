---
meta:
  date: 2026-02-04T14:17:23Z
  scope: apps/web
  summary: Switch machine mono font to SUSE Mono.
---

Summary:
- replace Share Tech Mono with SUSE Mono for the machine mono variable

Files touched:
- apps/web/app/layout.tsx

Decisions:
- load SUSE Mono weights 400 and 500 for flexibility

Risks and followups:
- verify font loads in next/font/google build

Commands run:
- date -u +%Y%m%dT%H%M%SZ

Verification:
- not run
