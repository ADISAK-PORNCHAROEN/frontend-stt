# 02: Refine Workspace Layout and Reusable UI

GitHub issue: [frontend-stt#14](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/14).

## Parent

[frontend-stt#12 — Refine Transcription Workspace Interaction and Verification](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/12)

## What to build

Give the owner a consistent, responsive workspace through the start, processing, completed, and editing states, following the supplied Clear Timeline reference. Keep the desktop workspace anchored and compact while preserving a usable mobile layout, and organize shared presentation controls separately from transcription-specific code.

## Acceptance criteria

- [ ] The four workspace states follow the accepted reference and remain one coherent design. The right side of the footer shows TIME ATLAS only; the file-limit note remains on the left.
- [ ] At desktop viewports of 1280×720 and larger, the workspace fits without body scrolling; the header and footer stay at the viewport edges, and the completed transcript is the only internally scrolling region.
- [ ] Below the minimum desktop viewport, the main area can scroll without compressing controls into unusable sizes. At 390×844 mobile, there is no horizontal overflow, vertical page scrolling remains natural, and header/footer stay in normal flow.
- [ ] The video frame has a responsive, intentional presentation while retaining native browser controls.
- [ ] Tailwind utilities provide the workspace layout and component styling; global CSS retains design tokens, base styles, and necessary browser-specific styling.
- [ ] Generic presentation-only Button, Input, Textarea, and Select controls are reusable under the shared UI area; transcription components, hooks, helpers, and domain types remain feature-owned, with types grouped in a feature-local types folder.
- [ ] Existing API and STT service contracts remain unchanged, and automated visual review covers the four states on desktop and mobile using synthetic media.

## Blocked by

[frontend-stt#13 — Add Repeatable Workspace Tests and Visual Reports](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/13)
