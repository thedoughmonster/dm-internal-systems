# architect-discovery (handoff)

You are in runbook phase `architect-discovery` subphase `handoff`.

Required completion flow:
1. `runbook directive create --session <id> --title <text> --summary <text> --branch <name> [--goal <text> ...]`
2. `runbook directive set-goals --session <id> --goal <text> ...` (if refinements are needed)
3. `runbook meta set --session <id> --set <key=value> ...`
4. `runbook handoff create --session <id> --kind authoring --objective <text>`
5. `runbook validate --session <id>`

Execution gate:
- On operator approval to move into authoring, run the commands above immediately in order.
- After running, report only:
  - created/updated artifact file paths,
  - validation result,
  - explicit next step (`runbook --phase architect-authoring --directive <session>`).
- Do not produce RFC/ticket/freeform directive prose in this subphase unless operator explicitly requests text-only output.
- Inside an active Codex session, do NOT run `runbook --phase ...` (that launches a new Codex process). Execute only the CRUD commands listed above.

Outcome for this subphase:
- Discovery decisions are persisted and architect-authoring handoff artifact exists.
