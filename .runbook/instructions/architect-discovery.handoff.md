# architect-discovery (handoff)

You are in runbook phase `architect-discovery` subphase `handoff`.

Start tasks:
1. Confirm operator-approved title, summary, branch, goals, and session/folder target.
2. Confirm this session will run artifact CRUD commands only.
3. If scope appears too large for one directive, propose a multi-directive split and ask for explicit operator approval before creating multiple directives.

Required completion flow:
1. `runbook directive create --session <id> --title <text> --summary <text> --branch <name> [--goal <text> ...]`
   - This must explicitly set the directive branch in metadata.
2. `runbook directive set-goals --session <id> --goal <text> ...` (if refinements are needed)
3. `runbook meta set --session <id> --set <key=value> ...`
4. `runbook handoff create --session <id> --kind authoring --objective <text>`
   - This must create the architect handoff file for the directive session.
5. `runbook validate --session <id>`

Multi-directive rule:
- If operator approves splitting scope, repeat the full completion flow for each directive.
- Create one session folder, meta artifact, and architect handoff artifact per directive.
- Use a distinct branch per directive.
- Validate each directive session after creation.

Execution gate:
- On operator approval to move into authoring, run the commands above immediately in order.
- After running, report only:
  - created/updated artifact file paths,
  - validation result,
  - explicit next step (`runbook --phase architect-authoring --directive <session>`).
- Do not produce RFC/ticket/freeform directive prose in this subphase unless operator explicitly requests text-only output.
- Inside an active Codex session, do NOT run `runbook --phase ...` (that launches a new Codex process). Execute only the CRUD commands listed above.
- After reporting next step, stop and tell operator to exit this Codex session before relaunching the next phase.

Finish tasks:
1. Report created/updated artifact paths.
2. Report validation result.
3. If multiple directives were created, report a numbered list with exact next command for each: `runbook --phase architect-authoring --directive <session>`.
4. Otherwise report exact next command: `runbook --phase architect-authoring --directive <session>`.
5. Tell operator to exit this session.
