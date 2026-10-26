# Refine Transcription Workspace Interaction and Verification

Canonical GitHub issue: [frontend-stt#12](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/12).

## Problem Statement

The transcription workspace has the core upload, playback, transcript review, and export features, but its interaction and layout no longer match the agreed four-state reference. Transcript rows are difficult to replay while reading, playback auto-follow can compete with manual scrolling, and the page does not keep the desktop workspace anchored to the viewport. The frontend also needs clearer reusable UI and test coverage/reporting so future changes are easier to maintain and verify.

## Solution

Refine the existing Clear Timeline workspace to match the reference states for start, processing, completed transcript, and transcript editing. Make transcript playback and review predictable, keep the desktop layout within the agreed viewport while retaining mobile usability, improve the native video player's frame, and organize workspace styling and shared UI with Tailwind and feature-owned modules.

## User Stories

1. As the owner, I want the start, processing, completed, and editing states to follow the supplied reference, so the workspace feels consistent across the whole transcription journey.
2. As the owner, I want the desktop header and footer to stay at the top and bottom of the workspace, so the main work area remains available without page scrolling.
3. As the owner, I want the desktop page to fit without body scrolling at 1280×720 and larger, so I can work in one view.
4. As the owner, I want smaller desktop layouts to remain usable when the full workspace cannot fit, so controls are not compressed beyond use.
5. As a mobile user, I want the page to avoid horizontal overflow and allow natural vertical scrolling, so all controls remain reachable on a narrow screen.
6. As the owner, I want the completed transcript to be the only internally scrolling region on supported desktop sizes, so playback and transcript review stay in one workspace.
7. As the owner, I want to click a read-only transcript segment row, including its text, to replay its segment, so I can return to any passage without aiming only at the timestamp.
8. As the owner, I want a transcript to begin in read-only mode and edit one segment at a time, so reading and playback do not conflict with text editing.
9. As the owner, I want a segment's Save action to stage its text and Cancel to discard only that segment's active draft, so I can review several corrections before saving the transcript.
10. As the owner, I want one transcript-level Save action to send the complete set of segment IDs and text through the existing API, so all staged edits are persisted together.
11. As the owner, I want unsaved edits to remain visible after a failed save and to block exports until a successful save, so I do not lose work or download stale text.
12. As the owner, I want to compare the original ASR transcript and export the latest saved JSON, TXT, or SRT without changing the existing service contract.
13. As the owner, I want playback to highlight and follow the active segment without repeated or competing scroll animations.
14. As the owner, I want manual scrolling to pause auto-follow and a clear Return to Follow action to resume it, so I can inspect other transcript sections while playback continues.
15. As the owner, I want the video frame to look intentional and responsive while retaining native browser controls, so familiar playback controls remain accessible.
16. As a developer, I want workspace styling to use Tailwind utilities and reusable presentation controls, so the layout and common form controls stay consistent.
17. As a developer, I want transcription types, hooks, and pure helpers grouped within the feature, so domain knowledge stays out of generic UI and the code is easier to locate.
18. As the owner, I want unit, API integration, and browser journey checks with coverage and a report after each implementation milestone, so regressions are visible throughout the work.
19. As the owner, I want the local E2E HTML report to include actual screenshots from passing desktop and mobile journeys, so I can review what the browser rendered.
20. As the owner, I want automated video tests to use repeatable synthetic media and the supplied personal MP4 to stay local, so private media does not enter Git, test reports, or the STT service.

## Implementation Decisions

- Preserve the Clear Timeline visual system and use the supplied four-state reference as the visual acceptance target. Keep only the TIME ATLAS name in the footer's right side and preserve the file-limit note on the left.
- At desktop sizes from 1280×720, keep the app shell within the viewport, place the header and footer at its edges, and confine completed transcript scrolling to its panel. Below that minimum, allow the main area to scroll rather than making controls unusably small.
- At mobile sizes, prevent horizontal overflow and use natural page scrolling; the header and footer remain in normal flow.
- Keep native video controls and improve only the responsive frame, aspect ratio, and presentation.
- In the completed state, transcript rows are read-only and the whole row replays its segment. Editing activates one segment editor; row Save stages the current value, row Cancel restores the value from the start of that edit, and transcript-level Save sends the complete ordered `{id, text}` set through the existing same-origin API.
- Preserve segment IDs, order, timing, original transcript immutability, saved-export behavior, and session-only drafts. A failed batch save retains staged edits.
- Active-segment follow stays inside the transcript container. Manual scrolling suspends follow; the Return to Follow action returns to the current segment and resumes it.
- Use Tailwind utilities for workspace layout and component styling, with global CSS retained for tokens, base styles, and browser-specific styling that utilities do not express well.
- Use generic, presentation-only UI primitives. Keep transcription components, hooks, helpers, and domain types feature-owned; do not move STT types or behavior into generic UI.
- Keep the current same-origin API and local STT service contracts unchanged. Do not add GitHub Actions.

## Testing Decisions

- Use Vitest, Testing Library, and V8 coverage for unit and component behavior. Require at least 90% line/function coverage and 80% branch coverage for executable transcription-feature source.
- Keep Playwright for same-origin API integration and browser journeys in Microsoft Edge. Use the controllable local STT fixture rather than the live service.
- Generate a Playwright HTML report with screenshots attached from passing tests for the four workspace states at desktop and mobile viewports. Keep reports and coverage outputs in Git-ignored local output directories.
- Run unit tests, API integration, E2E, and coverage after each completed implementation milestone and once again at the end.
- Review keyboard use, responsive layout, horizontal overflow, transcript scrolling, focus, video playback, unsaved edits, save recovery, original view, and exports.
- Use the supplied MP4 only for local Edge visual review. Do not submit it to the STT service or include its name or frames in repository files or reports. Use a synthetic fixture for repeatable automated E2E screenshots.

## Out of Scope

- STT service changes, API contract changes, service retention changes, new media formats, accounts, URL import, persistent history, or multi-job tracking.
- Replacing the Clear Timeline direction or building custom video controls.
- GitHub Actions, CI, or publishing screenshots containing personal media.

## Further Notes

- This is a follow-up to the workspace and architecture specifications in frontend-stt#1, #5, and #8. Keep those parent/spec issues open.
- The project's existing same-origin API and controlled STT fixture remain the integration seam; this specification adds a Vitest unit/component seam but does not claim a live-service transcription test.
