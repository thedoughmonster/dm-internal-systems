---
meta:
  date: 2026-02-04T14:26:11Z
  scope: apps/web
  summary: Load retro font candidates via next/font/google.
---

Summary:
- add Space Grotesk, Oxanium, Orbitron, Quantico, Chakra Petch, Michroma, Audiowide, and Share Tech Mono
- attach font variables to the body class list for global availability

Files touched:
- apps/web/app/layout.tsx

Decisions:
- load all candidate fonts for accurate UI kit previews

Risks and followups:
- additional font payloads may impact performance; prune after selection

Commands run:
- date -u +%Y%m%dT%H%M%SZ

Verification:
- not run
