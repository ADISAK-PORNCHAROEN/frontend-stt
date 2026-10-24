# Project skills checklist

Scope: project-local skills available to Codex in this repository. A host/global
skill does not count as a project-local installation.

- Project skills installed: **59**
- Project-maintained skills: **3/3** complete
- `backnotprop/pstack` skills: **56/56** copied into the project
- Incomplete or missing local installations: **0/59**
- Runtime discovery in a fresh Codex project session: **not verified**

`[x]` means the skill folder is present, declared in `docs/agents/foundation.json`,
and routed by project guidance. The full pstack skill inventory and source hashes
are in the root `skills-lock.json`. Read each skill's `SKILL.md` for its trigger
and invocation policy; many pstack skills require explicit invocation.

| Complete | Skill set | Project path | Manifest and route | Notes |
| --- | --- | --- | --- | --- |
| [x] | `test-engineering` | `.agents/skills/test-engineering` | Listed and routed for code, dependency, CI, executable-configuration, behavior, and testing work | No test runner is configured |
| [x] | `security-review` | `.agents/skills/security-review` | Listed and routed for every code, dependency, CI, and executable-configuration diff | Uses bounded diff review; no repository-wide scan was run |
| [x] | `impeccable` | `.agents/skills/impeccable` | Listed and routed for requested UI design work | Based on the available upstream v4.5.2 source; local preview hardening sanitizes sidecar HTML and restricts Markdown links to HTTP(S) |
| [x] | 56 skills from `backnotprop/pstack` | `.agents/skills/<skill-name>` | All 56 names and hashes are in `skills-lock.json`; task routing points to each skill's own `SKILL.md` | Installed with project scope for Codex using copy mode; no global option was used |

## Verification evidence

- `npx --yes skills add backnotprop/pstack --skill "*" --agent codex --copy --yes --json` reported all 56 skills installed under `.agents/skills/` with `scope: project` and `agents: ["Codex"]`.
- `npx --yes skills list --agent codex --json` reported 59 project-scope entries: 56 from `backnotprop/pstack`, 3 other project skills, and 0 global-scope entries in that scoped listing.
- `skills-lock.json` contains 56 pstack source entries; all 59 project skill folders contain `SKILL.md`.
- The upstream `setup-pstack` skill defaults to a user-level settings file. The project copy and its model-routing readers are adapted to use `.agents/pstack-models.md` instead.
- Pstack role settings are configured in `.agents/pstack-models.md`; no user-level settings file was written.
- The runtime catalog was not reloaded after installation, and fresh-session discovery was not tested.
- No project tests, type checks, lint, or build commands were run for this documentation and skill installation task.
- Last checked: 2026-10-23.
