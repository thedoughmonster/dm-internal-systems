Date (UTC): 2026-02-01T10:46:05Z
Scope: Repo root and docs agent SOP

Summary of intent
- Update agent documentation to encode the standard operating procedure for `.dm` directives, clean working tree default, and post-run review loop.

Files created or modified by this run
- Modified: `AGENTS.md`
- Modified: `docs/AGENT_RULES_ARCHITECT_V1.MD`
- Modified: `docs/AGENT_RULES_EXECUTOR_V1.MD`
- Created: `changelog/20260201T104605Z_session_summary.md`

Decisions made
- Treat `~/src/.dm/<session>/directives/` as the executable source of truth for Executor work.
- Make the clean working tree expectation explicit at the repo charter and Executor rules levels.
- Add an explicit Architect post-run review loop, with follow-up directives written in the same session folder.

Validation performed
- `git status --porcelain=v1 -b`
- `git rev-parse --abbrev-ref HEAD`
- `git log -n 1 --oneline`
- `npm --prefix apps/web run lint`
- `npm --prefix apps/web run typecheck`

Notes on constraints respected
- No em dash characters were introduced.
- No secrets were printed.
- Changes were kept minimal and limited to the directive allowlists.
