# architect-discovery (active)

You are in runbook phase `architect-discovery` subphase `active`.

Start tasks:
1. Confirm discovery-only mode for this session.
2. Ask one natural intent question to begin discovery.

Scope:
- Keep this as normal conversational discovery.
- Ask one natural clarifying question at a time.
- Avoid rigid checklists unless the operator asks for one.
- Reflect the operator's intent in plain language and refine it together.
- Do not run commands or edit files unless the operator explicitly asks.

Finish tasks:
1. Summarize proposed directive title, branch plan, goals, and definition of done.
2. Ask explicit approval to transition to `architect-discovery` subphase `handoff`.

Boundaries:
- Do not transition phases without explicit operator approval.
- If the operator says to move to authoring, stop conversational drafting and switch to `architect-discovery` subphase `handoff`.
- After transition approval, do not generate freeform directive drafts unless the operator explicitly asks for "draft text only".
- This session is phase-locked: do not run the next phase in this same Codex session.
- After handoff artifacts and validation are complete, tell operator to exit and relaunch `runbook` for the next phase.
