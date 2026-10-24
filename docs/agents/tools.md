# AI workflow and tool entry points

## Project-local skills

Project skills are stored under `.agents/skills/` in this repository. `skills-lock.json` records the 56 skills from `backnotprop/pstack`; `docs/agents/foundation.json` inventories those alongside the three other project skills. The install targeted Codex project scope and did not use the global option. No before/after inventory of global paths was captured, so the evidence is about the install target and CLI scope listing.

| Workflow | Trigger and inputs | Authoritative sources | Output and limits |
| --- | --- | --- | --- |
| Test engineering | Any application-code, dependency, CI, or executable-configuration diff; also behavior changes, test authoring, or test review | AGENTS.md, docs/TESTING.md, .agents/skills/test-engineering/SKILL.md and its testing contract | Evidence-backed layer selection, exact commands/results, and skipped checks; no test runner is configured today |
| Security review | Any application-code, dependency, CI, or executable-configuration diff | SECURITY.md, docs/SECURITY-MODEL.md, .agents/skills/security-review/SKILL.md and its review contract | Patch scope, trust-boundary evidence, validated findings and coverage gaps; not a whole-repository certification |
| Frontend/UI design | Any user-requested frontend design, critique, audit, or interface improvement | DESIGN.md, current source, and `.agents/skills/impeccable/SKILL.md` | The complete project-local Impeccable skill is installed and appears in the active Codex catalog; follow its command and reference routing |
| Pstack skills | When a task matches a skill description or the user invokes it | The matching `.agents/skills/<name>/SKILL.md`; `skills-lock.json` is the source inventory; `.agents/pstack-models.md` is the project model map | All 56 pstack skills are installed for Codex project scope. The project copies of model-routing skills read `.agents/pstack-models.md`; `setup-pstack` writes there. Honor each skill's trigger and invocation policy. Current-session runtime discovery after installation has not been checked |
| Skill readiness | Setup, upgrade, or skill-routing change | `docs/agents/skills-checklist.md`, `docs/agents/foundation.json`, and `skills-lock.json` | CLI confirms 56 pstack skills and 3 other project skills in Codex project scope; fresh-session discovery remains unobserved |
| Feature/spec planning | When the user selects a planning or spec workflow and the intent is ready | `docs/agents/current-task.md`, `docs/agents/issue-tracker.md`; use host `$to-spec` only if available and its invocation policy allows | Canonical spec files live in `docs/specs/`; the project uses local Markdown ticket files and does not create external issues by default |
| Ticket workflow | When the user selects ticket creation or tracking | `docs/agents/issue-tracker.md`; one file per ticket under `.scratch/<feature-slug>/issues/`; use host `$to-tickets` only if available and permitted | Local ticket files use `ready-for-agent`; external tracker writes require explicit user authorization and a configured destination |

## Native project commands

The command owner is package.json and the dependency versions are in package-lock.json.

- npm run lint: ESLint.
- npm run build: Next.js production build.
- npm run dev: local development server.
- npm start: serve a prior build.

There is no configured test, typecheck, coverage, E2E, CI, graph-discovery, or Foundation checker command. Do not add scripts, hooks, or CI gates as part of workflow documentation. For Next.js guidance, use node_modules/next/dist/docs/ matching the installed version.
