# Testing and verification

## Current capabilities

The repository has no configured unit, integration, browser E2E, or coverage test runner. No CI workflow was found. package.json defines only these scripts:

| Command | Owner | What it checks | Limits |
| --- | --- | --- | --- |
| npm run lint | package.json, using ESLint 9 and eslint-config-next | ESLint configuration and source linting | Not a behavioral test, type check, or security review |
| npm run build | package.json, using next build | Production compilation/build for the installed Next.js version | Does not establish user-facing behavior by itself |
| npm run dev | package.json, using next dev | Local development server | Interactive runtime, not an automated test suite |
| npm start | package.json, using next start | Serves a prior production build | Requires a build first |

There is no test, typecheck, coverage, or E2E script in package.json. The repository does not define a mandatory test baseline or coverage threshold. Do not invent one or report an unconfigured check as passed.

## Selecting evidence

1. Define the expected behavior from `PRODUCT.md` and `docs/agents/current-task.md` before choosing assertions. The first accepted feature is a local-first transcription workspace with upload, status polling, playback seek, transcript display, and TXT/SRT export.
2. For pure transformations or state transitions, use unit tests when such logic exists. For interacting route/server/data boundaries, use integration tests. For critical browser journeys, use E2E tests. A missing runner is a gap to report, not a reason to claim that another layer proves the behavior.
3. For UI changes, review semantic markup, keyboard behavior, responsive states, and runtime appearance against `DESIGN.md` and the route's Impeccable surface brief. Use a browser check when the task warrants it; record what was actually observed. A visual inspection does not prove the upload, job, or export flow.
4. Run existing npm scripts only when the task or an established project rule requires them. Select lint/build based on changed surface and report each exact command. These documents do not make either command a new unconditional CI gate.
5. For production behavior changes, add or update a regression test at the narrowest useful layer once an accepted behavior and suitable runner exist. Review test diffs for missing edge cases, weakened assertions, and mocks that bypass the boundary.

## Evidence and ownership

- Use .agents/skills/test-engineering/SKILL.md for test design, layer selection, test edits, and reporting.
- Use .agents/skills/security-review/SKILL.md for any code/executable diff; behavioral tests do not replace security review.
- Record command output in the task report or normal review artifact. Keep AI review conclusions separate from lint/build output.
- Revisit this guide when test, coverage, E2E, CI, or build configuration is added or changed.
