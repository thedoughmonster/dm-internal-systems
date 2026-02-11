# Validation And Deviation

## Verification rules

- Do not claim verification unless commands were executed in this repository.
- Run all validation commands defined by task.
- If validation fails, stop immediately and report failure verbatim.

## Remediation rules

- Fix lint and typecheck failures introduced during session work.
- If remediation may exceed directive scope, trigger deviation protocol before proceeding.

## Deviation protocol

When rule conflict is unavoidable, output exactly:

=== ATTENTION - INSTRUCTION DEVIATION REQUIRED ===

Then provide:

- rule or instruction that would be violated
- exact files involved
- reason deviation is required

No further action until explicit operator approval.
