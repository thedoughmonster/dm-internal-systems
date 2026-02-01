Date (UTC): 2026-02-01T10:46:05Z
Scope: apps/web agent guidance SOP alignment

Summary of intent
- Align UI agent guidance with the `.dm` session folder workflow and correct the vendor ingest AGENTS rule text.

Files created or modified by this run
- Modified: `apps/web/AGENTS.md`
- Modified: `apps/web/app/vendors/ingest/AGENTS.md`
- Created: `apps/web/changelog/20260201T104605Z_session_summary.md`

Decisions made
- Document the `.dm` session workflow in UI scope so directive and TODO locations are explicit.
- Replace the vendor ingest line that incorrectly referenced "one file per Codex run" with "one `.dm` task directory per Codex run" while leaving all other rules unchanged.

Validation performed
- `npm --prefix apps/web run lint`
- `npm --prefix apps/web run typecheck`

Notes on constraints respected
- No em dash characters were introduced.
- No secrets were printed.
- Changes were kept minimal and limited to the directive allowlists.
