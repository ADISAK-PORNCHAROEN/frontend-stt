# frontend-stt Agent Guide

This repository is a small Next.js App Router starter in TypeScript with Tailwind CSS. Its current page is the stock create-next-app screen; no product behavior or acceptance criteria have been confirmed.

## Working agreements

- Preserve the installed stack and file layout shown by package.json, package-lock.json, and the source. The app currently lives under src/app.
- Do not infer product requirements from the repository name, parent folder, or starter template. Use accepted user requirements; record unresolved product decisions without inventing them.
- For Next.js changes, first read the relevant installed guide under node_modules/next/dist/docs/ from this repository. Follow the version-matched docs and heed deprecations.
- Keep shared instructions here. Keep product acceptance, design, architecture, testing, and security detail in their linked owner documents.
- Route every application-code, dependency, CI, or executable-configuration diff through both local skills: .agents/skills/test-engineering/SKILL.md and .agents/skills/security-review/SKILL.md.
- Use existing package scripts as task-appropriate checks. Do not claim tests, type checks, CI, or coverage ran unless an actual configured command was run.
- Preserve the Next.js agent-rules block. next.config.ts enables experimental.agentFeedback; do not change that option unless requested, and let the installed Next.js version manage its feedback block.
- Keep credentials, private user data, and production data out of Git and review reports.
- Keep AI workflow setup project-local. If a project skill instructs writing to a user or global configuration path (including `setup-pstack`'s default model settings path), do not write there unless the user explicitly requests that scope; use a project-local option only when the skill supports one.
- In this project, pstack skills read `.agents/pstack-models.md` for role models and effort guidance. Keep that configuration inside the repository.

## Find the source

- Start from src/app/page.tsx for the root route and src/app/layout.tsx for the root layout and metadata.
- Check src/app/globals.css for global styles and next.config.ts for framework configuration.
- Use targeted source search with rg. No project code graph or source inventory tool is configured; verify all findings against current files.
- Read docs/ARCHITECTURE.md for boundaries and docs/agents/current-task.md for current acceptance status.

## Read by task

| Task | Read first |
| --- | --- |
| Product behavior | docs/agents/current-task.md; no application feature acceptance is currently recorded |
| UI work | DESIGN.md and project-local `.agents/skills/impeccable/SKILL.md` when the skills checklist marks it installed; if missing, report that local gap instead of relying on a global copy |
| Architecture or Next.js changes | docs/ARCHITECTURE.md and the relevant installed-version guide under node_modules/next/dist/docs/ |
| Tests or behavior changes | docs/TESTING.md and .agents/skills/test-engineering/SKILL.md |
| Every code or executable change | .agents/skills/test-engineering/SKILL.md and .agents/skills/security-review/SKILL.md |
| Security-sensitive work | SECURITY.md, docs/SECURITY-MODEL.md, and .agents/skills/security-review/SKILL.md |
| Other specialized workflows | docs/agents/tools.md for the project skill catalog; follow the matching `.agents/skills/<name>/SKILL.md` trigger and invocation policy |
| Workflow maintenance | docs/agents/tools.md, docs/agents/document-delivery.md, and docs/agents/foundation.json |
| Feature planning | Use accepted requirements and `docs/agents/current-task.md`. When the user selects a spec or ticket workflow, use the matching host `$to-spec` or `$to-tickets` skill only if it is available and allowed by its invocation policy; do not create external tickets without authorization. |

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
