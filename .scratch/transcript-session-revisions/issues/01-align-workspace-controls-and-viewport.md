# 01: Align Workspace Controls and Viewport

**GitHub Issue:** [#19](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/19)

**What to build:** The owner can choose the transcription model and start transcription from one clear control row, while the approved workspace fills the viewport and keeps its main controls in view.

**Parent:** [frontend-stt#18](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/18)

**Blocked by:** None (can start immediately).

## Acceptance criteria

- [ ] The model selector and “เริ่มถอดเสียง” action appear in the same row in the selected-file state.
- [ ] The workspace uses the available viewport edge to edge without a max-width container; its header and footer remain anchored to the viewport.
- [ ] The document does not scroll in supported workspace states; after transcription completes, only the transcript list scrolls.
- [ ] Desktop and mobile layouts keep the controls usable without horizontal overflow.
- [ ] Keyboard users can reach and operate the selector and start action with visible focus.
- [ ] Browser verification uses the controllable fixture and includes desktop and mobile visual evidence; the approved visual direction is preserved without a new redesign.

## Blocked by

- None (can start immediately).
