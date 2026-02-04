# Changelog Entry

## Session metadata
- Date (UTC): 2026-02-04
- Scope: card component hierarchy
- Branch: unknown
- Author: codex

## Summary
- make Card require a header prop and render the header strip by default
- implement automatic card surface shading for nested cards
- update card usages across the UI to pass required headers

## Files touched
- `apps/web/components/ui/card.tsx`: require header prop and add nested surface variables
- `apps/web/app/directives/composites/DirectivesView.tsx`: update cards to use header prop
- `apps/web/app/settings/composites/SettingsView.tsx`: update cards to use header prop
- `apps/web/app/vendors/page.tsx`: update cards to use header prop
- `apps/web/app/vendors/ingest/composites/VendorIngestFlow.tsx`: update cards to use header prop
- `apps/web/app/vendors/ingest/price-changes/composites/PriceChangesView.tsx`: update cards to use header prop
- `apps/web/app/vendors/ingest/pack-mapping/composites/PackMappingQueueClient.tsx`: update cards to use header prop
- `apps/web/app/vendors/ingest/sessions/[session_id]/SessionDetails.tsx`: update cards to use header prop
- `apps/web/app/vendors/ingest/sessions/composites/VendorIngestSessionsView.tsx`: update cards to use header prop
- `apps/web/app/(internal)/vendor-ingest/session/[sessionId]/composites/PackVerificationPanel.tsx`: update cards to use header prop
- `apps/web/app/ui-kit/page.tsx`: update cards to use header prop

## Decisions
- Use a nested surface CSS variable to lighten child cards automatically.
- Render CardHeader inside Card to enforce consistent header strip styling.
- `MASTER_CHANGELOG.MD` not present in apps/web.

## Risks and followups
- Cards with custom background classes will be overridden by the new surface styling.

## Commands run
- None

## Verification
- Not run (not requested)
