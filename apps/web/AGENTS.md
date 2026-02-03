
```md
<!-- apps/web/AGENTS.md -->

# Agents rules for UI work

## Repo reference
See `REPO_LINK.md` for the canonical repository URL and access guidance.

## Docs guidance
- Documentation governance and policy live at repo root.

## Session workflow

- Each Codex run uses one session folder under `~/src/.dm/YYYYMMDDThhmmssZ_<short_slug>/`.
- Executable directives live under `<session_folder>/directives/`.
- TODOs live under `<session_folder>/todo/` and are non-binding context only.

## Commit policy

- Feature updates that require multiple steps must use a feature branch.
- Operator prefers no commits until the end of a feature update.
- A clean working tree is recommended at the start of a feature update, but not required between directives.
- Executor may proceed with an uncommitted working tree during a feature update, as long as changes stay within directive allowlists.

## Changelog requirement
- Every agent session that modifies any file under `apps/web` must add exactly one new entry under `apps/web/changelog/`.
- Filename convention: `apps/web/changelog/YYYYMMDDThhmmssZ_session_summary.md`.
- Required fields: Date (UTC) and scope, summary of intent, files created or modified by this run, decisions made, validation performed, notes on constraints respected.
- Changelog entries are required even for documentation only changes.

## Component placement paradigm

- `apps/web/components/ui/*`
  - shadcn primitives only
  - no app specific logic
  - no imports from `apps/web/app/*`

- `apps/web/components/ui/dm/*`
  - DM reusable primitives built by wiring shadcn components together
  - must be reusable
  - must not import from `apps/web/app/*`
  - should stay domain neutral and be driven by props

- `apps/web/app/**/composites/*`
  - page scoped composites that wire primitives together into a feature flow
  - composites are allowed to call feature APIs and coordinate state
  - composites directories are only ever siblings of the file that uses them
  - do not create `components/` folders as siblings to pages
  - do not promote a composite unless it can be named generically and reused

## Page structure rule

- `page.tsx` should be minimal.
- Prefer rendering a single composite component, for example:
  - `return <VendorIngestFlow />;`

## UI primitive usage rule

- Forms must use components from `apps/web/components/ui/*` for inputs, selects, textareas, and buttons.
- Do not use plain HTML `input`, `select`, `textarea`, or `button` elements.

## UI behavior rules

- Buttons must not shift position based on state.
- If an action is unavailable, keep the button in place and disable it.
- JSON buttons must be labeled by payload:
  - Analyze JSON
  - Confirm JSON
  - Audit JSON (if applicable)

## Style guides and constraints
- read the `ui_style_contract.json` and `ui_style_contract.md` adhere to principles therein

## QOL exception: agent guidance edits

Agent guidance files may be updated without adding repository changelog entries.

This exception is strictly limited to these files:
- `AGENTS.md`
- `apps/web/AGENTS.md`
- `docs/AGENT_RULES_ARCHITECT_V1.MD`
- `docs/AGENT_RULES_EXECUTOR_V1.MD`

Constraints:
- This exception is for quality of life edits only (clarity, formatting, and process wording).
- It must not be used for product code, migrations, workflows, or behavior changes.
- Every use of this exception must be recorded in the current session folder under `~/src/.dm/<session>/notes/` with date and a short summary of what changed.
