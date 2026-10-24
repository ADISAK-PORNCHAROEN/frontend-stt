# Testing standards and project mapping

Read before selecting test layers, interpreting coverage, or reviewing test edits. The Google sources support a risk-based layered strategy; the local mapping below describes what is actually configured here. Keep exact commands in package.json and docs/TESTING.md.

## Sources and application

| Source | Principle to apply | Mapping to this repository |
| --- | --- | --- |
| [Google: How Much Testing is Enough?](https://testing.googleblog.com/2021/06/how-much-testing-is-enough.html) | Document a repeatable strategy; use unit, integration, and E2E checks for critical journeys as the system warrants | docs/TESTING.md records the lack of a current test runner and defines how to select a layer when behavior is added. The root route is src/app/page.tsx, but no product journey is accepted yet. |
| [Google: Code Coverage Best Practices](https://testing.googleblog.com/2020/08/code-coverage-best-practices.html) | Treat coverage as a lossy gap signal alongside other evidence, not a quality score | No coverage tool, measured scope, report, or threshold is configured in package.json. Revisit this mapping if coverage is introduced; inspect uncovered changed branches only when measurable. |
| [Google code review: What to look for](https://google.github.io/eng-practices/review/reviewer/looking-for.html) | Check design, functionality, edge cases, complexity, and appropriate behavior evidence | Derive expectations from user-approved requirements, then trace src/app/page.tsx and affected callers. For visible UI changes, use a browser check when the task warrants it and record what was observed. |
| [OWASP Secure Coding with AI Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Coding_with_AI_Cheat_Sheet.html) | Add adversarial cases where input boundaries exist and independently review AI-authored tests | There is no current public input boundary or test suite. When input, identity, or external data is added, map negative cases to docs/SECURITY-MODEL.md and route security review through the paired local skill. |
| [OpenAI: A Practical Approach to Verifying Code at Scale](https://alignment.openai.com/scaling-code-verification/) | Behavioral tests and code review provide complementary evidence | Pair actual project commands/results with the project-local security-review workflow. Neither substitutes for the other. |

These sources do not establish a universal coverage percentage or mandatory command for this repository. The source pages were read during setup; their relevant guidance is reflected in the mappings above.

## Current test surfaces

| Surface | Source | Available verification | Current limit |
| --- | --- | --- | --- |
| Root route and layout | src/app/page.tsx, src/app/layout.tsx | npm run lint; npm run build; optional task-directed browser inspection | No route behavior test or accepted user journey exists |
| Global styling | src/app/globals.css | Task-directed visual and accessibility review | No screenshot or visual regression suite is configured |
| Build/dependencies/configuration | package.json, package-lock.json, next.config.ts | npm run lint and npm run build when required by the task | Neither command is a security scan; no CI gate is declared |
| Pure domain/data behavior | No such source currently exists | Select a unit-test runner only when the task requires it | No unit-test dependency or test script is configured |
| Coverage and E2E | No configuration found | None | Report as unconfigured; do not claim a pass |

## Select checks from changed behavior

1. Write down the accepted observable outcome before creating assertions.
2. Use unit tests for isolated deterministic logic; integration tests for module, route, persistence, identity, or adapter interactions; E2E for changed critical browser journeys.
3. If a needed layer has no runner, report the gap. Do not silently install dependencies, introduce a project script, or replace an absent suite with lint/build.
4. Run existing commands only when the task or established rules require them. Record exact command, exit/result, revision, and evidence.
5. Review test diffs for meaningful assertions, boundary cases, mocks that bypass the changed behavior, and removed coverage. Preserve existing thresholds and checks if later configured.

## Workflow and evidence

This contract is routed by .agents/skills/test-engineering/SKILL.md and AGENTS.md. Use docs/TESTING.md for the authoritative command inventory and task selection. Connect security-sensitive negative cases to .agents/skills/security-review/SKILL.md and the model in docs/SECURITY-MODEL.md. Do not add Foundation checkers, hooks, or CI.
