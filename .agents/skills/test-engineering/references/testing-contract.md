# Testing standards and project mapping

Read before selecting test layers, interpreting coverage, or reviewing test edits. The Google sources support a risk-based layered strategy; the local mapping below describes what is actually configured here. Keep exact commands in package.json and docs/TESTING.md.

## Sources and application

| Source | Principle to apply | Mapping to this repository |
| --- | --- | --- |
| [Google: How Much Testing is Enough?](https://testing.googleblog.com/2021/06/how-much-testing-is-enough.html) | Document a repeatable strategy; use unit, integration, and E2E checks for critical journeys as the system warrants | `docs/TESTING.md` maps configured Vitest, Playwright API integration, and browser journey commands to file selection, same-origin upload, job tracking, playback, transcript review, and exports. |
| [Google: Code Coverage Best Practices](https://testing.googleblog.com/2020/08/code-coverage-best-practices.html) | Treat coverage as a lossy gap signal alongside other evidence, not a quality score | V8 coverage measures executable transcription-feature source. Preserve the configured per-file thresholds of at least 90% line/function and 80% branch coverage, and inspect uncovered changed branches when coverage is relevant. |
| [Google code review: What to look for](https://google.github.io/eng-practices/review/reviewer/looking-for.html) | Check design, functionality, edge cases, complexity, and appropriate behavior evidence | Derive expectations from `PRODUCT.md`, then trace `src/features/transcription/`, `src/app/api/stt/`, `src/lib/stt-service/proxy.ts`, and affected callers. For visible UI changes, use a browser check when warranted and record what was observed. |
| [OWASP Secure Coding with AI Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Coding_with_AI_Cheat_Sheet.html) | Add adversarial cases where input boundaries exist and independently review AI-authored tests | Local media upload and the STT service response are trust boundaries. Map negative cases to `docs/SECURITY-MODEL.md` and route security review through the paired local skill. |
| [OpenAI: A Practical Approach to Verifying Code at Scale](https://alignment.openai.com/scaling-code-verification/) | Behavioral tests and code review provide complementary evidence | Pair actual project commands/results with the project-local security-review workflow. Neither substitutes for the other. |

These sources do not establish a universal coverage percentage or mandatory command for this repository. The source pages were read during setup; their relevant guidance is reflected in the mappings above.

## Current test surfaces

| Surface | Source | Available verification | Current limit |
| --- | --- | --- | --- |
| Workspace and playback | `src/app/page.tsx`, `src/features/transcription/` | `npm run test:unit`, `npm run test:e2e`, `npm run test:coverage`; visual review for changed UI journeys | Browser tests use synthetic media and the controlled fixture, not the real STT service |
| Same-origin API and service proxy | `src/app/api/stt/`, `src/lib/stt-service/proxy.ts`, `src/features/transcription/api.ts` | `npm run test:api` through the real Next.js routes and controlled loopback fixture | Fixture evidence proves the frontend boundary contract, not live service behavior |
| Global styling | `src/app/tailwind.css`, `DESIGN.md`, `.impeccable/surfaces/` | `npm run test:e2e` visual-state screenshots and task-directed accessibility review | Screenshots are test evidence, not a pixel-diff suite |
| Build/dependencies/configuration | `package.json`, `package-lock.json`, `next.config.ts` | `npm run lint`, `npx tsc --noEmit`, and `npm run build` as required by the task | These checks are not a security scan; no CI gate is declared |
| Pure domain/data behavior | `src/features/transcription/` | `npm run test:unit` | Keep deterministic logic assertions focused on observable behavior |
| Coverage and E2E | `vitest.config.ts`, `playwright.config.ts`, `tests/` | `npm run test:coverage`, `npm run test:e2e`, or `npm run test:all` | Reports stay in ignored local output; thresholds apply to executable transcription-feature source |

## Select checks from changed behavior

1. Write down the accepted observable outcome before creating assertions.
2. Use unit tests for isolated deterministic logic; integration tests for module, route, persistence, identity, or adapter interactions; E2E for changed critical browser journeys.
3. If a needed layer has no runner, report the gap. Do not silently install dependencies, introduce a project script, or replace an absent suite with lint/build.
4. Run existing commands only when the task or established rules require them. Record exact command, exit/result, revision, and evidence.
5. Review test diffs for meaningful assertions, boundary cases, mocks that bypass the changed behavior, and removed coverage. Preserve existing thresholds and checks if later configured.

## Workflow and evidence

This contract is routed by .agents/skills/test-engineering/SKILL.md and AGENTS.md. Use docs/TESTING.md for the authoritative command inventory and task selection. Connect security-sensitive negative cases to .agents/skills/security-review/SKILL.md and the model in docs/SECURITY-MODEL.md. Do not add Foundation checkers, hooks, or CI.
