# 03: Confirm Media Replacement and Clear

**GitHub Issue:** [#21](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/21)

**What to build:** The owner can replace or clear the current media only after confirming the action, while cancelling preserves the existing transcription session and review drafts.

**Parent:** [frontend-stt#18](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/18)

**Blocked by:** None (can start immediately).

## Acceptance criteria

- [ ] Selecting a different media file opens a confirmation dialog after selection and identifies the candidate file by name.
- [ ] Cancelling replacement preserves the current media, job, transcript revisions, and drafts, and leaves the candidate unapplied.
- [ ] Confirming replacement switches to the candidate and resets state belonging to the previous file.
- [ ] Clearing the current file requires confirmation; confirming returns to the initial state and clears that file's session-only review state.
- [ ] Dialogs support keyboard use, visible focus, and a clear way to cancel without data loss.
- [ ] Browser checks cover confirm and cancel paths at desktop and mobile sizes with controlled fixtures.

## Blocked by

- None (can start immediately).
