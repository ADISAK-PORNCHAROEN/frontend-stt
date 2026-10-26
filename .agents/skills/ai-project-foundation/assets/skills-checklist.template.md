# Project skills checklist

This checklist tracks the project-local skills defined by
`docs/agents/foundation.json`. The standard bundle is fixed at **5 skills**;
the Foundation installer skill and unrelated host/global skills are not counted.
User-requested extras are added after the five standard rows and increase the
selected total.

- Standard project skills: **5**
- Selected project skills: `<5 + selected extras>`
- Complete package installations: `<complete>/<selected total>`
- Incomplete or missing installations: `<incomplete>/<selected total>`
- Runtime discovery verified: `<verified>/<selected total>`

Count only `requiredSkills`. Mark a package complete only after recursively
inventorying all source paths and SHA-256 values, comparing installed files,
resolving local links and aligning manifest, route, name, and invocation policy.
Package completeness and runtime discovery are separate; never infer discovery
from file presence. Any missing source file, unchecked inventory, unresolved
resource, unexplained change, or misrouted skill is incomplete.
Graphify and Impeccable fingerprints use canonical LF bytes pinned by the
Foundation skill's `.gitattributes`; inventory installed copies using those
same bytes. Impeccable is pinned to upstream v4.7.0. Its 64-file bundle contains
five upstream `.js` support files; preserve those complete upstream resources.
They are not Foundation-authored checkers or helpers. The separate Impeccable
engine and all hook configuration remain outside automatic setup.

| Complete | Skill | Authoritative source @ revision | Project path | Source → installed entries | Source → installed inventory SHA-256 | Missing / changed / added paths | Manifest and route | Runtime discovery | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [ ] | `test-engineering` | `ai-project-foundation/assets/project-skills/test-engineering @ <foundation commit>` | `.agents/skills/test-engineering` | `2 → <count>` | `<source fingerprint → installed fingerprint>` | `<none or exact paths>` | `<aligned/gap>` | `<verified/not verified/unavailable>` | `references/testing-contract.md; behavior changes and test authoring` |
| [ ] | `security-review` | `ai-project-foundation/assets/project-skills/security-review @ <foundation commit>` | `.agents/skills/security-review` | `2 → <count>` | `<source fingerprint → installed fingerprint>` | `<none or exact paths>` | `<aligned/gap>` | `<verified/not verified/unavailable>` | `references/review-contract.md; code/config/dependency/CI changes` |
| [ ] | `graphify` | `Foundation bundle @ <foundation commit>; upstream v0.9.80 @ 6478eb71237c86ee5fb6a35c702835e987ca445d` | `.agents/skills/graphify` | `12 → <count>` | `aab00021382bf9fa662577f3db7605d38269edc8aa9f690d80a47176cd34ccd7 → <installed fingerprint>` | `<none or exact paths>` | `<aligned/gap>` | `<verified/not verified/unavailable>` | `8 references + Apache/MIT notices; approved adaptations prevent implicit CLI install, unapproved hook config, and CLAUDE bridge changes` |
| [ ] | `hook-management` | `ai-project-foundation/assets/project-skills/hook-management @ <foundation commit>` | `.agents/skills/hook-management` | `2 → <count>` | `<source fingerprint → installed fingerprint>` | `<none or exact paths>` | `<aligned/gap>` | `<verified/not verified/unavailable>` | `Explicit-only; setup does not configure hooks` |
| [ ] | `impeccable` | `Foundation bundle @ <foundation commit>; upstream v4.7.0 @ aeeb3d8c30b5f95aeeb3e893b0f1a308af8fdb8f` | `.agents/skills/impeccable` | `64 → <count>` | `dc55eb3bcfc827aaa51f06bdda6bd88e21f6a75eaee261039095e98057c39cd0 → <installed fingerprint>` | `<none or exact paths>` | `<aligned/gap>` | `<verified/not verified/unavailable>` | `Upstream skill tree + Apache-2.0 LICENSE/NOTICE.md; five upstream .js support files; UI design only; separate CLI engine and hooks require explicit handling` |

## Review evidence

- Project revision / dirty scope: `<revision and relevant paths>`
- Inventory method: `<recursive file/symlink list + per-file SHA-256; normalized relative paths>`
- Discovery method/session: `<method or not observed>`
- Last checked: `<date>`
