# Internal Activity Loader Notes

Status: deferred note
Scope: internal tools shell behavior

## Goal
Provide one consistent "system busy" indicator across internal tools without replacing per-action button loaders.

## Intended behavior
- Action buttons (Analyze, Confirm, Save) keep inline loaders.
- A single global activity loader appears for background work.
- No page blocking and no modal.
- No duplicate competing spinners.

## Proposed scope
- Internal tools layout only.
- Not applied to public pages.

## Deferred design sketch
- `InternalActivityProvider` context
- API: `beginActivity(label)` and `endActivity(token)`
- Loader visible when active count is greater than zero
- Vendor ingest sniff and confirm register activity

## Deferred because
- UI contract and page compliance first
- Avoid premature cross-page coupling
