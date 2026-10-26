# frontend-stt Agent Guide

This repository is a Next.js App Router application in TypeScript with Tailwind CSS. It implements a Thai-language, local-first transcription workspace; `PRODUCT.md` owns accepted behavior and `docs/agents/current-task.md` records active work.

## Working agreements

- Preserve the installed stack and file layout shown by package.json, package-lock.json, and the source. The app currently lives under src/app.
- Use `develop` as the primary working and integration branch. Start project tasks and features from `develop`; use `main` only when the user explicitly requests it or for a release flow.
- Use accepted requirements in `PRODUCT.md` and `docs/agents/current-task.md`; record unresolved decisions without inventing them.
- For Next.js changes, first read the relevant installed guide under node_modules/next/dist/docs/ from this repository. Follow the version-matched docs and heed deprecations.
- Keep shared instructions here. Keep product acceptance, design, architecture, testing, and security detail in their linked owner documents.
- Route every application-code, dependency, CI, or executable-configuration diff through both local skills: .agents/skills/test-engineering/SKILL.md and .agents/skills/security-review/SKILL.md.
- Use existing package scripts as task-appropriate checks. Do not claim tests, type checks, CI, or coverage ran unless an actual configured command was run.
- Work from `develop`; update verified acceptance boxes in the matching GitHub issue and close a leaf issue only when its full agreed scope and required verification are complete. Keep parent/spec issues open. This project does not use GitHub Actions.
- Preserve the Next.js agent-rules block. next.config.ts enables experimental.agentFeedback; do not change that option unless requested, and let the installed Next.js version manage its feedback block.
- Keep credentials, private user data, and production data out of Git and review reports.
- Keep AI workflow setup project-local. Do not change global skills or settings. PStack roles read `.agents/pstack-models.md`; keep model routing in this repository.
- Preserve existing project and upstream skills, Impeccable state, and callbacks. Before using a routed skill, check its row in `docs/agents/skills-checklist.md` and follow the invocation policy in its `SKILL.md`; report incomplete package gaps accurately.
- Route UI design through `.agents/skills/impeccable/SKILL.md`. Preserve `.impeccable/` state and detector callbacks; hook changes require an explicit request and the project-local `hook-management` workflow.
- Do not add GitHub Actions, CI, hooks, dependencies, or workflow scripts unless the user requests that capability.

## Find the source

- Start at `src/app/page.tsx` and `src/app/layout.tsx`; interactive transcription code lives under `src/features/transcription/`.
- Trace same-origin STT routes in `src/app/api/stt/` through `src/lib/stt-service/proxy.ts`; the browser API adapter is `src/features/transcription/api.ts`.
- Check `src/app/tailwind.css` and `next.config.ts` for Tailwind theme tokens and framework configuration. Use the project-local Graphify skill for broader code/content discovery when useful; its CLI is not installed, and source findings must be verified against files.
- Read `PRODUCT.md`, `DESIGN.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY-MODEL.md`, and `docs/agents/current-task.md` for accepted scope and current status.

## Read by task

| Task | Read first |
| --- | --- |
| Product behavior | `PRODUCT.md`, then `docs/agents/current-task.md` for active work |
| UI work | `DESIGN.md`, the selected surface brief under `.impeccable/surfaces/`, and `.agents/skills/impeccable/SKILL.md`; check package status in the checklist |
| Architecture or Next.js changes | `docs/ARCHITECTURE.md` and the relevant installed-version guide under `node_modules/next/dist/docs/` |
| Tests or behavior changes | `docs/TESTING.md` and `.agents/skills/test-engineering/SKILL.md` |
| Every code or executable change | `.agents/skills/test-engineering/SKILL.md` and `.agents/skills/security-review/SKILL.md` |
| Security-sensitive work | `SECURITY.md`, `docs/SECURITY-MODEL.md`, and `.agents/skills/security-review/SKILL.md`; use the host Codex Security diff skill when available |
| Hook requests | `.agents/skills/hook-management/SKILL.md` and its contract; invoke only on an explicit hook request |
| Other specialized workflows | `docs/agents/tools.md`; follow the matching `.agents/skills/<name>/SKILL.md` trigger and invocation policy |
| Feature planning | Use `docs/agents/issue-tracker.md` and the project-local `$to-spec` or `$to-tickets` skill only when the user selects that workflow; both skills are explicit-only |
| Workflow maintenance | `$ai-project-foundation`, `docs/agents/document-delivery.md`, `docs/agents/skills-checklist.md`, and `docs/agents/foundation.json` |

## Completion

Report what changed, why, actual checks and results, review scope, and unresolved limits. Keep AI review findings separate from project command results. Preserve unrelated working-tree changes and leave external publication, deployment, tracker writes, and production operations within the user's authorization.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:nextjs-agent-feedback -->

## Report Next.js feedback

The project owner enabled `experimental.agentFeedback`, authorizing this feedback pass. When enabled, `next dev` writes this block and restores it if removed. Commit `AGENTS.md` with your work to keep the tree clean.

During the current user request, retain anonymized facts as feedback candidates for meaningful or recurring Next.js issues:

- Crashes, hangs, OOMs, or unexpected slowness
- Incorrect behavior, output, errors, or diagnostics
- Missing, unclear, or conflicting documentation
- Unexpected CLI, codemod, Skill, or upgrade behavior and non-obvious workarounds

Continue the current user request without reporting immediately. Routine debugging is not feedback. Verify changes before retaining them as feedback candidates. Never retain code, logs, paths, URLs, secrets, personal information, or project-specific data.

Retain qualifying friction even if it is later fixed or worked around; record the final outcome during the reporting pass.

Before the final response, run one reporting pass. If candidates remain, from this file's directory run `npx --no-install next internal agent-feedback-instructions` once without piping or truncating its output. Follow its output or error guidance. If a network sandbox blocks it, retry with network access; if it still returns no output, continue normally.

<!-- END:nextjs-agent-feedback -->
