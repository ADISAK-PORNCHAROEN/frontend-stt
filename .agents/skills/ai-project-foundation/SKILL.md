---
name: ai-project-foundation
description: Set up AI coding workflows with Markdown instructions and AI-agent skills, then review them against source. Project checks use agents and Markdown criteria; this skill provides no checker scripts or hooks. Use for onboarding, audits or documents-only adoption, not routine feature implementation.
---

# AI Project Foundation

Establish product goals, system boundaries, coding conventions and verifiable outcomes for AI-assisted development. Adapt to the destination's native stack and preserve existing decisions.

## Reuse

Install this skill into a project with the Skills CLI:

```sh
npx skills add https://github.com/ADISAK-PORNCHAROEN/ai-project-foundation/tree/main/.agents/skills/ai-project-foundation --agent codex --copy
```

This is the project-local installation route. The repository README describes a separate personal/global route through `skill-installer`; a global copy does not satisfy a project-local setup. After this command, invoke `$ai-project-foundation` in the target project. The repository includes a fixed five-skill project bundle in `assets/project-skills/manifest.json`; Foundation copies those complete folders during `setup`. This command installs the Foundation setup skill, not the five project skills directly. The Impeccable bundle contains its full upstream v4.7.0 skill tree plus upstream `LICENSE` and `NOTICE.md` files (64 files total), including five upstream JavaScript support files. Copying the bundle does not install the separate Impeccable or Graphify executable or configure hooks. Foundation creates no checker/helper scripts. See [OpenAI: Build skills](https://learn.chatgpt.com/docs/build-skills) and the [standard bundle manifest](assets/project-skills/manifest.json).

```text
Use $ai-project-foundation to set up this project's AI coding workflow.
Inspect this project's source and owner-provided decisions. Write project-specific
AGENTS.md rules, make CLAUDE.md contain only @AGENTS.md, and create PRODUCT.md,
CONTEXT.md, DESIGN.md and SECURITY.md from project evidence, recording unknowns.
For normal setup, install and checklist all five skills in the bundled standard
manifest as complete project-local folders. Honor a documents-only limit. Preserve
existing controls; do not add Foundation-owned .js/.mjs checkers or helper scripts,
and do not configure hooks during setup. Preserve the five upstream Impeccable
JavaScript support files in its full package. Report package and discovery status
separately.
```

An invocation to set up/adopt the workflow defaults to `setup`: create applicable project instructions and AI-agent skills, then have the relevant agent review them against the source. Use `audit` for inspection requests and `documents-only` when the user limits work to documents. Tool installation and executable automation are separate, explicit requests. Read [Setup contract](references/setup-contract.md) for required deliverables, applicability and completion; it governs every setup branch.

## Read by branch

| When | Reference |
| --- | --- |
| Setup/adoption scope, required deliverables or incomplete rollout | [Setup contract](references/setup-contract.md) |
| New/existing onboarding or starting/resuming a feature | [Project workflow](references/project-workflow.md) |
| Writing or merging agent/product/design/architecture documents | [Document blueprints](references/document-blueprints.md) |
| Impeccable UI task or DESIGN.md pattern, or database Mermaid/mermaid.html prompts | [Setup prompts](references/setup-prompts.md) |
| Discovery, design tooling, tests, coverage, E2E or CI | [Tooling and quality](references/tooling-and-quality.md) |
| Per-change security review or test selection | [Secure and test workflows](references/secure-testing-workflows.md) |
| AI-skill routing, existing project commands or experiment cleanup | [Tool entry points](references/tool-entrypoints.md) |
| Hook requests, supported hosts or hook installation boundaries | [Hook-management contract](assets/project-skills/hook-management/references/hook-change-contract.md) |
| Reviewing project requirements, source or existing work | [AI-agent review](references/ai-agent-review.md) |
| Persistence, identities, public input, external integration or AI/tool risks | [Schema and security](references/schema-and-security.md) |
| Multi-session work or module/data boundary changes | [Execution and boundaries](references/execution-and-boundaries.md) |
| Changing skill routing or measuring quality/cost | [Skill evaluation](references/skill-evaluation.md) |

Load only relevant branches. This workflow connects existing controls; it does not prescribe model roles, replace the stack or interview the user for every task.

## 1. Discover scope and current capabilities

1. Read effective repository/host/nested instructions. Inspect the working tree and preserve existing work.
2. Establish `audit`, `documents-only` or `setup` from the request and existing authorization. Setup authorizes reversible Markdown and AI-skill changes; apply the setup contract and do not infer authorization to add executable checks or hooks.
3. Build the setup worklist from the request, source and applicable deliverables. Inspect only the manifests, configuration, source and reports needed for that worklist. Follow the [Graphify workflow](references/tooling-and-quality.md#graphify) only when code/content discovery is needed, then confirm relevant results against current source.
4. Identify users, product goals, critical journeys, data ownership, deployment boundaries and supplied design references. Ask only for consequential information that cannot be inferred; continue independent work.
5. Record capability, source/config, status, gap and next action. Distinguish `available`, `configured`, `verified`, `unavailable` and `not applicable`.
6. Choose the new/existing branch from source/manifests, capture its baseline and follow the rollout guide. Preserve pre-existing host, upstream and project skills; update only exact Foundation-owned paths. Enumerate the requested and workflow-routed skills, install them at the requested scope, and verify each selected skill's full package inventory as well as discovery. A project-only request requires selected project skills under a supported project-local path and forbids global changes. For an existing older Foundation install, remove legacy Foundation checker artifacts and references plus verified Foundation-owned `to-spec`/`to-ticket`/`to-tickets` skill copies/routes; verify their absence under the [migration contract](references/ai-agent-review.md#upgrade-from-an-older-foundation-install). Verify named upstream skills such as Impeccable before routing them; do not treat disk presence alone as discoverability or invoke explicit-only skills automatically.

Exit: native stack/package manager, effective rules, edit scope and evidenced gaps are known; product/design assumptions are explicit.

## 2. Establish document ownership

Read [document migration and the new guide format](references/document-blueprints.md#instruction-migration) before writing shared instructions. Rebuild the active AGENTS.md from that guide, archive its exact original first, and move valid product/architecture/history facts to their owners. Retain verified host-managed blocks and current project rules within the new layout. Create every required setup record even when its facts are not established; state the unknown and next owner decision without inventing product commitments:

| Artifact | Owns | Read for |
| --- | --- | --- |
| `AGENTS.md` | Shared rules, navigation, quality gates and action boundaries | Work in that scope |
| `CLAUDE.md` | One-line shared-rule import, `@AGENTS.md` | Every standard setup |
| `PRODUCT.md` | Owner-approved purpose, users, journeys, acceptance, scope and unresolved decisions | Every setup; behavior changes |
| `CONTEXT.md` | Confirmed project-specific domain vocabulary, or an explicit “none confirmed yet” state | Every setup; domain modeling |
| `DESIGN.md` | Source-observed visual system and accepted interaction direction | Every setup; UI work |
| `docs/ARCHITECTURE.md` | Boundaries, entry points and data flow | Structure/integration changes |
| Native API contract | Requests/responses/events and compatibility | API/integration changes |
| `docs/SCHEMA.md` | Entities, constraints, ownership, ERD and migrations | Persistence changes |
| `docs/TESTING.md` | Suite selection, isolation, coverage and reports | Verification |
| `SECURITY.md` | Owner-approved reporting policy and security-model pointer, with unknowns explicit | Every setup; security maintenance |
| `docs/SECURITY-MODEL.md` | Trust boundaries, abuse cases and invariants | Risky paths |
| `docs/agents/skills-checklist.md` | Selected project skills, install completeness and discovery status | Setup and skill changes |
| Standard project skills | Five complete project-local skill packages named in the bundled manifest | Every normal setup |
| `docs/adr/` | Consequential trade-offs and decision rationale | Durable decisions |

Names are navigation conventions, not automatic loading. Put conditional pointers in `AGENTS.md` or task skills. Keep each rule authoritative in one place; use imports/links elsewhere. Preserve host-specific rules. Record durable conventions in repository instructions and task-only restrictions in the task record.

Exit before AI review: use the [document delivery list](references/document-blueprints.md#document-acceptance) to review each canonical document separately and resolve known local defects. Create or refresh `AGENTS.md`, `CLAUDE.md`, `PRODUCT.md`, `CONTEXT.md`, `DESIGN.md` and `SECURITY.md` from the destination's source, current decisions and accepted owner evidence. These six files are required in every setup unless explicitly excluded. Record unknowns and the evidence checked; never invent intent, product decisions, design choices or security policy. `AGENTS.md` contains project-specific AI rules; `CLAUDE.md` contains exactly `@AGENTS.md`. Keep every path in the manifest and delivery list, then review content against actual source. Report semantic review and unobserved host loading separately.

## 3. Add task skills where a distinct workflow exists

Use supported discovery directories and `SKILL.md` frontmatter with `name` and a discriminating `description`. Put conditional detail in `references/`; keep project checks in Markdown instructions for AI agents.

Before changing a skill location, capture the exact affected directory inventory and recursively inventory every selected skill package by relative file path and SHA-256, including hidden files, references, assets, scripts and binaries. Use [the fixed standard manifest](assets/project-skills/manifest.json): `test-engineering`, `security-review`, `graphify`, `hook-management`, and `impeccable` (5 skills; the installer skill itself is not counted). Record the exact source revision or pre-install source snapshot. Copy each full folder; `SKILL.md` plus linked files is not a complete package. Compare source and destination file lists and hashes, list exact differences, and verify every local resource link. Count an installation complete only when no source file is silently omitted, changes/additions are explained, and the declared skill/route/metadata agree. Do not add Foundation-owned `.js`/`.mjs` checker/helper scripts; retain the five `.js` support files shipped in the pinned Impeccable package. Keep inventory fingerprints and differences in the manifest/checklist per the [skill package integrity contract](references/setup-contract.md#skill-package-integrity). Update only exact Foundation-owned skill paths; preserve sibling, host-level, upstream and project skills. Install all five standard skills project-locally for every normal `setup`; an explicit `documents-only` scope records the exclusion. Add user-requested extras as separate entries. Do not modify global installations/settings. Verify discovery separately from package completeness and report any unavailable discovery as a gap.

For every normal setup, install all five complete folders from `assets/project-skills/` according to the [installation contract](references/secure-testing-workflows.md#install-or-repair-the-project-skills). Read every bundled SKILL.md and required resource, route each skill from `AGENTS.md`, and record all five in `requiredSkills`, `skillPaths`, `skillInventory` and the checklist. In generated `AGENTS.md`, route Impeccable for UI design work, state that setup does not install its separate engine and it must not download without an explicit user request, and route hook changes through hook-management after establishing host, scope, event and behavior. A user-requested `documents-only` scope excludes skill changes and is recorded in the delivery list. Graphify's CLI remains a separate capability; copying its skill does not install the CLI. Hook-management is instruction-only and never configures hooks during setup. Add genuinely distinct project-specific skills only as extra entries without replacing the fixed five.

Inspect recurring project work and create project skills for distinct workflows that benefit from project knowledge. Verify any selected upstream skill before routing to it; preserve its invocation policy and do not create duplicate replacements. Each project task skill states trigger, inputs/scope, authoritative sources, outputs, failure recovery, AI review criteria and completion. Use Markdown instructions that let the agent inspect and report findings. Add workflow-maintenance guidance when recurring setup/repair differs from application work. Use real files in task routing; a table alone does not complete extraction.

When existing project tools matter, document their actual commands, owner and limits in a compact [tool entry point](references/tool-entrypoints.md). Route semantic review to AI skills; do not add setup/check scripts. Root rules point to relevant guidance; task skills load only needed capabilities.

Route to `domain-modeling`, `codebase-design`, `tdd` and `handoff` only when the selected workflow needs them and their actual availability is verified. For explicit-only skills, point to the explicit invocation and preserve upstream prerequisites/decisions. For project-only setups, list selected project-local skills in the manifest rather than relying on a host-only route.

Exit: in normal setup, the five named standard skills and every selected extra contain complete packages and are routed from the project guide. The checklist says `5 standard skills` and its named rows match the manifest; `requiredSkills` and `skillPaths` match every project-local deliverable. For `documents-only`, record the explicit exclusion. Verify package inventories/hashes, declared paths, local links, discovery and invocation policy. Do not represent unavailable plugins or commands as installed.

## 4. Use AI agents for project checks

Use Markdown criteria and the relevant AI-agent skill to review changed documents, source and requirements. For code changes, route the diff through the security-review and test-engineering skills; they inspect the actual change and report concrete evidence. Do not add Foundation JavaScript checkers, helper scripts, Git hooks or CI gates as part of standard setup.

Existing project-owned test, lint, type and build commands remain governed by that project's instructions. Run them only when the task or existing project rules call for them, and report their outcomes separately from the AI review. Tool installation or new executable automation requires an explicit request. See [Tooling and quality](references/tooling-and-quality.md) for review scope and evidence.

Exit: the relevant AI agent has reviewed every required/applicable path against its Markdown criteria, findings cite source evidence, and any project-native checks that were required are reported accurately.

## 5. Establish schema and security workflows

Define entity ownership and invariants before implementation. Confirm existing migrations/source; document contracts, failure behavior, transactions and compatibility, with isolated-data verification.

Security review records scope/revision, trust boundaries, concrete attack paths, evidence and confirmed/candidate/coverage-gap distinctions. Route every code diff through the installed diff-review skill; use a whole-repository scan only for an explicit repository audit. Keep findings/fixes in authorized local artifacts.

Workflow setup and executing a security scan are separate deliverables. Use authorized targets and isolated data. Production operations, deployments, publishing findings and external data transfer require authorization covering those actions.

Exit: invariants/verification match the actual system and reported finding status stays within available evidence.

## 6. Verify and hand off

1. Finish required/applicable files and complete targeted final review as described in the [setup contract](references/setup-contract.md#perform-the-setup). For normal setup, finalize the foundation manifest and `docs/agents/skills-checklist.md`; for `documents-only`, preserve skill paths and record the scope exclusion. Review each declared path and content separately; file presence is not semantic acceptance. Keep the portable skill free of destination names, machine paths, ports and databases.
2. Follow one representative journey: find entry point/caller, relevant design/schema, appropriate checks and acceptance evidence. Documents-only traces documents/source without implementing a feature.
3. Have the relevant AI-agent skill review the required paths and follow their local links. Record the files reviewed, source evidence, findings and any project-native commands that existing rules required. Do not install or invoke a Foundation JavaScript checker as the project's review mechanism.
4. Write the destination's existing foundation report or `docs/AI-FOUNDATION-REPORT.md`: findings, changes, capabilities, actual checks, gaps and next commands. Include the selected project-skill total, complete/incomplete counts, source/destination inventory evidence, exact package differences and a link to the checklist. In audit/documents-only, list unconfigured/unrun items and their next steps.
5. For workflow or routing changes, have a fresh AI session use affected representative cases and record actual outcomes. Separate agent behavior from simple file/link review; do not use a helper script to grade semantic quality.
6. Trace canonical spec, decisions, ticket dependencies, requirement/code/test evidence and handoff. Distinguish document traversal, program checks and actual host behavior.

Done: every required/applicable setup deliverable is implemented and checked, documents and project skills connect to source, the skills checklist reports the selected-skill total and complete/incomplete counts, and required checks pass. A missing prerequisite must have an attempted local remedy and concrete blocker evidence. Remaining required work means `partial setup` or `blocked setup`, even when documented honestly; a list of next commands does not make setup complete. Separate unavailable host dispatch/remote verification from completed local configuration.

## Keep the foundation current

| Change | Update the authoritative source |
| --- | --- |
| Behavior/acceptance | Product/spec and behavior tests |
| Domain terms | Domain glossary |
| Boundaries/integration | Architecture; ADR for consequential trade-offs |
| Visual rules/interaction | DESIGN.md and visual evidence |
| Data shape/ownership/migrations | Schema, contracts and security invariants |
| Runners/commands/coverage | Configuration and suite-selection guidance |
| Permissions/auth/trust | Security model and abuse-case tests |
| Stale graph/inventory | Affected-scope upstream refresh |

Prefer event-driven updates. Add a background loop only when requested, with interval, start/status/stop, lock, errors and evidence from multiple real runs. Distinguish UI polling from source scans; show stale/disabled state and preserve the user's stopped state.

A useful report states configured capability, executed revision/scope, report location and unavailable checks. Document count or a success badge alone does not establish runtime behavior.
