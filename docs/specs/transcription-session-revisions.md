# Session-Scoped Transcript Revisions, Previews, and Workspace Guidance

Canonical GitHub issue: [frontend-stt#18](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/18).

## Problem Statement

The transcription workspace can review and save a transcript, but it does not yet offer clear session-only drafts, a way to compare and download each revision, or a preview of export formats before downloading. The model selector and start action are separated in the file review state, transcription progress gives no useful estimate of remaining time, and replacing or clearing a selected file can discard in-session work without confirmation.

## Solution

Extend the current Time Atlas workspace without changing its approved visual direction. Keep the model selector and start action together, use the available viewport, and show a clearly labeled approximate remaining time only when the current job's progress supports an estimate. Let the owner keep the immutable original transcript, create review drafts, commit a chosen revision as the latest reviewed transcript, preview JSON/TXT/SRT, and download the selected revision. Confirm file replacement and clearing while preserving the current session if the owner cancels.

## User Stories

1. As the owner, I want the model selector and start action in one row, so I can review the transcription choice and begin without scanning separate areas.
2. As the owner, I want the workspace to fill the available viewport edge to edge without a max-width container, so the review controls and transcript fit comfortably on screen.
3. As the owner, I want the header and footer anchored to the viewport and the page itself not to scroll, so the workspace remains in one view; after transcription, only the transcript list scrolls.
4. As the owner, I want a clearly labeled approximate remaining time while a job is making measurable progress, so I can plan around the transcription.
5. As the owner, I want the remaining-time estimate hidden while a job is queued, has too few progress observations, or has stopped advancing, so an unreliable number is not presented as fact.
6. As the owner, I want the original ASR transcript to remain unchanged, so I can always compare later revisions with the first result.
7. As the owner, I want each “Save as draft” action to create a separate transcript revision, so I can preserve review checkpoints without replacing the latest reviewed transcript.
8. As the owner, I want to commit the selected revision as the latest reviewed transcript, so the service's latest result reflects the version I chose while the original remains available.
9. As the owner, I want to edit any transcript revision and save that edit as a new draft, so prior snapshots remain intact.
10. As the owner, I want a choice to save a draft, discard pending text, or stay on the current revision when I switch revisions with unsaved text, so I remain in control of my edits.
11. As the owner, I want to choose the original, a draft, or the latest reviewed transcript for preview and download, so I can use the exact version I need.
12. As the owner, I want to preview the selected revision as JSON, TXT, or SRT in the transcript panel, so I can inspect its output structure before downloading it.
13. As the owner, I want downloads to match the selected revision and format, so an export cannot silently use a different or stale revision.
14. As the owner, I want draft revisions and their previews available during the current page session, so I can review alternatives without creating a permanent history store.
15. As the owner, I want selecting a replacement file to show a confirmation with the candidate file name, so I can decide whether to leave the current workspace.
16. As the owner, I want cancelling a replacement to preserve the current media, job, transcript revisions, and drafts, so an accidental file selection does not lose work.
17. As the owner, I want a confirmation before clearing the current file, so I can avoid discarding the active session by mistake.
18. As the owner, I want confirming a clear action to return to the initial state and remove that file's session-only revisions, so the next file starts with a clean workspace.
19. As a keyboard user, I want to reach and operate the model selector, revision controls, dialogs, preview tabs, and downloads without a pointer, so the workflow remains accessible.
20. As a mobile user, I want the aligned controls, revision picker, preview, and confirmation dialogs to fit a narrow viewport without horizontal overflow, so I can complete the same review workflow on a phone.

## Implementation Decisions

- Preserve the approved Time Atlas visual direction. This specification adds the described controls and states; it does not call for a new visual concept or broad redesign.
- Use the viewport edge to edge without a max-width container. Anchor the header and footer, prevent document-level scrolling in workspace states, and keep only the completed transcript list internally scrollable. Keep the model choice and start action in a shared row; make that row usable on mobile without horizontal overflow.
- Estimate remaining time from advancing progress observations for the current job only. Label it as approximate and hide it when the job is queued, observations are insufficient, or progress is stalled or unavailable. Do not imply that the STT service supplies an ETA.
- Keep the original ASR transcript immutable. Each draft save creates a new in-memory revision. Committing a selected revision updates the service's latest reviewed transcript through the existing same-origin transcript API; the original remains separate.
- Keep revision history only in the current page session. Do not add localStorage, IndexedDB, a database, or a service-side history API.
- Editing any revision creates a new draft snapshot; it does not mutate an existing snapshot. When switching revisions with pending text, offer save as draft, discard pending text, or stay on the current revision.
- Put revision selection, format selection, and JSON/TXT/SRT preview in tabs within the transcript panel. Downloads must represent the currently selected revision and format. Draft exports are generated from that session's revision data; original and latest reviewed data continue to use the established response shape and existing API contract.
- After a candidate replacement file is selected, show a confirmation that identifies it. Cancel preserves the current workspace and session; confirm replaces it. Clearing also requires confirmation and, when confirmed, resets the current file's page-session state.
- Use Tailwind utilities for the changed interface; do not restore a global CSS stylesheet. Keep the current same-origin API and service contract, and do not add GitHub Actions.

## Testing Decisions

- Judge tests by observable behavior and user-visible output rather than internal component structure.
- Use a Playwright journey through the real page and same-origin API with the controllable local STT fixture as the primary seam. Cover draft creation, commit, original/revision selection, preview and downloads, ETA visibility states, and replacement/clear confirmation.
- Use Vitest for focused pure behavior such as ETA calculation and JSON/TXT/SRT serialization of a selected revision.
- Use API integration against the controllable fixture to verify the existing save and read contract for latest and original transcript data. Do not add a service endpoint for revisions.
- Verify keyboard operation, dialog focus and cancellation, anchored header/footer, no document scrolling, transcript-only scrolling after completion, mobile overflow, and the transcript preview at representative desktop and mobile sizes. Keep browser evidence and coverage outputs in ignored local report directories.
- Do not send private media to a live STT service or claim that this specification's tests verify live transcription quality or availability.

## Out of Scope

- Persistent transcript history across reloads or browser sessions, accounts, databases, or multiple-job tracking.
- Changes to the STT service API, service persistence, retention policy, or queue behavior.
- Server-provided ETA or guarantees about completion time.
- A new visual direction, broad redesign, custom video controls, or export formats beyond JSON, TXT, and SRT.
- GitHub Actions, CI, or tests that call the real STT service.

## Further Notes

- This follow-up builds on [frontend-stt#12](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/12), which owns the approved workspace layout and transcript interaction foundation. Keep #12 open as its own specification.
- The existing service owns the immutable original and latest reviewed transcript. Draft revisions remain session-only in the browser; the established API remains the boundary for reading original/latest and committing the latest revision.
- Test evidence should use the existing controlled fixture and synthetic media. It does not establish a live service test.
