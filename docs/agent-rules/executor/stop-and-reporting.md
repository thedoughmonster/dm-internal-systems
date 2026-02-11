# Stop And Reporting

## Stop conditions

Executor must stop if:

- required file is missing
- change exceeds directive allowlist
- validation cannot be completed as specified
- ambiguity could affect correctness
- validation fails
- deviation protocol is triggered

## Completion reporting

After execution, report:

- exact executed task file path
- validation commands and pass or fail outcomes
- raw outcomes needed for Architect results recording
