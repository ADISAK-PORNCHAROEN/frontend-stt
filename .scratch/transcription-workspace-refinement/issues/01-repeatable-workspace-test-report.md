# 01: Add Repeatable Workspace Tests and Visual Reports

GitHub issue: [frontend-stt#13](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/13).

## Parent

[frontend-stt#12 — Refine Transcription Workspace Interaction and Verification](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/12)

## What to build

Make the current transcription journey verifiable with repeatable local checks: unit and component behavior, same-origin API integration, and browser journeys against a controllable STT fixture. The browser report should show what passed through screenshots from synthetic media, without sending the owner's clip to the service or storing personal media in the report.

## Acceptance criteria

- [ ] Vitest, Testing Library, and V8 coverage run unit and component checks, with at least 90% line/function coverage and 80% branch coverage for executable transcription-feature source.
- [ ] Same-origin API integration and browser journeys use the controllable local STT fixture and synthetic media; they do not require or claim a live-service transcription test.
- [ ] Playwright runs the browser journey in Microsoft Edge and generates a local HTML report with screenshots attached from passing tests for the start, processing, completed, and editing states at desktop and mobile viewports.
- [ ] Browser verification checks keyboard access, mobile horizontal overflow, and the completed transcript scroll region as well as the main journey.
- [ ] Unit, API integration, E2E, and coverage checks have project commands that can be run locally; reports and generated media stay in ignored output directories.
- [ ] The verification workflow adds no GitHub Actions, CI, or personal media to the repository.

## Blocked by

None (can start immediately).
