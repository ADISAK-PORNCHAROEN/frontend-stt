# Continuation map

## Current state

- Application source is still the stock Next.js starter; no product feature is accepted.
- Shared project rules are in AGENTS.md, with the Claude bridge in CLAUDE.md.
- Architecture and UI baseline: docs/ARCHITECTURE.md and DESIGN.md.
- Test and security workflows: docs/TESTING.md, SECURITY.md, docs/SECURITY-MODEL.md, and their project-local skills under .agents/skills/.
- Specialized workflows: 56 pstack skills live under `.agents/skills/`; see `skills-lock.json` for the source inventory, each skill's `SKILL.md` for its trigger, and `.agents/pstack-models.md` for project-local model routing. CLI confirms all 59 project skills are installed for Codex; runtime discovery in a fresh session has not been checked.
- UI design workflow: DESIGN.md and the complete project-local .agents/skills/impeccable/ skill.
- Exact delivery and review status: docs/agents/document-delivery.md and docs/AI-FOUNDATION-REPORT.md.

## Representative journey: a future root-page behavior change

1. Start from a user-accepted behavior in docs/agents/current-task.md; none exists yet.
2. Trace the root route from src/app/page.tsx through src/app/layout.tsx and src/app/globals.css.
3. Select behavior evidence using docs/TESTING.md and the test-engineering skill. The project currently has no behavioral test runner.
4. Review the code diff against docs/SECURITY-MODEL.md using security-review. Choose lint/build only when required by the task or an established project rule.
5. Record actual evidence, findings, and skipped checks before handoff.

This is a routing example, not acceptance for a feature. No application command was run during this documentation-only setup.
