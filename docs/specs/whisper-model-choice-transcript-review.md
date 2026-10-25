# Whisper Model Choice and Transcript Review

**GitHub spec:** [frontend-stt#8](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/8)
**Status:** Approved; frontend tickets wait on the architecture and service prerequisites.

## Problem Statement

The transcription workspace lets the owner submit a recording and follow a read-only transcript. The owner needs to choose a Whisper model for a job and correct text by listening to the original recording, without leaving the local workspace.

## Solution

Extend the existing workspace with a Turbo/large-v3 selector and a transcript review panel. Let the owner replay a segment, edit its text, save the review, view the original ASR text, and export the saved transcript. Keep the existing single-job, local-first page flow.

This spec owns product behavior and frontend UI/proxy work. The STT service API, persistence, and worker contract are specified separately in [stt-service#10](https://github.com/ADISAK-PORNCHAROEN/stt-service/issues/10).

## User Stories

1. As the owner, I want to select Turbo or large-v3 before starting a job, so that I can choose the recognition model for the recording.
2. As the owner, I want the initial selection to match the service's configured default, so that the choice reflects how the service will process the job.
3. As the owner, I want to replay audio around a transcript segment, so that I can confirm what was spoken before editing it.
4. As the owner, I want to correct segment text manually, so that I can fix recognition errors without transcribing the whole recording again.
5. As the owner, I want to save all segment edits together, so that one review session produces a consistent transcript.
6. As the owner, I want editing to preserve segment order and times, so that subtitle timing stays stable.
7. As the owner, I want to view the original ASR text, so that I can compare it with my corrections.
8. As the owner, I want exports to use the latest saved edits, so that TXT, SRT, and JSON agree.
9. As the owner, I want unsaved edits to be clear and require saving before export, so that I know which text will be downloaded.
10. As the owner, I want the review to remain in the current browser session, so that the workspace does not become a job archive.

## Implementation Decisions

- Add a per-job selector with Turbo and large-v3. The service reports its configured default; the frontend uses it for the initial selection and sends the choice through the same-origin proxy.
- Keep the browser-to-service boundary same-origin and server-controlled.
- Use the original File held by the current page for segment replay. Start up to 0.5 seconds before the selected segment, play through up to 0.5 seconds after it, then stop.
- Allow manual text edits only. Preserve segment IDs, order, times, and structure. Submit all segment ID/text pairs in one save action.
- Provide a view-original action for the ASR transcript. Normal exports use the latest saved transcript; require a save before exporting unsaved changes.
- Keep the current single-job/session behavior and existing service retention. Do not add job history or persistent browser state.
- Service-side API contracts and implementation decisions belong to stt-service#10 and its child tickets.

## Testing Decisions

- Use the existing Playwright browser journey through the same-origin proxy with a controllable service.
- Verify the service-configured default, both selector choices, model forwarding, bounded segment replay, multiple edits saved together, original viewing, unsaved state, exports after save, responsive layout, and keyboard operation.
- Backend API/SQLite/worker checks and the two real-model Formal Words runs are owned by stt-service#11 and #12; this frontend spec does not claim those checks.

## Out of Scope

- Service API, database migration, model loading, worker behavior, transcript persistence, and export generation.
- Automatic correction suggestions, dataset creation, training, word-level timestamps, or editing segment times.
- Job history, accounts, extended retention, homelab testing, Docker deployment, or public/LAN access.
- Uploading recordings, reference text, or raw evaluation results to GitHub.

## Further Notes

- This product spec extends [frontend-stt#1](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/1) and supersedes its read-only transcript decision for this feature.
- Frontend UI/proxy tickets are [frontend-stt#9](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/9) and [frontend-stt#10](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/10).
- Service implementation is tracked by [stt-service#10](https://github.com/ADISAK-PORNCHAROEN/stt-service/issues/10), [#11: per-job model execution](https://github.com/ADISAK-PORNCHAROEN/stt-service/issues/11), and [#12: saved transcript results](https://github.com/ADISAK-PORNCHAROEN/stt-service/issues/12).
- Frontend #9's architecture prerequisite is satisfied by frontend-stt#6/#7 and its service contract is implemented by stt-service#11. Frontend #10's service contract is implemented by stt-service#12. Keep this parent spec open while the frontend tickets are reviewed and completed.
