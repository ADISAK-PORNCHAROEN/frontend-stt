# Testing and verification

## Current capabilities

The repository has a Playwright API integration and browser journey harness for the local transcription workflow. No CI workflow is configured. package.json defines these relevant checks:

| Command | Owner | What it checks | Limits |
| --- | --- | --- | --- |
| npm run lint | package.json, using ESLint 9 and eslint-config-next | ESLint configuration and source linting | Not a behavioral test, type check, or security review |
| npm run build | package.json, using next build | Production compilation/build for the installed Next.js version | Does not establish user-facing behavior by itself |
| npm run test:unit | package.json and `vitest.config.ts` | Vitest and Testing Library unit/component tests in jsdom | No browser layout or actual Next.js route boundary |
| npm run test:coverage | package.json and `vitest.config.ts` | V8 coverage over executable files under `src/features/transcription` | Enforces per-file thresholds: 90% lines/functions and 80% branches; no live STT behavior |
| npm run test:api | package.json and `playwright.config.ts` | Same-origin API integration against the controlled loopback STT fixture in Microsoft Edge | Builds the isolated test app in `.next-stt-test`; fixtures prove the frontend contract, not live STT quality or availability |
| npm run test:e2e | package.json and `playwright.config.ts` | Browser journeys and four-state screenshots in Microsoft Edge at desktop and mobile sizes | The screenshot evidence uses synthetic media and is not live STT verification |
| npm run test:all | package.json | Runs unit, API integration, browser journeys, and V8 coverage in sequence | API and browser layers also retain dedicated commands |
| npm run test | package.json and `playwright.config.ts` | All Playwright API and browser specs in Microsoft Edge | Builds the isolated test app in `.next-stt-test`; report output is local and ignored |
| npm run dev | package.json, using next dev | Local development server | Interactive runtime, not an automated test suite |
| npm start | package.json, using next start | Serves a prior production build | Requires a build first |

`npx tsc --noEmit` is the local typecheck command. The Playwright configuration writes its HTML report to ignored `playwright-report/`; verification runs may set `PLAYWRIGHT_HTML_OUTPUT_DIR` and Playwright's `--output` to keep reports and browser screenshots together under ignored `.next/issue-18-artifacts/`. Coverage output stays in ignored `coverage/` by default; verification runs may set `--coverage.reportsDirectory` to that ignored artifact directory.

The Playwright worker starts an in-process service fixture on an ephemeral loopback port, builds the real app into its isolated output directory, then starts a loopback production server. API tests send real HTTP requests through the Next.js routes; browser tests run in the installed Microsoft Edge channel. The fixture supplies deterministic model readiness/defaults, upload values, job states, controlled progress, save/commit failures, immutable original/latest transcript results, and exports. Browser tests cover confirmation/cancel for file replacement and clear, revision snapshot/commit behavior, dirty switching, keyboard dialogs, and selected-revision JSON/TXT/SRT previews and downloads. No test calls the real STT service.

## Selecting evidence

1. Define the expected behavior from `PRODUCT.md` and `docs/agents/current-task.md` before choosing assertions. The workspace covers upload confirmation, model selection, status polling and progress-based estimates, bounded segment replay, immutable revisions and commit recovery, original view, and selected-revision JSON/TXT/SRT preview/export.
2. For pure transformations or state transitions, use unit tests when such logic exists. For interacting route/server/data boundaries, use integration tests. For critical browser journeys, use E2E tests. A missing runner is a gap to report, not a reason to claim that another layer proves the behavior.
3. For UI changes, review semantic markup, keyboard behavior, responsive states, scroll containment, dialog focus, and runtime appearance against `DESIGN.md` and the route's Impeccable surface brief. Use a browser check when the task warrants it; record what was actually observed. A visual inspection does not prove the upload, job, or export flow.
4. Run existing npm scripts only when the task or an established project rule requires them. Select lint/build based on changed surface and report each exact command. These documents do not make either command a new unconditional CI gate.
5. For production behavior changes, add or update a regression test at the narrowest useful layer once an accepted behavior and suitable runner exist. Review test diffs for missing edge cases, weakened assertions, and mocks that bypass the boundary.

## Evidence and ownership

- Use `.agents/skills/test-engineering/SKILL.md` for test design, layer selection, test edits, and reporting.
- Use .agents/skills/security-review/SKILL.md for any code/executable diff; behavioral tests do not replace security review.
- Record command output in the task report or normal review artifact. Keep AI review conclusions separate from lint/build/test output.
- Revisit this guide when test, coverage, E2E, CI, or build configuration is added or changed.
