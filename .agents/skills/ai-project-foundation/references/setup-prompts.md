# Setup prompts

Read for source-backed design guidance and explicitly requested Mermaid work. A Mermaid viewer remains an explicit request. Preserve audit/documents-only scope, existing decisions and tools.

## DESIGN.md

```text
Write or update DESIGN.md following the pattern at
https://getdesign.md/what-is-design-md.
Inspect the existing UI, tokens, components and supplied references first.
Preserve accepted design decisions; document visual direction, semantic colors,
typography, components/states, layout, elevation, design constraints,
responsive/accessibility rules and agent usage with visual acceptance evidence.
Use the current reference format and source-backed values; distinguish proposed
choices from observed behavior. Link implementation sources and the UI catalog.
```

Read [document blueprints](document-blueprints.md#designmd) for the artifact contract. Reach the provided reference when writing the file, not on every turn. If it cannot be read, use the publisher's [collection](https://github.com/VoltAgent/awesome-design-md) or [guide](https://getdesign.md/blog/web-design-md/), recording the fallback. Its linked [format specification](https://github.com/google-labs-code/design.md/blob/main/docs/spec.md) defines supported tokens and section order; confirm current requirements with destination tooling.

Completion: concrete source-backed values, semantic roles, responsive/locale
overrides and implemented component states are covered; accepted identity is
preserved and UI tasks point to DESIGN.md. Review the final cascade and relevant
rendered states; section order and optional tokens alone do not establish quality.

## Impeccable

```text
Use the bundled project-local Impeccable skill for UI design work. Foundation
setup still writes `DESIGN.md` from project evidence without invoking the
Impeccable launcher. Its complete upstream v4.7.0 skill tree is already under
`assets/project-skills/impeccable`, with upstream `LICENSE` and `NOTICE.md`
included (64 files total); preserve all five upstream `.js` support files.
Do not install or modify a global copy. The
launcher can download a separate engine on first run: check for an existing
local binary first, and if it is absent use the skill's documented fallback
without running the downloader unless the user explicitly requests the engine.
Before using Impeccable's hook command, read its `reference/hooks.md` and route
the request through hook-management; establish the supported host, scope, event,
and behavior before any change. Never enable hooks during Foundation setup.
```

The [official site](https://impeccable.style/#why) describes the tool. Read the bundled local skill for invocation and design behavior. Follow [tooling](tooling-and-quality.md#impeccable-and-ui) for source-backed AI review.

Completion: context resolves the intended product/design records and the AI
agent records source-backed design findings or remaining questions. The
checklist records the bundled Impeccable package and discovery separately from
the optional engine; report any missing prerequisite and its exact status.

## Database Mermaid and mermaid.html

```text
Inspect the database currently used by this project and generate its diagram
in Mermaid format, with a web viewer available as mermaid.html.
If a database/schema exists, derive an ER diagram from authoritative schema,
migrations and persistence code; show confirmed keys, relationships and cardinality.
If only an agreed database design exists, render it as proposed, not implemented.
If neither exists, prepare the viewer/source structure with a clear pending-schema
state; leave the diagram empty and do not invent tables, relationships or migrations.
Preserve the native stack and existing viewers/docs; report source and render checks.
```

Use [schema and security](schema-and-security.md) for ownership/constraints, [Mermaid ER syntax](https://mermaid.js.org/syntax/entityRelationshipDiagram.html) for notation and [Mermaid integration](https://mermaid.js.org/config/usage.html) for the installed compatible renderer.

1. Inspect schema/migrations/ORM definitions, persistence code and agreed design artifacts. Query codebase discovery first when required. Prefer these sources over inspecting live data; unavailable production access is not permission to create a replacement database.
2. Choose `implemented`, `proposed` or `pending schema` from evidence. Foreign keys and nullability guide optionality; a foreign key alone does not prove every parent has a child. Separate application relationships from enforced constraints and note uncertainty.
3. Keep canonical Mermaid source in the existing schema document or a native artifact such as `docs/schema.mmd`. Make `mermaid.html` render that source via the existing build/generation path, avoiding two independently edited diagrams. For framework public assets, place it in the supported static directory so `/mermaid.html` works; document actual path/URL.
4. In the no-schema branch, provide a pending state, intended source location and next steps. Keep an empty source slot; a TODO node is not an implemented ER model. Prepare integration points without adding database packages or migrations.
5. Use the native/pinned Mermaid renderer and its documented API. Default to local dependencies/assets. External CDN loading is a separate environment choice; show offline/dependency/render failures explicitly. Keep diagram text as data and use strict security settings for labels/input.
6. Verify schema-to-diagram accuracy, syntax with the installed parser/CLI when available, and the served HTML page when authorized browser tooling is available. Verify pending/error states for the scaffold. Report source checks separately from actual rendering; record unavailable browser/parser checks honestly.

Completion: existing/agreed schema is represented accurately, or an explicit pending scaffold exists; source ownership and refresh steps are documented and the viewer's actual verification status is recorded. This documentation work does not authorize database redesign, migrations, deployment or public hosting.
