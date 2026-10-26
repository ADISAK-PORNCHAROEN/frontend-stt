# 02: Show Progress-Based Remaining Time

**GitHub Issue:** [#20](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/20)

**What to build:** While the current transcription job advances, the owner can see a clearly labeled approximate remaining time that is hidden when the service has not provided enough reliable progress.

**Parent:** [frontend-stt#18](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/18)

**Blocked by:** None (can start immediately).

## Acceptance criteria

- [ ] The workspace estimates remaining time from advancing progress observations for the current job and labels it as approximate.
- [ ] The estimate is hidden while the job is queued, when progress observations are insufficient, and when progress is stalled or unavailable.
- [ ] A new job does not reuse a previous job's progress samples or estimate.
- [ ] Keyboard and screen-reader users can identify the estimate and its approximate status.
- [ ] Unit and browser checks cover visible, hidden, reset, and responsive states using controlled progress fixtures; no live STT service is used.

## Blocked by

- None (can start immediately).
