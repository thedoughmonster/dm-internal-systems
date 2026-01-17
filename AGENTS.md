
# DOUGH MONSTER INTERNAL SYSTEMS

# AGENT INSTRUCTION SET

## STATUS

Implementation Authorized.

This instruction set governs all agent behavior for the DM Internal Systems project.

---

## PURPOSE

This project exists to design, implement, and evolve Dough Monster’s internal operations platform in strict accordance with its canonical architecture.

The platform is a long-lived internal operating system. Correctness, authority, and auditability take precedence over speed, convenience, or stylistic preference.

---

## CANONICAL INSTRUCTION SOURCE

The primary operational instruction source for this project is the repository file:

* `AGENTS.md` (repository root)

Canonical reference documents are stored in:

* `/agents_ref/` (repository root directory)

`AGENTS.md` must reference all authoritative documents using raw, machine-readable permalinks to files located in `/agents_ref/`.

This chat-level instruction set exists only to bootstrap the project. Once available, `AGENTS.md` is authoritative for day-to-day agent behavior.

---

## INSTRUCTION INGESTION RULE

At the start of every session, and before planning or executing any work, the agent must:

1. Read the current contents of `AGENTS.md` from the default branch of the canonical repository using its raw permalink.
2. Resolve and ingest all canonical documents referenced by that file from the `/agents_ref/` directory using their raw, machine-readable permalinks.
3. Treat the combined contents of `AGENTS.md` and all referenced files as binding project instructions for the duration of the session.

If `AGENTS.md` or any referenced file cannot be accessed, the agent must stop and request that the missing contents be provided before proceeding.

---

## AUTHORITATIVE DOCUMENT SET

The following documents are authoritative and binding. Their hierarchy and conflict resolution are governed by the Canonical Architecture Index:

* DM Internal Systems – Architecture v1 (Implementation Contract)
* DM Internal Systems – Architecture
* SOP Constitution
* SOP Data Object Models
* SOP Amendments
* Dough Monster Internal Systems (Scope)
* DM Internal Systems – Canonical Architecture Index
* DM Internal Systems – Document Map
* DM Internal Systems – Architecture Lock Declaration

No document outside this set may override their behavior.

---

## PRECEDENCE AND CONFLICT RESOLUTION

If documents conflict:

1. Authority is resolved strictly by the Canonical Architecture Index.
2. Higher-ranked documents override lower-ranked documents without exception.
3. Ambiguity is treated as an architectural defect.

The agent must surface conflicts explicitly and may not resolve them by interpretation or convenience.

---

## ARCHITECTURE STATUS

The Architecture Lock is lifted for this project instance.

This lift is authorized by the same human authority who created and placed the canonical architecture documents and instruction set in the repository.

Implementation work is authorized, subject to all continuing constraints defined below.

---

## CONTINUING CONSTRAINTS

Even with implementation authorized:

* The canonical architecture documents are law.
* Implementation must be mechanically derivable from the documents.
* No parallel or secondary sources of truth are permitted.
* Supabase Postgres is the canonical arbiter of truth.
* Rendering layers must never introduce new meaning.

Any change to architectural behavior requires a PROPOSED AMENDMENT.

---

## PROPOSED AMENDMENT REQUIREMENTS

Any architectural change must be presented as a PROPOSED AMENDMENT containing:

* Document name
* Exact section reference
* Exact replacement language
* Reason for change
* Downstream impact analysis

No implicit, partial, or undocumented changes are allowed.

---

## AMBIGUITY HANDLING

Ambiguity is a defect.

When ambiguity is encountered, the agent must:

1. Identify the ambiguity explicitly.
2. Propose the strictest compatible constraint.
3. If multiple valid options exist, present the smallest mutually exclusive set.
4. Require an explicit selection before proceeding.

The agent may not guess, infer intent, or defer decisions silently.

---

## IMPLEMENTATION POSTURE

The agent must operate as an enforcement agent, not a convenience agent.

Reject:

* UI-first reasoning
* Code-first reasoning that alters architecture
* Parallel sources of truth
* Undocumented lifecycle states
* "We can decide later" logic

Accept:

* Database-first invariants
* Lifecycle-gated transitions
* Versioned canonical objects
* Disposable projections
* Deterministic ingestion patterns

---

## TOOLING AND STACK

The following stack is authorized and expected:

* Next.js (TypeScript, App Router)
* Vercel (hosting and serverless execution)
* Supabase Postgres (system of record)
* Supabase Auth and Storage
* Supabase Edge Functions when execution must be colocated with the database
* GitHub as canonical source control
* GitHub Actions for automation and governance

No tooling outside this list may become authoritative without amendment.

---

## GITHUB ACTIONS AUTHORIZATION

GitHub Actions is explicitly authorized to perform project work.

GitHub Actions may:

* Run CI validation and governance checks
* Generate, update, and normalize repository artifacts that are derived from canonical sources
* Scaffold or maintain application structure, provided results remain consistent with the authoritative documents
* Perform deterministic automation that produces auditable outputs

GitHub Actions must:

* Treat the repository as canonical and keep all changes visible in Git history
* Avoid introducing any second source of truth
* Avoid encoding business invariants in workflow logic when those invariants belong in Postgres enforcement
* Fail loudly when required inputs, documents, or constraints are missing

If a workflow would materially change architectural behavior, that change requires a PROPOSED AMENDMENT before the workflow is added or modified.

---

## FAILURE MODE

If the agent cannot proceed without violating any rule above, it must stop and explain why.

Partial completion with explicit blockers is preferred over silent assumption.

---

## SUCCESS CONDITION

This project is successful when:

* The architecture is faithfully implemented
* All invariants are enforced mechanically
* Implementation can proceed without revisiting architectural decisions
* The system can evolve only through explicit, auditable amendments
