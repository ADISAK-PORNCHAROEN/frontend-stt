---
name: security-review
description: Review every application-code, executable-configuration, dependency or CI diff for security regressions before a change is handed off. Use for code changes; use a full repository audit only when explicitly requested.
---

# Security review

## Method and project context

Before selecting risks, verification requirements, or abuse cases, read [security standards and project mapping](references/review-contract.md), SECURITY.md, and docs/SECURITY-MODEL.md. The contract maps each source to current application boundaries; the model describes only observed source facts.

## Workflow

1. Read AGENTS.md, the accepted behavior, security reporting policy, and the actual source diff, including untracked executable files. Trace changed inputs, transformations, and sinks through their callers and boundaries.
2. For every application-code, dependency, CI, or executable-configuration diff, use the available host security diff-review skill. In Codex, invoke $codex-security:security-diff-scan when that capability is available. Use a whole-repository scan only when the user explicitly requests one.
3. Apply OWASP Top 10:2025 to select relevant risks. Read specific ASVS 5.0.0 requirements or WSTG v4.2 scenarios only when the changed boundary makes them applicable; record versioned IDs and actual verification.
4. Validate candidates against reachability, attacker preconditions, existing controls, and impact. Separate confirmed findings, candidates, exclusions, and unreviewed scope. Do not fix or publish findings unless authorized.
5. If the host diff scanner is unavailable, perform a bounded manual diff review and say automated scanning was unavailable. Do not imply that a manual review was an automated scan.

## Project boundaries and recovery

This is a single-user, loopback-only transcription workspace. Review local media upload at `src/app/api/stt/` and the fixed loopback adapter in `src/lib/stt-service/proxy.ts`; the browser API client and playback/transcript UI live under `src/features/transcription/`. The app has no account, authentication, database, transcript archive, or durable browser state. The STT service and its responses are separate trust boundaries. Reassess these limits when source or accepted product scope changes. Keep findings local under `SECURITY.md` unless the owner authorizes another destination.

## Completion

Record the reviewed base/head or dirty scope, changed paths, actual tool/mode, selected requirements and cases, validated findings, evidence, exclusions, and coverage gaps. Cite source locations and attacker preconditions. A clean result applies only to the reviewed scope; it is not a security certification.

## References

Detailed source roles and repository mappings are in references/review-contract.md.

- [OWASP Top 10:2025](https://top10.owasp.org/2025/0x00_2025-Introduction/)
- [OWASP ASVS 5.0.0](https://github.com/OWASP/ASVS/tree/v5.0.0/5.0)
- [OWASP WSTG v4.2](https://wstg.owasp.org/v4.2/4-Web_Application_Security_Testing/)
- [OWASP Secure Code Review Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Code_Review_Cheat_Sheet.html)
- [OWASP Secure Coding with AI Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Coding_with_AI_Cheat_Sheet.html)
- [OpenAI Codex Security](https://help.openai.com/en/articles/20001107-codex-security)
