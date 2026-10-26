# Document blueprints

Read when creating or merging destination documentation. Code fences are templates: fill them with evidence, remove irrelevant sections and retain correct existing information.

## Layout by need

```text
project/
  AGENTS.md
  CLAUDE.md                      # Shared-rule bridge unless explicitly excluded
  PRODUCT.md
  CONTEXT.md                     # Agreed domain vocabulary
  DESIGN.md                      # Source-derived design/status
  mermaid.html                   # Requested database viewer/scaffold
  docs/
    ARCHITECTURE.md
    TESTING.md
    SCHEMA.md                    # Persisted data
    SECURITY-MODEL.md
    AI-FOUNDATION-REPORT.md
    agents/skills-checklist.md   # Selected project skill readiness and count
    adr/                         # Consequential decisions
  SECURITY.md
  .agents/skills/
    ai-project-foundation/
      assets/project-skills/
        manifest.json            # Fixed standard bundle: five skills
        <standard-skill>/        # SKILL.md, references and owned resources
    test-engineering/SKILL.md
    security-review/SKILL.md
    graphify/SKILL.md
    hook-management/SKILL.md
    impeccable/SKILL.md and its complete upstream resources
    <additional-project-skill>/SKILL.md
  <native source, tests, migrations, manifests and CI>
```

Read existing instructions first. Adapt names to established navigation. Monorepos use shared root rules and scoped package/service instructions; confirm loading with the actual host.

The foundation-v1 guide layout is this project's adoption convention, not a
vendor-required Markdown format. Host discovery/import rules remain authoritative.

## Document acceptance

Use the setup contract's applicability list and [delivery template](../assets/document-delivery.template.md)
in the foundation report or existing delivery record. Track the actual canonical
file, owner, required/applicable/excluded/not-applicable reason, source/accepted
reference, content review, links/checks and unresolved work. The delivery list
and foundation manifest record **all** required/applicable paths, not just a
passing subset.
Give each canonical file its own review result. Read prior open review findings;
replace vague grouped claims such as "source-backed documents" with the actual
resolved content, source pointers and remaining defects for each file.

Every setup includes current shared instructions, a `CLAUDE.md` bridge containing
only `@AGENTS.md`, `PRODUCT.md`, `CONTEXT.md`, `DESIGN.md`, `SECURITY.md`, a
durable report and a delivery list. AI authors all six from destination source,
existing accepted project decisions and verified repository rules. Keep each file
present when facts are unknown: state what is unestablished, the evidence checked,
and the owner/revisit trigger. Add architecture/testing for source projects,
schema for persistence, a separate security model for real trust boundaries, and
tool guides for integrated capabilities. Honor explicitly requested artifacts as
required.

Review existing content before reusing a filename. Fill confirmed missing content
or create the required file during setup. Resolve placeholders, contradictions,
obsolete paths and weak source pointers; preserve original intent/history through
migration. Consequential unknowns remain explicit open decisions rather than
invented facts. An explicit unknown-state record is useful content: it identifies
what is not established, what evidence was inspected and who or what can resolve
it. Do not add speculative schema, product acceptance or general programming terms
just to populate a document. Audit reports gaps; setup completes authorized work.

Finish by checking every applicable file and traversing one task -> document/skill
-> source -> native verification/evidence route. Content review and structural
checks are separate evidence; the closing report links the actual reference set.

## Instruction migration

For an existing project, classify each effective rule against accepted intent,
current source and host requirements: current, historical, conflicting or unclear.
Preserve valid intent and framework-managed blocks. A historical sketch may supply
product facts without owning today's implementation instructions.

Rebuild the whole active shared guide using the AGENTS.md layout below. Its
foundation-v1 format is one `<Project> Agent Guide` title and exactly these four
H2 sections, in order: `Working agreements`, `Find the source`, `Read by task`,
`Completion`. Put additional current guidance under those sections. Verified
host-managed blocks are retained separately and recorded in the foundation manifest.
An already-current guide can remain unchanged; the new format is the adoption
default for existing guides as well as new projects.

Before normalizing an existing AGENTS.md/CLAUDE.md, save its exact original bytes
under the repository's existing history location, or `docs/history/agent-instructions/`.
Use a date/content-hash name and a history index recording original path, reason
and replacement. Reuse an identical archive; skip archival when no change is needed.
Use names such as `AGENTS.<date>-<hash>.md`, not another automatically loaded
`AGENTS.md`/`CLAUDE.md`. Historical files have no instruction authority and are
reached only for history.

In Git repositories, mark each immutable archive path `-text` in the existing
`.gitattributes` before staging, so newline conversion cannot change the original
bytes in another clone. Verify the staged Git blob against the original hash.
Scope attributes to the archive paths; keep normal document handling unchanged.

Move still-valid product facts, architecture and task restrictions to their owners;
replace obsolete active instructions with the current rule and source pointer.
An appended correction beside a contradictory rule does not complete migration.
Keep unsettled product choices explicit while fixing independently known facts.
Product visions, old directory trees and proposed agent/team roles are moved to
their canonical owners or the historical record. Preserve their meaning there;
the active guide carries current working rules and conditional pointers.

Before editing, capture the original bytes and SHA-256. After replacement record
the source path, archive path/hash and history index in `foundation.json`
`instructions`. Select mode `created`, `replaced` or `already-current` from the
actual operation; retain valid prior archive receipts on unchanged reruns. An
excluded bridge records the user's explicit scope reason. Review layout, import
and archive integrity directly; source/intent meaning still needs content review.

Review root/nested instructions, host bridges, task skills and TESTING.md together.
They must inherit the same mandatory native gates, then select additional checks
by behavior. Link/archive checks prove preservation and reachability; inspect
meaning separately for obsolete paths, incompatible instructions and invented intent.

## AGENTS.md

Keep shared rules and navigation at the root; reach API/schema detail through conditional pointers. Include only rules derived from this project's source, accepted decisions, and verified repository requirements. The AI writes project-specific guidance; the blueprint supplies structure, not reusable project facts. Include system-specific instructions that change behavior. Keep temporary task restrictions in task records rather than permanent working agreements.

```markdown
# <Project> Agent Guide

<System, users and important runtime in one or two sentences>

## Working agreements

- Preserve observed <types, naming and module boundaries>.
- Read commands from <manifest/task runner> and versions from the lockfile.
- Before submission/commit, run <actual mandatory checks>.
- For <critical behavior>, select checks from docs/TESTING.md.
- Keep secrets, local credentials and test/production data out of Git.
- Perform requested reversible local work; use existing authorization for
  push, deploy, production operations and external data transfer.

## Find the source

- Use <available discovery skill/graph> to find entry points and callers.
- Check graph scope/freshness; confirm against current source.
- If unavailable, report the limitation and use targeted source search.

## Read by task

| Task | Read first |
| --- | --- |
| Behavior | PRODUCT.md and domain glossary |
| UI | DESIGN.md and <available page/design skill> |
| Architecture/API | docs/ARCHITECTURE.md and <contract/API skill> |
| Codebase/content discovery | `.agents/skills/graphify/SKILL.md` when useful; confirm against current source |
| Persistence | docs/SCHEMA.md and <database skill> |
| Verification | docs/TESTING.md and <validation skill> |
| Every code change | docs/TESTING.md, <test-engineering skill> and <security-review skill> |
| Security-sensitive changes | docs/SECURITY-MODEL.md and <review skill> |
| Hook inspection/configuration/removal | `.agents/skills/hook-management/SKILL.md` (explicit request only) |
| Existing project tools and workflow maintenance | docs/agents/tools.md and the relevant project skill |

## Completion

Report changes, reasons, actual validation and limitations.
Preserve existing working-tree changes and disclose unresolved failures.
```

Use confirmed native commands; npm examples do not apply to every stack. For frequently changing frameworks, point to installed-version documentation. See [OpenAI: AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md) for Codex discovery/scope.

## CLAUDE.md

Every standard setup supplies the shared-rule bridge. It supports later adoption
without installing Claude Code. `CLAUDE.md` must contain exactly this one line:

```text
@AGENTS.md
```

Archive before changing an existing bridge and move any still-valid shared rules
to AGENTS.md. The bridge has no duplicate or Claude-only policy text; it imports
the shared owner exactly once. File creation does not install Claude skills or
hooks.
Verify import loading with [Claude Code memory imports](https://code.claude.com/docs/en/memory#import-additional-files); report unobserved host loading separately.

## PRODUCT.md

```markdown
# <Product>

Status: <owner-approved / partially established / not established>
Last reviewed: <date and source revision>

## Evidence and intent

| Type | Statement | Source / owner |
| --- | --- | --- |
| Owner-approved intent | <confirmed purpose or “none recorded”> | <user/product owner/source> |
| Source observation | <what the current project demonstrably does, or “no implementation yet”> | <path or inspected evidence> |

Do not present source observations as accepted product goals.

## Users and purpose

<Confirmed users, problem and desired outcome; if unknown, state “not established” and name the owner decision needed.>

## Critical journeys

| Journey | Trigger | Observable success | Failure behavior |
| --- | --- | --- | --- |
| <confirmed journey or “none confirmed”> | <trigger> | <accepted observable success or “not established”> | <accepted failure/recovery or “not established”> |

## Scope and constraints

<Accepted scope and real constraints. List unresolved product decisions with owner and revisit trigger; avoid a speculative feature backlog.>

## Acceptance examples

<Add only owner-approved acceptance examples. If none exist, state “No owner-approved acceptance examples are recorded yet” and link to the unresolved decision.>
```

Build this document from the destination's current source and accepted owner
evidence. Connect accepted examples to tests. Distinguish owner-approved goals,
AI observations and current source behavior. Source proves what exists; it does
not approve product intent. When intent is unknown, the document is still
required: preserve the status, evidence inspected, exact question and decision
owner without filling gaps from filenames, legacy instructions or implementation.

## CONTEXT.md

```markdown
# Project context

Status: <confirmed vocabulary exists / no confirmed project-specific terms yet>
Last reviewed: <date and source revision>

<One or two sentences describing the agreed domain context, or: “No project-specific domain vocabulary has been confirmed yet.”>
Evidence / revisit trigger: <sources reviewed and who or what can establish agreed terms>

## Language

**<Canonical term>**:
<What this project-specific domain concept is, in one or two sentences>
_Avoid_: <Previously confusing terminology>
```

Follow installed domain-modeling's CONTEXT format when available. Include only
resolved project-specific concepts and real confusing aliases; omit `_Avoid_`
when none are known. General programming terms do not become domain concepts
merely because the repository uses them. Create `CONTEXT.md` during every setup,
even when no terms are confirmed; preserve existing glossary names and bounded
contexts, and state the evidence or owner trigger for revisiting an empty glossary.
When there are no confirmed terms, remove the term-example row and retain the
explicit status/evidence line; do not leave template placeholders in the file.

CONTEXT.md owns vocabulary only. Routes/locale codes, libraries, source paths and
fallback mechanics belong in architecture/design; release status and acceptance
in PRODUCT/spec; ownership/state invariants in model/schema; trade-offs in ADRs;
progress and commands in task/tool records. Move misplaced information to those
owners before removing it from the glossary. Review definitions against agreed
language and source; do not infer new product commitments from implementation.

## SECURITY.md

Inspect the destination's security configuration and `docs/SECURITY-MODEL.md`
when present. `SECURITY.md` records only accepted reporting channels, policy,
supported-version statements, and the security-model pointer; source observations
about trust boundaries belong in the model, not as invented policy. Create this
file during every setup. If no reporting policy/contact or supported-version
statement has been provided, mark it "not established", link the model when one
exists, and name the owner or event that can establish it. Never invent a
security email, SLA, disclosure commitment, or compliance claim.

```markdown
# Security

Policy status: <owner-approved / not established>

## Reporting

<Accepted reporting method and policy, or “not established”; identify the owner decision needed.>

## Supported versions

<Owner-confirmed policy or “not established”.>

## Security model

<Link to docs/SECURITY-MODEL.md when present; otherwise state that no separate model has been established.>
```

## DESIGN.md

Use the [DESIGN.md setup prompt](setup-prompts.md#designmd) and requested [getdesign.md pattern](https://getdesign.md/what-is-design-md). The publisher's [collection](https://github.com/VoltAgent/awesome-design-md) and [current guide](https://getdesign.md/blog/web-design-md/) provide examples/fallbacks if the requested page exposes only a loading shell.

For every setup, inspect the destination source for UI, visual assets, tokens, components and screens. Record observed implementation values separately from owner-approved identity or design direction; implementation does not itself approve the design. For a new UI, use supplied owner direction and label assumptions. If no UI or accepted visual direction exists, create `DESIGN.md` with that status, inspected evidence and revisit trigger rather than inventing a system. The publisher's guide links the [DESIGN.md format specification](https://github.com/google-labs-code/design.md/blob/main/docs/spec.md): optional supported YAML tokens plus ordered Markdown sections. Confirm current keys/order before writing; omit irrelevant sections and place additional guidance under relevant subsections. Documented snapshots cite source/revision and explain semantic roles.

Make the document sufficient for the next scoped UI change: concrete color roles,
type sizes/weights/line heights/tracking, container/gutter/gap/padding values,
breakpoints, radii, borders/shadows and implemented variants/states. Trace the final
CSS cascade and inspect representative rendered values when possible; explain
multiple canvas/header/surface tokens and responsive or locale overrides. Calling
an approximate style “fluid” or referring every value back to CSS is insufficient.
Use formulas when the implementation is fluid. Missing YAML alone is not a defect.

```markdown
# <Product> Design System

## Overview

<Mood, density, philosophy, owner-approved references and evidence/date>

## Colors

<Roles, observed values/source pointers, contrast and state usage>

## Typography

<Font sources, hierarchy, weights, line height and wrapping rules>

## Layout

<Spacing rhythm, grids, alignment and whitespace rules>

### Responsive and accessible behavior

<Breakpoints, collapse strategy, touch targets, keyboard, focus,
 labels, contrast, reduced motion and meaningful imagery>

## Elevation & Depth

<Surface hierarchy, borders, shadows and depth>

## Shapes

<Source-backed corner/border rules; distinguish unmeasured browser defaults>

## Components

<Reuse/variants; buttons, cards, fields and navigation;
 loading, empty, error, success, disabled, validation and recovery>

## Do's and Don'ts

<Accepted patterns, anti-patterns and rationale>

### Agent usage and visual acceptance

<Which work reads this file; implementation/token/catalog pointers;
 critical surfaces, viewport/theme/state and current visual evidence>
```

Impeccable applies the agreed brief; read its installed workflow before invoking tools. Keep existing design decisions authoritative.

## Architecture and ADRs

Document entry points, responsibilities, allowed dependencies, external boundaries and a critical journey. Link actual sources; use Mermaid where relationships become clearer.

Create an ADR for a consequential trade-off whose rationale needs to survive:

```markdown
# <Decision title>

<Context, chosen alternative and reason in one to three sentences>
<Consequences or implementation pointer where useful>
```

## API and event contracts

Use the native authoritative contract: OpenAPI, GraphQL, Protobuf or shared types. Describe actual inputs/outputs, validation, errors, identity/authorization, pagination and compatibility. Connect contract ? implementation ? callers ? integration tests.

Edit the authoritative input before regenerating clients/types/docs with compatible tooling. Follow generated-output policy and verify unchanged inputs regenerate without a diff. Human API documentation points to the contract instead of owning another schema copy.

Use [schema/security blueprints](schema-and-security.md) for data/security and [tooling/quality](tooling-and-quality.md) for TESTING.md/evidence. Requested database visualization follows the [Mermaid prompt](setup-prompts.md#database-mermaid-and-mermaidhtml).

Use the [AI-agent review workflow](ai-agent-review.md) for source-backed review criteria and Markdown findings.

## Project task skill

```markdown
---
name: <project-task-name>
description: <Specific scope and distinct trigger>
---

# <Task>

## Workflow

1. Establish input/scope; read <authoritative task source> and relevant AI skill.
2. Inspect <project-specific sources> against the Markdown review criteria. Record
   source paths/lines; on uncertainty, state the exact question or missing evidence.
3. Review existing project results when required. Record their owner and actual
   outcome separately from the AI review; clean up only resources created by the task.

## Completion

<Reviewed scope, source-backed findings, required existing project results and next action>
```

Shared rules stay in AGENTS.md. Task skills own task-specific review criteria; references load by branch.

For every normal setup, create and route the five project-local skills in the
bundled standard manifest. Start from the bundled assets in
`assets/project-skills/`, retaining their methods and direct primary-source links
under the [installation contract](secure-testing-workflows.md#install-or-repair-the-project-skills).
Every setup/repair supplies each skill's required internal resources. The two
testing/security contracts and hook-management contract are registered in
`foundation.json` documents; Graphify and Impeccable resources are recorded in
the full package inventories. Keep source principles/local mappings in their contracts, link them
from SKILL.md with read conditions, and register all five skills in the manifest.
Adapt project facts, AI review criteria and report locations:

- Test engineering triggers on code behavior changes and test-authoring requests.
  It inherits native mandatory gates and chooses unit/integration/E2E/coverage
  based on the changed behavior.
- Security review triggers on every code diff, including executable config,
  dependencies and CI changes. It invokes the host's diff-review capability;
  whole-repository scans remain for explicit audit requests.
- Graphify handles relevant codebase/content discovery when the project-local
  skill and required CLI are available; it confirms findings against current
  source and never claims that package installation installed the CLI.
- Impeccable handles UI design work from its bundled v4.7.0 skill and full
  upstream resources. Its five upstream `.js` support files remain part of that
  package; the Foundation setup creates no checker/helper scripts. The separate
  launcher/binary is not installed during setup, and hook changes first follow
  the hook-management contract.
- Hook management triggers only on an explicit hook request. It establishes
  host, scope, event and behavior before changes; setup itself creates no hook.

Read [secure and test workflows](secure-testing-workflows.md) for the references,
Codex Security route, result evidence and harness acceptance. Root routing,
the five standard skills, TESTING.md, quality profiles and CI must agree on
command ownership and verification/evidence routes.

## Feature artifacts

Read [project workflow](project-workflow.md) for feature adoption and existing tracker/domain conventions.

For setup or skill-routing changes, create the project skill checklist from
[`skills-checklist.template.md`](../assets/skills-checklist.template.md). Keep
its selected-skill total and complete/incomplete counts aligned with the
manifest; report runtime discovery separately from installed files.

- [Technical design](../assets/technical-design.template.md): alternatives, states and risks supplementing the canonical spec.
- [Traceability](../assets/traceability.template.md): requirement IDs, source/test locations and revision-bound outcomes outside path-free specs.
- [Handoff](../assets/handoff.template.md): pointers, decisions, checks and next action at the installed skill's destination.

Reuse the project's selected tracker and domain configuration, preserving canonical paths, glossary names, shared rules and host bridges. User-level tool availability alone does not configure a repository or create project planning artifacts.

## Execution and enforcement artifacts

- [Execution record](../assets/execution-record.template.md): milestones, discoveries/decisions, verification, recovery and next action in the canonical tracker/plan; reuse existing fields.
- [Architecture rules](../assets/architecture-rules.template.md): accepted boundaries, AI review criteria, source evidence and known limits.
- [Eval record](../assets/evals/run-record.template.md): real fresh-session outcomes, criterion evidence and metrics; follow [skill evaluation](skill-evaluation.md).

Use [execution and boundaries](execution-and-boundaries.md) for rollout. Add task-specific pointers rather than loading all artifact details into root rules.
