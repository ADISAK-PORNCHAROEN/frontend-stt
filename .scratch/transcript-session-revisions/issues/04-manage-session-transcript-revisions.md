# 04: Manage Session Transcript Revisions

**GitHub Issue:** [#22](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/22)

**What to build:** The owner can preserve the original transcript, create session-only review drafts, edit any revision into a new draft, and commit a chosen revision as the latest reviewed transcript.

**Parent:** [frontend-stt#18](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/18)

**Blocked by:** None (can start immediately).

## Acceptance criteria

- [ ] The original ASR transcript remains unchanged after draft edits and commits.
- [ ] Each “Save as draft” action creates a distinct revision snapshot in the current page session.
- [ ] Committing the selected revision updates the latest reviewed transcript through the existing same-origin API while preserving the original.
- [ ] Editing any revision creates a new draft rather than mutating the original or an existing snapshot.
- [ ] If text is unsaved when the owner changes revisions, the UI offers to save it as a draft, discard it, or stay on the current revision.
- [ ] Failed commits retain the pending text and allow recovery without losing drafts.
- [ ] Revision state is not persisted across page reloads or browser sessions and no service-side history API is added.
- [ ] Unit, API integration, and browser checks use the controlled fixture to verify revision behavior, save recovery, keyboard operation, and responsive states.

## Blocked by

- None (can start immediately).
