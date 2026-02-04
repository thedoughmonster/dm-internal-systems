---
meta:
  date: 2026-02-04T15:12:04Z
  scope: apps/web
  summary: Fix sidebar slot import and resolve lint/typecheck errors.
---

Summary:
- move GlobalSidebarSlot to shared lib to satisfy import boundaries
- add missing component ids and React keys across directives and ingest views
- harden settings weight selection and directives filter handling

Files touched:
- apps/web/lib/global-sidebar-slot.tsx
- apps/web/app/composites/global-sidebar-shell.tsx
- apps/web/app/settings/composites/SettingsView.tsx
- apps/web/app/directives/composites/DirectivesView.tsx
- apps/web/app/directives/composites/DirectivesFiltersPanel.tsx
- apps/web/app/directives/composites/MultiSelectDropdown.tsx
- apps/web/app/(internal)/vendor-ingest/session/[sessionId]/composites/PackVerificationPanel.tsx
- apps/web/app/vendors/ingest/composites/VendorIngestFlow.tsx
- apps/web/app/vendors/ingest/pack-mapping/composites/PackMappingQueueClient.tsx
- apps/web/components/ui/card.tsx

Decisions:
- keep sidebar customization via shared slot while conforming to import rules

Risks and followups:
- verify settings sidebar behavior in the UI

Commands run:
- npm --prefix apps/web run lint
- npm --prefix apps/web run typecheck
- date -u +%Y%m%dT%H%M%SZ

Verification:
- lint and typecheck passed
