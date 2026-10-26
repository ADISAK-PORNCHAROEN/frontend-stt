# Continuation map

## Current state

- The accepted V1 is the local-first Thai transcription workspace described in `PRODUCT.md`; its current source boundaries are mapped in `docs/ARCHITECTURE.md` and its design direction is in `DESIGN.md`.
- Shared project rules are in AGENTS.md, with the Claude bridge in CLAUDE.md.
- Same-origin STT integration runs through `src/app/api/stt/` and `src/lib/stt-service/proxy.ts`; the interactive flow lives under `src/features/transcription/`.
- Test and security workflows: `docs/TESTING.md`, `SECURITY.md`, `docs/SECURITY-MODEL.md`, and the project-local review skills.
- The Codex Skills CLI lists 64 project-scope skills: 63 selected workflows plus the Foundation installer. The selected package audit is 61 complete and 2 incomplete; the exact scope and frontmatter policy are in `docs/agents/skills-checklist.md`.
- PStack's 56 project skills and `.agents/pstack-models.md` remain project-local. `skills-lock.json` is preserved; its recorded entrypoint hashes do not match the current local PStack files, so it does not establish the installed revision.
- Impeccable remains discoverable at `.agents/skills/impeccable/` with its existing customized v4.5.2 files and project state/callbacks preserved. It does not match the Foundation-pinned v4.7.0 package and is counted incomplete.
- `poteto-help` remains installed, but its package references PStack repository guides absent from the copied package; it is counted incomplete and was not modified.
- UI design uses `DESIGN.md`, the selected surface brief, and `.agents/skills/impeccable/SKILL.md`.
- Delivery and review evidence: `docs/agents/document-delivery.md` and `docs/AI-FOUNDATION-REPORT.md`.

## Representative journey: transcribe and review one local file

1. Read the accepted behavior in `PRODUCT.md` and the active task in `docs/agents/current-task.md`.
2. Trace selection and playback through `src/features/transcription/`, upload/status/result routes under `src/app/api/stt/`, and the loopback adapter in `src/lib/stt-service/proxy.ts`.
3. Check the Clear Timeline layout in `DESIGN.md` and `.impeccable/surfaces/src-app-page-tsx.md`.
4. Select behavioral evidence using `docs/TESTING.md` and `.agents/skills/test-engineering/SKILL.md`; no unit, integration, browser E2E, or coverage runner is configured.
5. Review code/config changes against `docs/SECURITY-MODEL.md` with `.agents/skills/security-review/SKILL.md`; invoke the host diff scanner when available.
6. Work on `develop`, update only verified GitHub issue acceptance boxes, and close a leaf ticket only after its agreed scope and required verification are complete.

This is the accepted workflow map; it does not claim that the application journey was exercised during this documentation-only setup. No project test, lint, or build command was run for this setup.
