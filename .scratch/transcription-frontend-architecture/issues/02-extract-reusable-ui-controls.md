# 02: Extract reusable UI controls for the workspace

**What to build:** The project owner sees consistent, accessible actions throughout the Clear Timeline workspace, while generic controls stay reusable by future screens.

**GitHub Issue:** [#7](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/7) · **Parent spec:** [#5 Transcription Frontend Architecture and Reuse](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/5).

**Blocked by:** None. This ticket can start immediately.

**Status:** ready-for-agent.

- [ ] Repeated native button actions use a small presentation-only primitive with shared primary, secondary, and text variants where those variants match current callers.
- [ ] The primitive preserves native button behavior, disabled behavior, keyboard focus, and existing Clear Timeline styling across desktop and mobile.
- [ ] Download links and file-input labels keep their correct link/label semantics; the shared control does not turn feature UI into button-shaped wrappers.
- [ ] The shared UI control has no transcription types, service calls, workflow decisions, or media logic; file selection, media playback, transcript segments, and status composition stay feature-owned.
- [ ] Visual review confirms current empty, selected, processing, success, and failure actions remain legible and usable at desktop and mobile widths.
- [ ] This extraction adds no UI library and changes no accepted product behavior.
