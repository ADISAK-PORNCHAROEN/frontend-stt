# Security standards and project mapping

Read before selecting risks, verification requirements, or abuse cases for a diff. Use SECURITY.md as the reporting-policy owner and docs/SECURITY-MODEL.md as the source-derived boundary owner. No scan or compliance claim is implied by this setup.

## Sources and application

| Source / edition | Principle to apply | Mapping to this repository |
| --- | --- | --- |
| [OWASP Top 10:2025](https://top10.owasp.org/2025/0x00_2025-Introduction/) | Select risk categories from actual changed trust boundaries | Software supply-chain failures (A03:2025) and security misconfiguration (A02:2025) are relevant when package/build/config files change. Other categories need reachable app paths; current source has no identity, persisted data, or public input. |
| [OWASP ASVS 5.0.0](https://github.com/OWASP/ASVS/tree/v5.0.0/5.0) | Use concrete, testable requirements when applicable | No requirement ID is selected for the static starter. The versioned source link was retained; the GitHub tree could not be opened during setup, so exact requirement text remains unread until a relevant boundary is introduced. |
| [OWASP WSTG v4.2](https://wstg.owasp.org/v4.2/4-Web_Application_Security_Testing/) | Select versioned verification scenarios for relevant web boundaries | No WSTG scenario is currently applicable. Reassess client-side, configuration, input, identity, session, or error-handling tests if such paths are added; authorize and identify any local target before dynamic testing. |
| [OWASP Secure Code Review Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Code_Review_Cheat_Sheet.html) | Review incremental diffs, trace data flow, and validate candidate findings | Review every code, dependency, CI, and executable-config diff. Current sources include src/app/page.tsx, package.json, package-lock.json, and next.config.ts; trace any new external input to validation and sinks. |
| [OWASP Secure Coding with AI Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Coding_with_AI_Cheat_Sheet.html) | Review AI-authored code/tests and preserve security boundaries | Check dependency/tool provenance, altered assertions, negative cases, and unchanged controls in the actual patch. No security test suite exists today. |
| [OpenAI Codex Security](https://help.openai.com/en/articles/20001107-codex-security) | Use contextual review, threat models, and isolated validation through the available host capability | Use the host diff workflow for patches when available. This project setup only configures local Markdown guidance; it does not run a Codex Security scan or validate remote access. |

These primary sources were consulted during setup. The ASVS tree fetch was blocked, and no requirement text was selected. Risk categories and source lists are guidance, not proof of compliance.

## Current assets and boundaries

| Asset/boundary | Source or caller | Attacker control and sink | Current control / evidence |
| --- | --- | --- | --- |
| Dependency and build integrity | package.json, package-lock.json, next.config.ts | Changes to versions, scripts, or framework behavior affect installed/build code | Review lockfile/config diffs; run task-required project checks |
| Root route rendering | src/app/page.tsx -> browser | Fixed JSX and local SVGs; no user-controlled or remote values flow into markup | React-rendered static content; inspect any new props/input paths |
| External navigation | Fixed links in src/app/page.tsx | User follows hard-coded Next.js/Vercel destinations | Review destination changes and safe new-tab rel attributes |
| Font/build behavior | src/app/layout.tsx | Framework font integration during the Next build | Read installed Next.js font/config docs for behavior changes |

No session, identity, authorization, database, API, server action, upload, webhook, filesystem-processing, or AI/tool boundary was found. Revisit the model when source adds one.

## Review procedure and evidence

1. Establish patch identity and read the actual diff, including new executable files.
2. Map changed source to caller, attacker control, validation, transformations, sink, and asset.
3. Select only applicable Top 10 categories and exact versioned requirements/scenarios. Read chosen ASVS/WSTG text before citing IDs.
4. Check negative or recovery cases where the changed path creates those risks. Pair behavior assertions with test-engineering when relevant.
5. Validate candidate findings and record confirmed issues, candidates, exclusions, unreviewed areas, and actual tool mode.
6. If the host scanner is unavailable, conduct a bounded manual review and report the limitation. Keep the report in an authorized local artifact.

Use SECURITY.md for external reporting boundaries and docs/TESTING.md for available test commands. No full-repository scan was performed as part of Foundation setup.
