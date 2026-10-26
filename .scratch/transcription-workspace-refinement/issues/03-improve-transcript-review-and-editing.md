# 03: Improve Transcript Review and Editing

GitHub issue: [frontend-stt#15](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/15).

## Parent

[frontend-stt#12 — Refine Transcription Workspace Interaction and Verification](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/12)

## What to build

Make transcript review reliable while the owner listens: let every read-only segment row replay its passage, keep playback follow from fighting manual scrolling, and support staged corrections that are saved together without losing drafts or exporting stale text.

## Acceptance criteria

- [ ] Clicking or keyboard-activating anywhere on a read-only transcript segment row seeks playback to that segment and highlights the active row.
- [ ] Playback follows the active segment smoothly within the transcript panel. Manual scrolling pauses auto-follow, and a visible Return to Follow action resumes it without moving the page.
- [ ] Only one segment is edited at a time. Saving a row stages its draft; cancelling its active edit discards only that row's current edit and preserves other staged changes.
- [ ] Transcript-level Save sends the complete ordered `{id, text}` set through the existing same-origin API. A successful save updates the latest transcript; a failed save keeps drafts visible, reports the error, and allows retry.
- [ ] The original ASR transcript remains immutable and can be viewed separately from the latest saved transcript.
- [ ] TXT, SRT, and JSON exports use the latest saved transcript and are unavailable while any staged edits remain unsaved or a save is in progress.
- [ ] Keyboard operation and focus remain usable across row playback, edit/cancel/save, original/latest view, retry, and exports; API integration and browser tests use the controlled fixture rather than the live STT service.

## Blocked by

[frontend-stt#14 — Refine Workspace Layout and Reusable UI](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/14)
