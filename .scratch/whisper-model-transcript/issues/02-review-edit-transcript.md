# 02 — Review and Edit Saved Transcripts

**GitHub ticket:** [frontend-stt#10](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/10)
**Status:** Blocked
**Ready for agent:** No — waiting for frontend-stt#5 and stt-service#12.

## Parent

[Whisper Model Choice and Transcript Review](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/8)

## Service prerequisite

[stt-service#12: Save and Export a Reviewed Transcript](https://github.com/ADISAK-PORNCHAROEN/stt-service/issues/12)

## What to build

Extend the transcript panel and local media player so the owner can replay a segment, edit text, save the review, view original ASR text, and export the latest saved result. Keep transcript persistence and result-format behavior in stt-service#12.

## Acceptance criteria

- [ ] For a successful job, replay a segment from up to 0.5 seconds before through up to 0.5 seconds after it, then stop. Use the original file held in the current browser session.
- [ ] Allow manual text edits for existing segments only; preserve segment IDs, order, times, and structure in the UI.
- [ ] Save all edited segment IDs/text in one request through the same-origin proxy. A failed save keeps the user's unsaved edits visible.
- [ ] Provide a “view original” action for the immutable ASR transcript.
- [ ] Normal JSON, TXT, and SRT downloads reflect saved edits. Disable or require saving before export when edits are unsaved.
- [ ] Keep editing available only in the current page session; add no job-history UI or retention extension.
- [ ] Playwright verifies bounded playback, editing multiple segments and saving once, original viewing, unsaved state, saved exports, keyboard use, and responsive layout.

## Blocked by

- [frontend-stt#5 Transcription Frontend Architecture and Reuse](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/5) — finish the active frontend architecture work first.
- [stt-service#12 Save and Export a Reviewed Transcript](https://github.com/ADISAK-PORNCHAROEN/stt-service/issues/12) — the service must support saved/original transcript results first.
