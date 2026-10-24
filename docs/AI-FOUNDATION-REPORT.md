# AI project foundation report

## Scope and outcome

Setup writes were confined to repository-local Markdown, project skills, lock metadata, and archive metadata. All 56 skills from `backnotprop/pstack` were installed under `.agents/skills/` with Codex project scope and copy mode. No global install option or user-level Codex configuration path was targeted by the installation commands. No pre/post inventory of global paths was captured, so this report does not assert that their full filesystem state was unchanged. The existing Impeccable source was read-only during comparison.

Status: complete local setup. Project skills: 59 total, including 56 pstack skills and 3 other project skills; local folders complete: 59/59; incomplete: 0. Skills CLI lists all 59 in Codex project scope. Runtime discovery in a fresh session remains unverified.

## Source findings

- package.json pins Next.js 16.4.2, React 19.3.0, and provides npm run dev, build, start, and lint.
- package-lock.json is the dependency lockfile. src/app/page.tsx, src/app/layout.tsx, and src/app/globals.css contain the stock starter page, root layout, and visual styling.
- next.config.ts enables Cache Components, Partial Prefetching, Tailwind Turbopack CSS handling, and experimental.agentFeedback.
- The initial AGENTS.md contained the Next.js-managed agent-rules block and no agent-feedback block. Its exact original bytes were archived before replacement. The existing feedback option was preserved; next dev was not run, so automatic feedback-block generation was not observed.
- No test, typecheck, coverage, E2E, or CI setup, database, API route, server action, identity, or product acceptance was found.
- README.md pointed to app/page.tsx, while the real entry point is src/app/page.tsx; this path was corrected.

## Changes

- Rebuilt AGENTS.md in foundation-v1 layout and retained the Next.js-managed block.
- Added CLAUDE.md as a one-line @AGENTS.md bridge.
- Added architecture, current UI baseline, test-selection, and security-boundary guidance.
- Added complete project-local test-engineering and security-review skill folders under .agents/skills/, including both required internal contracts and local source mappings.
- Registered the complete project-local Impeccable UI skill. Its 63-file folder, including linked references, agent metadata, scripts, and binary, matches the available v4.5.2 source byte-for-byte.
- Installed all 56 skills from `backnotprop/pstack` under `.agents/skills/` with `npx skills add` in Codex project scope and copy mode. Root `skills-lock.json` records their source paths and hashes.
- Added a project skills checklist and manifest inventory for all 59 project skills: 56 from pstack, plus test-engineering, security-review, and Impeccable. All 59 local installations are complete; 0 are incomplete.
- Adapted the project copies of `setup-pstack` and its nine model-routing skills to use `.agents/pstack-models.md`, keeping model settings project-local.
- Configured the user's project-local `large (xhigh)` budget, Luna xhigh for general work, Luna max for the hardest coding tasks, and Sol medium for detailed/judgment roles. Rechecked official model and Codex documentation: Luna supports xhigh; the earlier high-only fallback was based on an incomplete effort list in this chat's agent tool schema.
- Added current task, continuation map, tool routing, delivery list, manifest, archive receipt, and this report.
- Added .gitattributes scoped to immutable archived instructions.
- Made no global skill or settings writes; Codex's documented repository skill location is .agents/skills.

## Capability status

| Capability | Status | Evidence / limit |
| --- | --- | --- |
| Next.js and npm project commands | Configured | package.json and lockfile; commands were not run for this documentation-only setup |
| Project-local test/security skills | Installed and listed by Skills CLI | Both skill folders and contracts are present and routed; the review guidance was consulted, and no project test command was run |
| Impeccable UI skill | Installed and listed in active project catalog | Complete 63-file project-local copy byte-for-byte matches the available upstream v4.5.2 source; no UI command was invoked |
| Pstack skills | Installed in project scope | 56/56 pstack folders are under `.agents/skills/`, with source entries in `skills-lock.json`; fresh-session runtime discovery was not tested |
| Pstack model map | Configured in project scope | `.agents/pstack-models.md` contains all 17 roles; the setup skill and nine model-routing skills read this file; no user-level file was written |
| Project skill checklist | Complete | `docs/agents/skills-checklist.md` records 59 total skills, 59 complete local folders, 0 incomplete, CLI project-scope listing, and no fresh-session retest |
| CLAUDE bridge | Configured | CLAUDE.md imports AGENTS.md; Claude host loading was not exercised |
| Next.js agent rules | Present and preserved | Marker-delimited block retained; installed generator inspected; no dev server run |
| Next.js agent feedback | Configured, host behavior unobserved | experimental.agentFeedback remains enabled; no feedback block existed in the initial guide and next dev was not run |
| Project planning/ticket routing | Conditional | Guide preserves `$to-spec` and `$to-tickets` host routes only when the user selects them and the matching skill is available/permitted; neither was selected or verified in this setup, and no tracker is configured |
| Behavioral tests, E2E, coverage, CI | Not configured | No runner or workflow was found |
| Security review | Codex Security diff scan completed | Scan `bdcce897-4219-4696-91f1-60c2f88ffcfd` reviewed 34 executable/configuration rows in the setup working-tree snapshot. It reported two low-severity findings in Impeccable and three deferred candidates across pstack and Impeccable; this was not a full repository scan or a fix verification. |
| Product acceptance | Unavailable | No user-approved product direction or behavior exists yet |
| Vulnerability disclosure contact | Unavailable | No project-specific channel or SLA was found; do not invent one |

## Delivery register

See [document-delivery.md](agents/document-delivery.md) for per-file applicability, source evidence, content review, links/checks, and remaining work. See [skills-checklist.md](agents/skills-checklist.md) for selected-skill totals and readiness. See [foundation.json](agents/foundation.json) for required paths, skill inventory, managed-block status, and archive hash.

## Required source and migration evidence

- Next.js installed docs read: AI coding agent guide, managed agent rules and feedback references, App Router layouts/pages, and source file node_modules/next/dist/server/lib/generate-agent-files.js. The verified generator replaces only marker-delimited blocks.
- Codex official docs read for project skill paths: [Customization: Skills](https://learn.chatgpt.com/docs/customization/overview#skills). It documents repo skills in .agents/skills; the installed project skills are stored under this repository.
- Google testing guidance, OWASP Top 10:2025, WSTG v4.2, OWASP secure review/AI guidance, and OpenAI code verification / Codex Security guidance were consulted and retained in the two local contracts.
- OWASP ASVS 5.0.0 URL was retained, but opening its GitHub tree was blocked. No ASVS requirement ID was selected.
- The active root instructions were replaced after archiving original bytes. Archive SHA-256: 063098f6cb31bb44c6f8fbea25b3876de7ee1e5f7d00a50dbab506f6415eb7f0.

## Review and project commands

- Independent AI document review: the first fresh review found three documentation inconsistencies (archive filename suffix, external-link count, and test-skill routing scope), which were corrected. A final independent review checked the manifest, skill counts, local routes, Impeccable copy, and scoped global-write statements; it found no remaining issues.
- Fresh-agent route exercise: an independent review agent checked an unspecified behavior request and a dependency/configuration diff. The first routes to clarify/record accepted product behavior; the second routes to both local review skills. This was not a new desktop Codex session and does not verify fresh-session skill loading.
- Skill install and setup check: `npx --yes skills add backnotprop/pstack --skill "*" --agent codex --copy --yes --json` reported 56 project-scope pstack skills. `npx --yes skills list --agent codex --json` reported 59 project-scope entries and 0 global-scope entries in that listing. All 59 skill folders contain `SKILL.md`; root `skills-lock.json` contains 56 pstack source entries. The user selected project-only model settings and the `large — xhigh reasoning` budget: Luna xhigh for general work, Luna max for hardest code work, and Sol medium for detailed work. Official documentation confirms Luna supports xhigh; this chat's agent tool schema does not list xhigh, so live dispatch of that effort through this specific tool surface was not verified. The setup and model-routing skill copies were adapted to read the project-local file. No pre/post inventory of global filesystem paths was captured. Fresh-session runtime discovery was not tested. The Impeccable folder's 63 files match the available v4.5.2 source byte-for-byte.
- Security scan findings: the completed setup diff scan reported (1) a low-severity candidate where page-provided `data-astro-source-file` is passed as a preferred path without a visible repository-root check in the reviewed skill material, and (2) a low-severity candidate where sidecar component HTML is inserted into an app-origin panel using `innerHTML`. Both require the Impeccable Live workflow and user interaction; server-side validation was opaque or not established. Three additional candidates were deferred because impact or validation could not be established from the reviewed snapshot: terminal escape handling for GitHub data, asset path handling in an opaque producer, and a JavaScript URL in a Raw Markdown tab. No app code was changed and none of these candidates was fixed as part of installation. Scan artifact: ID `bdcce897-4219-4696-91f1-60c2f88ffcfd`; snapshot digest `codex-security-snapshot/v1:sha256:027c248cebe3bd9b5c1bca59c232b4d5720a1297d7c93ff4f8d4425599e82405`. Daybreak access was not available.
- Structural checks: all manifest paths and Markdown local links resolve; the installed Next.js helper reports its managed block is current; its marker-delimited block matches the preserved original; archive bytes and the temporarily staged Git blob match the recorded SHA-256; `.gitattributes` reports `text: unset` for the archive. Temporary staging was undone and the Git index is clean.
- Existing project commands run: none. This was documentation-only and repository instructions did not require lint/build for Markdown changes. No test or build result is claimed.

## Remaining limits and continuation

No application test suite or CI is configured. No product behavior was inferred. All requested pstack skills and model settings are project-local; no global installation option or user-level settings path was used. A new `frontend-stt` session has not been opened to recheck runtime skill discovery, and Claude host loading was not exercised. The next product task needs an accepted user goal and observable acceptance in docs/agents/current-task.md.
