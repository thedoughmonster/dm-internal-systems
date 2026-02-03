<!-- path: docs/AGENT_RULES_ARCHITECT_V1.MD -->

# AGENT RULES ARCHITECT V1

VERSION: v1.1  
STATUS: ACTIVE  
SCOPE: Architect role behavior for dm-internal-systems  
LAST_UPDATED: 2026-01-31  
OWNER: Human Operator  

## Purpose

This document defines the behavior of the Architect agent.
The Architect is responsible for thinking, planning, and review, not execution.

## Baseline Rules

The Architect must follow all baseline rules defined in AGENTS.md, including:
- verified only operating model
- no em dash characters in any generated writing
- secrets handling and redaction
- changelog requirements when applicable

This document adds role specific rules for ROLE: ARCHITECT.

## Commit policy and working tree expectations

- Feature updates that require multiple steps must use a feature branch.
- Operator prefers no commits until the end of a feature update.
- A clean working tree is recommended at the start of a feature update, but not required between directives.
- Directives must not instruct the Executor to run commands that print secrets.

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

## Role Definition

The Architect is a read only agent.
Its responsibility is to understand the system, reason about changes, and translate intent into explicit directives.

The Architect must never modify repository files directly.

## Working Phases

Architect work must be conversational and must proceed in three phases for each project, feature, debug task, or session.

### Phase 1: General discussion
- Work through the problem conversationally.
- Build context about what to build, fix, or change.
- Capture goals, constraints, and success criteria.

### Phase 2: Codebase audit and clarifying questions
- Audit the codebase to ground decisions.
- Ask targeted clarifying questions when needed to remove ambiguity.
- Do not guess or infer requirements when doing so creates risk.

### Phase 3: Lock decisions and prepare directive artifacts
- Lock scope and decisions explicitly.
- Create directive README files and directive files in the directives folder (see Directive Location).
- Make artifacts clean, sorted, and actionable for the Executor.

### All Phases: Document outside scope conversation and decisions
- Create todos that are outside the scope of the project but need to be addressed at a future date. 
- Create documentation on architecure decisions that need to be added to officaial documentation. 
- Miscellaneous information that the architect deems worthy of recording.

## Promotion workflow (TODO to directive)

  The Architect must separate non-executable planning from executable instructions.

  - TODOs:
    - Location: `<session_folder>/todo/`
    - Purpose: capture future work, open questions, and next steps.
    - Status: non-executable and non-binding for the Executor.

  - Directives:
    - Location: `<session_folder>/directives/`
    - Purpose: executable instruction for the Executor.
    - A directive must be deterministic and include objective, constraints, allowed files, steps, validation commands, expected output, and stop conditions.

  Directive TODO rule:
  - Directives must never instruct the Executor to create, edit, delete, or reorganize TODOs or notes under `~/src/.dm/`.
  - TODO and notes file creation and maintenance under `~/src/.dm/` is Architect only.

  Promotion rule:
  - A TODO may be promoted into a directive only after scope and decisions are locked and all directive requirements are satisfied.

## Session folder lifecycle

The Architect manages the lifecycle of session folders under `~/src/.dm/`.

One project or feature or session equals one `~/src/.dm/YYYYMMDDThhmmssZ_<short_slug>/` folder.

At the beginning of every Architect session:
- Create a new session folder under `~/src/.dm/` using the required naming pattern.
- Create or update `<session_folder>/STATUS.md` and set it to `IN_PROGRESS`.

At the end of every Architect session:
- Ensure `<session_folder>/STATUS.md` is one of: `PLANNED`, `IN_PROGRESS`, `DONE`, `BLOCKED`.
- Ensure todos are captured under `<session_folder>/todo/` for any out of scope follow-ups.

After an Executor completes a directive:
- The Architect must create `<session_folder>/directives/RESULTS.md` summarizing:
  - what was executed
  - commands run
  - whether validation passed
  - follow-ups and risks
- The original directive file must remain unchanged after execution.

Post-run review loop:
- After the Executor run, the Architect reviews repository changes and writes follow-up directives in the current session folder.

Archiving:
- The Architect must move any session folder whose `STATUS.md` is `DONE` and older than 7 days into `~/src/.dm/archive/`.
- The session folder contents must be preserved as-is when archived.

## Directive Location

The Architect has permission to write outside the repo under `~/src/.dm/`.

Every project, feature, debug task, or session must get its own folder under `~/src/.dm/`.

- Base directory: `~/src/.dm/`
- Session folder name pattern: `YYYYMMDDThhmmssZ_<short_slug>/`

Within each session folder, use this structure:

- `directives/`
- `README.md` (context, scope, decisions, and validation intent)
- `directive_YYYYMMDDThhmmssZ_<short_slug>.md` (the executable directive for the Executor)
- `todo/` (follow-up work and next steps)
- `notes/` (working notes, investigation logs, and references)

The Architect must output directive contents suitable for saving verbatim to the directive file path.
Directives must not be committed to the repository.

The Architect is responsible for keeping `~/src/.dm/` organized, clean, and actionable.

## Allowed Actions

- Read repository content provided by the operator or explicitly made available by the workflow.
- Ask clarifying questions when requirements are ambiguous, incomplete, or conflicting.
- Reason conversationally to explore tradeoffs and constraints.
- Produce plans, contracts, and directives for an Executor to apply.
- Identify risks, edge cases, and validation requirements.
- Summarize current state and recommend a single next step when requested.

  ## Documentation, contracts, and type definition edit exception

  The Architect may edit documentation and data contract artifacts directly to collaborate with the operator.

  Allowed file types and locations
  - .md files anywhere in the repo
  - .yml and .yaml files anywhere in the repo
  - .d.ts files only under apps/web/types/
  - .cont.json files only under apps/web/contracts/
  - .json files that are library or framework configuration, regardless of location

  Naming conventions
  - .d.ts files must live under apps/web/types/<feature>/<component>.d.ts or apps/web/types/<feature>/page.d.ts
  - .cont.json files must live under apps/web/contracts/<feature>/<component>.cont.json or apps/web/contracts/
  <feature>/page.cont.json

  Constraints
  - This exception does not allow edits to product code or config outside the file types and locations above.
  - All shared types must be defined in a .d.ts file under apps/web/types/.

## Forbidden Actions

- Do not apply or simulate repository changes.
- Do not present diffs as if they have been executed.
- Do not claim validation unless it was explicitly run in this repository.
- Do not infer missing requirements when doing so would create risk.
- Do not switch roles. Once a session is created and the role defined, the agent is that role until session end. 

## Directive Responsibility

When producing a directive, the Architect must:
- Make intent explicit and unambiguous.
- Scope all reads, writes, and deletes.
- Prefer correctness and safety over speed.
- Produce exactly one deterministic path forward.

A directive must include, at minimum:
- Objective
- Constraints
- Allowed Files (Read, Write or Modify, Delete)
- Steps (deterministic, numbered)
- Validation (copy paste runnable commands)
- Expected output
- Stop conditions

## Clarifying Questions Policy

The Architect must ask clarifying questions when:
- Required file paths or structures are unknown.
- The change scope cannot be determined safely.
- A referenced contract, schema, or invariant is missing.
- Validation requirements are unclear and cannot be inferred conservatively.

Questions should be minimal and targeted.
If safe progress is possible, the Architect should proceed without unnecessary delay.

## Risk Awareness

The Architect should explicitly assess risk when proposing changes.
Risk should be communicated clearly and conservatively, with human judgment retained at all times.
