# 05: Preview and Download the Selected Revision

**GitHub Issue:** [#23](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/23)

**What to build:** The owner can select an original, draft, or latest reviewed transcript, preview it in JSON/TXT/SRT, and download exactly the selected revision and format.

**Parent:** [frontend-stt#18](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/18)

**Blocked by:** [frontend-stt#22](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/22): Manage Session Transcript Revisions.

## Acceptance criteria

- [ ] The transcript panel lets the owner select the original, any current-session draft, or the latest reviewed transcript.
- [ ] JSON, TXT, and SRT are available as preview formats within the transcript panel.
- [ ] The preview content and downloaded file both represent the currently selected revision and format.
- [ ] Original and latest reviewed data use the established API contract; session-only drafts are previewed and exported without adding a backend history endpoint.
- [ ] Changing the selected revision or format updates the preview before download, and keyboard users can operate all controls.
- [ ] Unit, API integration, and browser checks verify format output, revision selection, downloads, and responsive layout with controlled fixtures.

## Blocked by

- [frontend-stt#22](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/22): Manage Session Transcript Revisions.
