# Changelog Entry

## Session metadata
- Date (UTC): 2026-02-04
- Scope: directives list grouping
- Branch: unknown
- Author: codex

## Summary
- group directive files by session and label groups with parent titles

## Files touched
- `apps/web/app/directives/composites/DirectivesView.tsx`: group entries by session and render session headers

## Decisions
- Use parent README title for session headers, fallback to "Untitled session".
- `MASTER_CHANGELOG.MD` not present in apps/web.

## Risks and followups
- If a session lacks a parent entry, the fallback title is used.

## Commands run
- None

## Verification
- Not run (not requested)
