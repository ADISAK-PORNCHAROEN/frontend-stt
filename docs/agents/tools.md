# AI workflow and tool entry points

## Project-local skills

Project skills are stored under `.agents/skills/`. `docs/agents/foundation.json` inventories every selected project skill, the project-local Foundation installer, and the host security scanner dependency. The Skills CLI lists 64 entries in Codex project scope: 63 selected workflows plus the installer. No global install option or global settings path was used. `skills-lock.json` remains unchanged and records 56 PStack entries, but its stored entrypoint hashes do not match the current PStack copies; see the checklist for that provenance limit.

| Workflow | Trigger and inputs | Authoritative sources | Output and limits |
| --- | --- | --- | --- |
| Test engineering | Any application-code, dependency, CI, or executable-configuration diff; also behavior changes, test authoring, or test review | AGENTS.md, docs/TESTING.md, .agents/skills/test-engineering/SKILL.md and its testing contract | Evidence-backed layer selection, exact commands/results, and skipped checks across configured Vitest, Playwright, coverage, lint, typecheck, and build commands |
| Security review | Any application-code, dependency, CI, or executable-configuration diff | SECURITY.md, docs/SECURITY-MODEL.md, .agents/skills/security-review/SKILL.md and its review contract | Patch scope, trust-boundary evidence, validated findings and coverage gaps; not a whole-repository certification |
| Frontend/UI design | User-requested frontend design, critique, audit, or interface improvement | `DESIGN.md`, the selected `.impeccable/surfaces/` brief, and `.agents/skills/impeccable/SKILL.md` | Existing customized v4.5.2 package remains project-local and discoverable; it does not match the pinned v4.7.0 bundle, so consult the checklist before assuming package completeness |
| Code/content discovery | Multi-file architecture or project-content questions when graph traversal helps | `.agents/skills/graphify/SKILL.md` and its local references | Skill is project-local; Graphify CLI is not installed. Check availability before CLI operations and never install it implicitly |
| Hook management | Explicit user request to inspect, configure, migrate, or remove hooks | `.agents/skills/hook-management/SKILL.md` and `references/hook-change-contract.md` | Explicit-only; setup does not configure hooks. Establish host, scope, event, and behavior before any write |
| PStack skills | When the user explicitly invokes a skill whose frontmatter sets `disable-model-invocation: true`; otherwise when its description trigger matches | Matching `.agents/skills/<name>/SKILL.md`; `.agents/pstack-models.md` | 56 skills are in Codex project scope. Model-routing skills use the project-local model map; `setup-pstack` writes there. Current upstream revision is not established by the lock hashes |
| Spec planning | When the user explicitly invokes/selects spec creation | Project-local explicit-only `.agents/skills/to-spec/SKILL.md`; `docs/agents/issue-tracker.md` | GitHub Issues are canonical. Keep Markdown copies under `docs/specs/`; create external issues only for the selected workflow and authorized tracker action |
| Ticket planning | When the user explicitly invokes/selects ticket creation | Project-local explicit-only `.agents/skills/to-tickets/SKILL.md`; `docs/agents/issue-tracker.md` | Create tickets in GitHub Issues and preserve the aligned Markdown copies under `.scratch/<feature-slug>/issues/`; include dependency edges and references |
| Foundation/workflow maintenance | Setup, audit, or skill-routing changes | Project-local `.agents/skills/ai-project-foundation/SKILL.md`, `docs/agents/document-delivery.md`, checklist, and manifest | Project-only setup; installer excluded from selected count; no Foundation checker, hooks, CI, or executable helpers |
| Skill readiness | Setup or skill-routing change | `docs/agents/skills-checklist.md`, `docs/agents/foundation.json`, and `skills-lock.json` | Checklist total is 63 selected workflows, with 61 complete and 2 incomplete; Skills CLI scope evidence is recorded separately |

## Native project commands

The command owner is package.json and the dependency versions are in package-lock.json.

- npm run lint: ESLint.
- npm run build: Next.js production build.
- npm run dev: local development server.
- npm start: serve a prior build.

Configured checks are `npm run test:unit`, `npm run test:api`, `npm run test:e2e`, `npm run test:coverage`, `npm run test:all`, `npm run lint`, `npx tsc --noEmit`, and `npm run build`. There is no GitHub Actions workflow, Graphify executable, or Foundation checker command. Do not add scripts, hooks, GitHub Actions, or CI gates as part of workflow documentation. For Next.js guidance, use `node_modules/next/dist/docs/` matching the installed version.
