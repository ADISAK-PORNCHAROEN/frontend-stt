# Security standards and project mapping

Read before selecting risks, verification requirements, or abuse cases for a diff. Use SECURITY.md as the reporting-policy owner and docs/SECURITY-MODEL.md as the source-derived boundary owner. No scan or compliance claim is implied by this setup.

## Sources and application

| Source / edition | Principle to apply | Mapping to this repository |
| --- | --- | --- |
| [OWASP Top 10:2025](https://top10.owasp.org/2025/0x00_2025-Introduction/) | Select risk categories from actual changed trust boundaries | Supply-chain and security-misconfiguration risks apply to dependency/build/config changes. For upload and proxy paths, select input-validation, access-control, and unsafe-output risks only when the changed source makes them reachable; the app has no accounts or durable data. |
| [OWASP ASVS 5.0.0](https://github.com/OWASP/ASVS/tree/v5.0.0/5.0) | Use concrete, testable requirements when applicable | No requirement ID is selected for this setup. Read exact versioned text before citing a requirement for upload, origin checks, proxy configuration, or response handling. |
| [OWASP WSTG v4.2](https://wstg.owasp.org/v4.2/4-Web_Application_Security_Testing/) | Select versioned verification scenarios for relevant web boundaries | Select exact scenarios when a change touches local upload, same-origin enforcement, response handling, or error recovery. Identify and authorize any local dynamic-test target before testing. |
| [OWASP Secure Code Review Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Code_Review_Cheat_Sheet.html) | Review incremental diffs, trace data flow, and validate candidate findings | Review every code, dependency, CI, and executable-config diff. Current sources include `src/app/api/stt/`, `src/lib/stt-service/proxy.ts`, `src/features/transcription/api.ts`, `package.json`, `package-lock.json`, and `next.config.ts`; trace uploaded media and service responses through validation and sinks. |
| [OWASP Secure Coding with AI Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Coding_with_AI_Cheat_Sheet.html) | Review AI-authored code/tests and preserve security boundaries | Check dependency/tool provenance, altered assertions, negative cases, and unchanged controls in the actual patch. No security test suite exists today. |
| [OpenAI Codex Security](https://help.openai.com/en/articles/20001107-codex-security) | Use contextual review, threat models, and isolated validation through the available host capability | Use the host diff workflow for patches when available. Project-local skill setup does not install the host scanner or imply that it ran. |

These primary sources were consulted during setup. The ASVS tree fetch was blocked, and no requirement text was selected. Risk categories and source lists are guidance, not proof of compliance.

## Current assets and boundaries

| Asset/boundary | Source or caller | Attacker control and sink | Current control / evidence |
| --- | --- | --- | --- |
| Local media upload | Browser file → `src/app/api/stt/jobs/route.ts` → service adapter | File bytes, filename, multipart shape, claimed length, and request origin reach the loopback service | UI checks aid usability; the route checks same-origin and streams within a body limit; verify actual code for every relevant diff |
| App network exposure | `package.json` dev/start commands and Next.js routes | A local HTTP server can submit jobs or read job results | Scripts bind Next.js to loopback; reassess before LAN, tunnel, container, or public exposure |
| App-to-service proxy | `src/lib/stt-service/proxy.ts` | Service URL, redirects, status, headers, and response bodies | Fixed/configured HTTP loopback URL, server-only adapter, redirects rejected, response headers constrained, and responses uncached |
| Upstream path construction | `src/app/api/stt/` and proxy adapter | Job ID and export format influence a service request path | Validate identifiers and keep export formats a closed set before building paths |
| Transcript and download output | Service result → `src/features/transcription/` and API routes | Transcript text and download headers are service-controlled | Render text as text; validate JSON into domain types; constrain pass-through headers and disable caching |
| Dependency/build integrity | `package.json`, `package-lock.json`, `next.config.ts` | Versions, scripts, and framework configuration alter installed or built code | Review dependency/config diffs and run task-required project checks |

The app has no identity, authorization, database, transcript archive, webhook, or persistent browser state. The loopback-only assumption is part of the access boundary; revisit it before exposing the app beyond the same computer.

## Review procedure and evidence

1. Establish patch identity and read the actual diff, including new executable files.
2. Map changed source to caller, attacker control, validation, transformations, sink, and asset.
3. Select only applicable Top 10 categories and exact versioned requirements/scenarios. Read chosen ASVS/WSTG text before citing IDs.
4. Check negative or recovery cases where the changed path creates those risks. Pair behavior assertions with test-engineering when relevant.
5. Validate candidate findings and record confirmed issues, candidates, exclusions, unreviewed areas, and actual tool mode.
6. If the host scanner is unavailable, conduct a bounded manual review and report the limitation. Keep the report in an authorized local artifact.

Use SECURITY.md for external reporting boundaries and docs/TESTING.md for available test commands. No full-repository scan was performed as part of Foundation setup.
