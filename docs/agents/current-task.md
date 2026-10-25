# Current application task

## Accepted product work

Build a Thai-language, local-first transcription workspace for one personal user. The user selects one supported audio/video file from the local device, reviews it, and explicitly starts one job. The page tracks queue/processing while open, warns before leaving during an active job, and on success shows a playable local preview beside a timestamped transcript. The accepted extension in frontend-stt#8 adds a Turbo/large-v3 selector initialized from service readiness, bounded segment replay, text-only segment editing, one complete save, an immutable original-transcript view, and JSON/TXT/SRT downloads of the latest saved result. Edits remain in the current page session; unsaved changes block export.

Use the existing STT service on the same computer through a same-origin Next.js proxy. Support MP3, M4A, WAV, FLAC, and MP4 with audio. Respect limits of 1 GiB, two hours, and at most ten waiting service jobs. The interface has no account, archive, or persistent browser state. Tell the user that the service temporarily keeps successful source files for 24 hours and results for seven days; failed job data is retained for 24 hours. If the service is unavailable or a job fails, explain the issue and offer a fresh upload.

The user selected **Clear Timeline** from the three UI directions: use a light cool-blue canvas, white workspace surfaces, navy text, and blue for the primary action and active playback position. Keep timestamps tabular and use the coordinate rail beside transcript segments. The file picker stays above the work area; desktop places the player and transcript side by side, while mobile stacks them with natural scrolling. The approved direction contract is in `.impeccable/surfaces/src-app-page-tsx.md`.

Frontend-stt#8 supersedes the original read-only transcript decision for the review panel. Preserve the visual system and coordinate rail while making the latest transcript editable and keeping the original ASR view read-only.

## Completed setup task

The AI coding workflow is installed in this repository's Codex project scope. Its selected project-skill total is 63; 61 packages are complete and 2 are incomplete. The project-local model map remains `.agents/pstack-models.md`. See `docs/agents/skills-checklist.md` for scope, invocation policy, and package evidence, and `docs/AI-FOUNDATION-REPORT.md` for setup limits. Global skills/settings and existing Impeccable state/callbacks were not changed.

## Next task entry

The user approved the design brief and authorized implementation. Keep architecture and security boundaries aligned with the accepted requirements above. GitHub Issues are canonical; use the project-local explicit-only `$to-spec` or `$to-tickets` skill only when that workflow is selected. Work on `develop`, update only verified issue checkboxes, and close a leaf issue after its full agreed scope and required verification are complete.

## Completed on 2026-10-26 — frontend-stt #9 and #10

- Verified architecture prerequisite #5 through the closed implementation tickets #6/#7 and current source; keep the #5 parent/spec open.
- Completed #9 model default/selection, same-origin multipart forwarding, model-load recovery, keyboard operation, and narrow-screen checks. GitHub issue #9 is checked and closed.
- Completed #10 bounded segment replay, text-only editing, save recovery, original view, latest JSON/TXT/SRT exports, unsaved export gating, session-only state, keyboard operation, and responsive checks. GitHub issue #10 is checked and closed.
- Verification used the controllable local STT fixture and Playwright, not the real STT service.
- Commands passed: `npm run test -- --reporter=list` (19 tests), `npm run lint`, and `npm run build`.
- Desktop and mobile screenshots were visually reviewed for the model-selection and unsaved-review states.

## Active on 2026-10-26 — frontend-stt #12–#15

Implement the open parent spec #12 through dependent issues #13 → #14 → #15. GitHub issue bodies are the acceptance source. #13 is the current milestone; #14 and #15 remain blocked by their issue dependencies. Use the controllable local fixture and synthetic media. Do not claim real-service transcription testing. Keep Impeccable, Foundation, project skills/settings, and existing unrelated changes intact.
