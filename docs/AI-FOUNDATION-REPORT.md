# AI project foundation report

## Scope and outcome

Set up the AI coding workflow in this repository on `develop`, within the project scope. The Skills CLI reports 64 Codex project entries: 63 selected project skills plus the Foundation installer. Selected skills: **63**; package-complete: **61**; incomplete: **2**. Setup status is **partial** because preserving Impeccable as requested leaves a difference from the pinned bundle, and `poteto-help` points to missing guides. The itemized inventory is in [the project skills checklist](agents/skills-checklist.md).

No global installation command or user/global settings path was used. `npx --yes skills list --global --agent codex` was read-only. A full before/after global filesystem snapshot was not captured, so this report claims only that this setup did not target global writes.

## Project findings

- The accepted V1 is a Thai, single-user, local-first transcription workspace using file upload, one tracked job, a local preview, timestamped transcript segments, playback seeking/synchronization, TXT/SRT export, and a same-origin proxy to the local STT service. The accepted design direction is Clear Timeline. These decisions are recorded in `PRODUCT.md`, `DESIGN.md`, `docs/agents/current-task.md`, and the approved spec.
- The repository is a Next.js App Router project in TypeScript with source under `src/app`. Architecture and test/security documents reflect the actual app and STT proxy boundaries.
- GitHub Issues are the canonical external tracker. No issue was linked to this workflow setup, so no ticket was edited or closed.
- Existing project rules keep work on `develop`, preserve the Next.js-managed blocks, prohibit GitHub Actions, and route future application-code changes through the local testing and security-review workflows.

## Changes made

- Rebuilt the shared `AGENTS.md` guide for this repository and retained its Next.js-managed blocks; kept `CLAUDE.md` as the `@AGENTS.md` bridge.
- Refreshed the Foundation-owned product/workflow navigation records, tools routing, project skill checklist, machine-readable manifest, document-delivery register, and this report.
- Installed the Foundation setup skill, Graphify and hook-management project copies; added project-local copies of the explicitly requested `to-spec` and `to-tickets` workflows. Preserved the existing PStack skills and project-local model map.
- Updated the project-local test/security workflow maps to match the accepted STT product and current source boundaries. Marked hook-management explicit-only, consistent with its user-request-only trigger.
- Archived the exact original root instructions and recorded the archive receipt. No product code, dependency, hook, GitHub Actions workflow, CI configuration, or executable helper was added.

## Inventory and preservation

- The five standard project skills and all selected extras are inventoried recursively by normalized relative path and SHA-256. `foundation.json` records source and installed fingerprints, exact differences, invocation metadata, local links, and CLI discoverability.
- The existing Impeccable package was preserved without edits, including its customized v4.5.2 files, Windows binary, `.impeccable/` project state, and callbacks. The pinned Foundation bundle is v4.7.0: the local package has 63 files vs. 64, lacks `LICENSE` and `NOTICE.md`, has one additional Windows executable, and differs at the exact paths listed in the checklist. Impeccable remains installed and CLI-discoverable but is counted incomplete; it was not overwritten or upgraded.
- `poteto-help` remains unchanged and CLI-discoverable. Its nine missing guide targets are enumerated in the checklist; this package is counted incomplete.
- The 56 existing PStack skill folders, `skills-lock.json`, and `.agents/pstack-models.md` were preserved. The stored lock hashes do not match the current local `SKILL.md` hashes for 56/56 skills, so the immutable upstream revisions cannot be established from that lock; local snapshot inventories are recorded instead.
- Existing host copies of `to-spec`, `to-tickets`, and the host security scanner were inventoried without modification. Project copies of the two requested planning skills match their host snapshots.
- The Foundation installer package matches its source inventory. Graphify and the test/security/hook workflows have their source inventories and any approved project adaptations recorded. Skill invocation policies and the project CLI scope are recorded separately from package completeness.
- No PStack model configuration, Impeccable callback/state, host/global skill, or user/global setting was intentionally changed. No full global filesystem before/after comparison was captured.

## Review and verification

- Reviewed project rules and owner documents against the current accepted product scope and source boundaries. The document-delivery register lists every canonical file, selected skill entrypoint, and required package resource separately. PStack content was preserved and package/frontmatter/link-inventoried; its full semantic content was not independently audited.
- Verified package fingerprints/file lists, skill names and invocation metadata, local Markdown links, project-only Skills CLI listing, archive receipt, and preservation boundaries. The global Skills CLI listing was read-only.
- Commands run: `npx --yes skills list --agent codex`; `npx --yes skills list --global --agent codex` (read-only); `npx --no-install next internal agent-feedback-instructions` (exit 0, no output); `git diff --check` (passed, with Git line-ending conversion warnings).
- Application lint, build, type checks, tests, and browser journeys were not run because this setup changed workflow documentation and skill packages only; no project test suite or typecheck command is configured. No whole-repository security scan was run.
- A fresh Codex project session and Claude host load were not exercised, so runtime rediscovery remains unverified.
- Final local verification confirmed both Next.js-managed blocks match the archived original, the archive SHA-256 matches its receipt, `CLAUDE.md` is exactly `@AGENTS.md`, the new report/checklist/register links resolve, manifest totals match 63/61/2, and the document-delivery register has one entry for every selected skill.

## Remaining work

1. Decide whether to update or separately retain the customized Impeccable v4.5.2 package; this setup preserves it and does not overwrite its files. If a future update is requested, reconcile its customizations and callbacks with the pinned v4.7.0 files and include the two missing notices.
2. Supply or remove the missing PStack guide resources referenced by `poteto-help`, while preserving its upstream source and invocation policy.
3. In a fresh Codex project session, confirm the 64 project entries load as expected. This setup has not established fresh-session behavior.
4. Run the repository's task-appropriate checks during application work; this documentation/skill setup did not require lint, build, or tests.
