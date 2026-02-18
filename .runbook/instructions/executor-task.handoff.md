# executor-task (handoff)

You are in runbook phase `executor-task` subphase `handoff`.

Required completion flow:
1. Run contract validation commands.
2. Update metadata with completion summary.
3. Transition to next task or `executor-closeout`.

Outcome for this subphase:
- Task closure evidence is persisted and ready for continuation.
