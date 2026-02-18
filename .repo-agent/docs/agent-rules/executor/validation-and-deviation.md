> Legacy notice: This file belongs to the archived pre-runbook ruleset. It is not authoritative for current sessions. Use `.repo-agent/AGENTS.md`, `docs/repo-rules.md`, and `.runbook/instructions/*.md`.

# Validation And Deviation

## Verification rules

- Do not claim verification unless commands were executed in this repository.
- Run all validation commands defined by task.
- If validation fails, stop immediately and report failure verbatim.
- For collection completion, include evidence that merge to `dev` is non-breaking based on executed validation.

## Remediation rules

- Fix lint and typecheck failures introduced during session work.
- If remediation may exceed directive scope, trigger deviation protocol before proceeding.
- If merge-safety risk remains unresolved for a collection, stop and report block before completion.

## Deviation protocol

When rule conflict is unavoidable, output exactly:

=== ATTENTION - INSTRUCTION DEVIATION REQUIRED ===

Then provide:

- rule or instruction that would be violated
- exact files involved
- reason deviation is required

No further action until explicit operator approval.
