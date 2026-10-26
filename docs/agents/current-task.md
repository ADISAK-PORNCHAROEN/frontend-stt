# Current application task

## Accepted product work

Build a Thai-language, local-first transcription workspace for one personal user. The user selects one supported audio/video file from the local device, reviews it, and explicitly starts one job. The page tracks queue/processing while open, warns before leaving during an active job, and on success shows a playable local preview beside a timestamped transcript. Accepted extensions add a Turbo/large-v3 selector initialized from service readiness, bounded segment replay, text-only editing, immutable transcript revisions, same-origin commit of a selected revision, and JSON/TXT/SRT preview/download for the selected original, draft, or latest reviewed snapshot. Draft history stays in the current page session; unsaved text is excluded from preview and blocks download.

Use the existing STT service on the same computer through a same-origin Next.js proxy. Support MP3, M4A, WAV, FLAC, and MP4 with audio. Respect limits of 1 GiB, two hours, and at most ten waiting service jobs. The interface has no account, archive, or persistent browser state. Tell the user that the service temporarily keeps successful source files for 24 hours and results for seven days; failed job data is retained for 24 hours. If the service is unavailable or a job fails, explain the issue and offer a fresh upload.

The user selected **Clear Timeline** from the three UI directions: use a light cool-blue canvas, white workspace surfaces, navy text, and blue for the primary action and active playback position. Keep timestamps tabular and use the coordinate rail beside transcript segments. Keep the file picker above the work area; the header and footer stay at viewport edges, document scrolling is prevented in workspace states, and the transcript list is the only scroll region after completion. The model selector and start control stay on the same row at desktop and mobile widths. The approved direction contract is in `.impeccable/surfaces/src-app-page-tsx.md`.

Frontend-stt#8 supersedes the original read-only transcript decision for the review panel. Preserve the visual system and coordinate rail while making the latest transcript editable and keeping the original ASR view read-only.

For frontend-stt#18, replacement and clear are confirmation-gated; an approximate remaining-time estimate is shown only from advancing progress for the active job; and review uses immutable original/draft/latest snapshots. Each saved draft creates a revision, committing uses the existing same-origin API, and preview/download supports only the selected revision and JSON/TXT/SRT format. Do not add service calls for real personal media during fixture-backed verification.

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

## Completed on 2026-10-26 — frontend-stt #12–#15

- Completed and closed leaf issues #13, #14, and #15 against their GitHub acceptance criteria. Parent/spec #12 remains open.
- #13 adds the fixture-backed unit, same-origin API, browser, coverage, and screenshot-report harness. #14 keeps Clear Timeline across all four workspace states, improves the first-run page hierarchy, and verifies desktop/mobile layout. #15 completes row replay/follow, one-at-a-time staged edits, full-set save and recovery, original/latest views, and saved JSON/TXT/SRT exports.
- Verification used synthetic media and the controllable local service fixture. It does not establish transcription against the real STT service.
- Final checks passed: `npm run test:all` (46 unit, 9 API integration, and 13 browser/visual tests; coverage 96.22% statements, 90.8% branches, 97.41% functions, and 98.82% lines), `npx tsc --noEmit`, `npm run lint` (0 errors; one warning from ignored coverage output), and `npm run build`.
- Playwright HTML report: `playwright-report/index.html`; the report includes passing screenshots for the start, processing, completed, and editing states at 1440×1000, 1280×720, and 390×844. The first-run page was also visually reviewed at desktop and mobile sizes after the follow-up polish.

## Completed on 2026-10-26 — frontend-stt #19–#23

- #19 keeps the model selector and start action in one row, anchors the header/footer, prevents page scrolling in workspace states, and limits completed-state scrolling to the transcript list. #20 shows only a clearly labeled, progress-based estimate for the advancing current job. #21 confirms replacement and clear while preserving session state on cancel. #22 adds immutable original and draft revision snapshots, safe switching, and same-origin commit recovery. #23 previews and downloads only the selected original, draft, or latest reviewed snapshot in JSON/TXT/SRT.
- Issues #19–#23 are closed after their acceptance criteria and required checks were verified. Parent/spec issue #18 remains open. No revision-history endpoint, persistent browser history, dependency, hook, or CI workflow was added.
- Final checks passed: `npm run test:unit` (62 tests), `npm run test:api` (11 tests), `npm run test:e2e` (17 tests in Microsoft Edge), `npm run test:coverage` (94.88% statements, 90.53% branches, 96.34% functions, 97.36% lines), `npx tsc --noEmit`, and `npm run build`. `npm run lint` reported 0 errors and one warning from `coverage/block-navigation.js`.
- Playwright HTML report, screenshots captured from Edge, and coverage report are under ignored `.next/issue-18-artifacts/`. Verification used synthetic media and the controllable local STT fixture; it does not establish behavior against the real STT service.
