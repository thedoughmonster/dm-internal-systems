# architect-discovery (handoff)

You are in runbook phase `architect-discovery` subphase `handoff`.

Required completion flow:
1. `runbook directive create --session <id> --title <text> --summary <text> --branch <name> [--goal <text> ...]`
   - This must explicitly set the directive branch in metadata.
2. `runbook directive set-goals --session <id> --goal <text> ...` (if refinements are needed)
3. `runbook meta set --session <id> --set <key=value> ...`
4. `runbook handoff create --session <id> --kind authoring --objective <text>`
   - This must create the architect handoff file for the directive session.
5. `runbook validate --session <id>`

Execution gate:
- On operator approval to move into authoring, run the commands above immediately in order.
- After running, report only:
  - created/updated artifact file paths,
  - validation result,
  - explicit next step (`runbook --phase architect-authoring --directive <session>`).
- Do not produce RFC/ticket/freeform directive prose in this subphase unless operator explicitly requests text-only output.
- Inside an active Codex session, do NOT run `runbook --phase ...` (that launches a new Codex process). Execute only the CRUD commands listed above.
- After reporting next step, stop and tell operator to exit this Codex session before relaunching the next phase.

Outcome for this subphase:
- Discovery decisions are persisted.
- Directive artifact exists with explicit branch metadata.
- Architect-authoring handoff artifact exists.
