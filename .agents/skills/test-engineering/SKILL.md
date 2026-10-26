---
name: test-engineering
description: Design, add and run the right unit, integration, E2E and coverage checks for application behavior changes or test-authoring requests. Use for code and test changes.
---

# Test engineering

## Method and project context

Before choosing test layers, interpreting coverage or reviewing test edits, read [testing standards and project mapping](references/testing-contract.md). It owns the detailed source-to-project mapping. Read AGENTS.md and docs/TESTING.md for current boundaries, accepted behavior, available commands, and evidence limits.

## Workflow

1. Establish the accepted behavior in `PRODUCT.md` and `docs/agents/current-task.md`, then inspect the relevant source and callers before editing.
2. Add or update a regression test for each production behavior change at the narrowest layer that proves the contract. Include boundary, invalid-input, permission, exceptional, or recovery cases when the changed behavior creates those risks.
3. Choose unit tests for local logic, integration tests for interacting boundaries, and E2E for changed critical user journeys. Do not claim a layer passed when it was skipped or is not configured.
4. Use actual commands from package.json. When changed behavior touches the transcription feature, preserve the configured V8 thresholds of at least 90% line/function and 80% branch coverage for executable feature source.
5. Review test diffs for deleted cases, weakened assertions, mocks that replace the behavior under test, and expectations copied from the implementation. Keep prior failures separate from regressions.

## Project execution and recovery

- Repository root: the directory containing package.json.
- `npm run test:unit` runs Vitest and Testing Library; `npm run test:api` runs same-origin API integration in Playwright against the controlled fixture; `npm run test:e2e` runs browser journeys and visual states in Microsoft Edge; `npm run test:coverage` measures V8 coverage; and `npm run test:all` runs those layers in sequence.
- `npm run lint` runs ESLint, `npx tsc --noEmit` runs TypeScript, and `npm run build` runs the installed Next.js production build. Select checks according to the changed behavior and project instructions.
- Playwright reports and coverage output are local and ignored. No GitHub Actions or CI workflow is configured. Do not add scripts, dependencies, hooks, or CI without a separate request.
- For Next.js behavior or framework errors, read the installed guide/error page under node_modules/next/dist/docs/ before applying a fix.

## Completion

Report exact commands and observed results, revision/dirty scope, selected and skipped test layers, coverage scope/gaps, inspected artifacts, and the project requirement tested. Passing tests or high coverage alone do not establish correctness or security.

## References

The detailed method and local mappings are in references/testing-contract.md.

- [Google: How Much Testing is Enough?](https://testing.googleblog.com/2021/06/how-much-testing-is-enough.html)
- [Google: Code Coverage Best Practices](https://testing.googleblog.com/2020/08/code-coverage-best-practices.html)
- [Google code review: What to look for](https://google.github.io/eng-practices/review/reviewer/looking-for.html)
- [OWASP Secure Coding with AI Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Coding_with_AI_Cheat_Sheet.html)
- [OpenAI: A Practical Approach to Verifying Code at Scale](https://alignment.openai.com/scaling-code-verification/)
