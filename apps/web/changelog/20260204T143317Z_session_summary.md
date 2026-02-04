---
meta:
  date: 2026-02-04T14:33:17Z
  scope: apps/web
  summary: Apply Share Tech Mono to title typography across the app.
---

Summary:
- add dm-title utility and apply it to heading tags and title components
- update card title styles to use the shared title font

Files touched:
- apps/web/app/globals.css
- apps/web/components/ui/card.tsx
- apps/web/components/ui/dialog.tsx
- apps/web/components/ui/drawer.tsx
- apps/web/components/ui/sheet.tsx
- apps/web/components/ui/alert-dialog.tsx
- apps/web/components/ui/alert.tsx
- apps/web/components/ui/field.tsx
- apps/web/components/ui/item.tsx
- apps/web/components/ui/empty.tsx

Decisions:
- use the Share Tech Mono variable for all title fonts

Risks and followups:
- check any titles rendered as plain divs without dm-title or heading tags

Commands run:
- date -u +%Y%m%dT%H%M%SZ

Verification:
- not run
