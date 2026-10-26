# Issue tracker

GitHub Issues are the canonical tracker for project specs and tickets. Keep the reviewable Markdown copies in `docs/specs/` and `.scratch/<feature-slug>/issues/` aligned with the Issues. Specs live under `docs/specs/`; tickets live one per file under `.scratch/<feature-slug>/issues/` in dependency order. New actionable tickets use the `ready-for-agent` label.

When publishing a spec and its tickets, create the spec issue first, then create tickets in dependency order and include GitHub issue references for the spec and blockers. This project does not use GitHub Actions.

## Approved follow-up: transcription workspace refinement

The owner approved the workspace refinement specification on 2026-10-26. The canonical [specification](../specs/transcription-workspace-refinement.md) is [frontend-stt#12](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/12).

| Ticket | Scope | Blocked by | Status | Ready for agent |
| --- | --- | --- | --- | --- |
| [frontend-stt#13](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/13) | Repeatable unit, API integration, browser tests, coverage, and visual report | None | Complete (GitHub closed) | No |
| [frontend-stt#14](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/14) | Responsive workspace layout, Clear Timeline states, and reusable UI structure | #13 | Complete (GitHub closed) | No |
| [frontend-stt#15](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/15) | Transcript row playback, follow behavior, staged editing, save, and exports | #14 | Complete (GitHub closed) | No |

## Approved follow-up: Whisper model choice and transcript review

The owner approved this cross-repository feature on 2026-10-25. The product [specification](../specs/whisper-model-choice-transcript-review.md) is [frontend-stt#8](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/8). The service contract has its own [stt-service spec #10](https://github.com/ADISAK-PORNCHAROEN/stt-service/issues/10).

| Ticket | Repository scope | Blocked by | Status | Ready for agent |
| --- | --- | --- | --- | --- |
| [frontend-stt#9](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/9) | Model dropdown and same-origin proxy | #5 delivered through #6/#7; stt-service#11 closed | Complete | No |
| [frontend-stt#10](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/10) | Segment playback, transcript editor, and export UI | #5 delivered through #6/#7; stt-service#12 closed | Complete | No |
| [stt-service#11](https://github.com/ADISAK-PORNCHAROEN/stt-service/issues/11) | Model selection persistence and worker behavior | None | Complete | No |
| [stt-service#12](https://github.com/ADISAK-PORNCHAROEN/stt-service/issues/12) | Transcript update API and original/latest result formats | None | Complete | No |

The backend tickets are children of the service spec and own the API, persistence, worker, and service tests. The frontend tickets own the browser UI and proxy integration. Architecture delivery for frontend-stt#5 is verified through closed #6/#7; keep the #5 parent/spec open. Service #11/#12 and frontend #9/#10 are complete; frontend verification used controlled fixtures and does not claim a live service test. Real-model acceptance remains limited to one Formal Words API run per model under the existing scoring policy; media, reference text, and raw results stay outside Git and GitHub.

## Follow-up: session-scoped transcript revisions and workspace guidance

The approved follow-up [specification](../specs/transcription-session-revisions.md) is [frontend-stt#18](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/18).

| Ticket | Scope | Blocked by | Status | Ready for agent |
| --- | --- | --- | --- | --- |
| [frontend-stt#19](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/19) | Align workspace controls and viewport | None | Open | Yes |
| [frontend-stt#20](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/20) | Show progress-based remaining time | None | Open | Yes |
| [frontend-stt#21](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/21) | Confirm media replacement and clear | None | Open | Yes |
| [frontend-stt#22](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/22) | Manage session transcript revisions | None | Open | Yes |
| [frontend-stt#23](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/23) | Preview and download the selected revision | #22 | Open | Yes |

Ticket markdown copies are stored under `.scratch/transcript-session-revisions/issues/`.


Work on `develop` by default. As ticket acceptance criteria are completed and verified, check those boxes in GitHub Issues. Close a leaf work ticket when its full agreed scope and required verification are complete; for partial progress, check only the verified boxes and leave the ticket open. Keep parent/spec issues open unless the user explicitly asks to close them.
