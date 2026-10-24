# Security reporting

## Policy

No project-specific vulnerability reporting contact, supported-version policy, or response SLA is documented. Do not invent one. Keep findings in authorized local review artifacts until the project owner chooses a reporting destination. Do not publish findings, create external issues, or send code/data outside the repository without authorization for that action.

## Review workflow

Read docs/SECURITY-MODEL.md and use .agents/skills/security-review/SKILL.md for each application-code, dependency, CI, or executable-configuration diff. Use a diff review for changes; run a repository-wide scan only when explicitly requested. Report scope, evidence, validated findings, exclusions, and unreviewed areas. This workflow does not claim OWASP compliance or absence of vulnerabilities.
