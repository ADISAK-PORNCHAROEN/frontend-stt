---
name: setup-pstack
description: Configure which models pstack uses per role and at what reasoning budget in this project's local settings. Use for /setup-pstack, "configure pstack models", "pstack budget", or changing pstack's model choices.
---

# Setup pstack

Write pstack's model settings, one model per role, to `.agents/pstack-models.md` in this repository. This project-local file is authoritative for the installed pstack skills. Keep this setup inside the repository; don't read or write a user-level pstack settings file.

## Steps

### 1. Detect available models

Enumerate the model slugs you can pass to a subagent in this session (Cursor `Task`, Claude Code `Agent`, OpenCode `task`, Codex `spawn_agent`). That is the dependable source. If your harness also has a command that lists the user's models, prefer it for completeness (for example `opencode models` or `pi --list-models`). If you cannot detect any, ask the user to paste the slugs they have access to. Never write a real slug you have not confirmed is available. The aliases `inherit-parent` and `auto` are always valid even though they are not detected slugs.

### 2. Load current state

The default role-to-model mapping is the rule shape shown in step 5 below. If `.agents/pstack-models.md` already exists, read it and treat its `# budget` line and role values as the current choices. Otherwise start from those defaults. A line whose role is not in step 5, such as `how critics`, is from a retired role. Drop it.

### 3. Budget, map, and confirm

**(a) Ask for a budget.** Prefer your structured-question tool (`AskQuestion` in Cursor, `AskUserQuestion` in Claude Code, `question` in OpenCode) over free text. Offer these four options with these exact labels, and name the current budget when the rule records one. With no rule, say that `large` matches the skill defaults.

- `unlimited — max reasoning`
- `large — xhigh reasoning`
- `medium — high reasoning`
- `small — medium reasoning`

**(b) Apply it.** Build the working table from the skill defaults, and on a re-run keep any role you changed by family, list, or alias (`inherit-parent`, `auto`). In Codex, model IDs do not encode reasoning effort: keep the detected model ID in the role line and apply the selected level through `reasoning_effort` at spawn time. If that model does not support the target level, use its highest supported level at or below the target; if none is available, mark the role as needing a choice. For harnesses whose model IDs encode effort, `unlimited`, `large`, `medium`, and `small` set the effort token of every real slug, panel entries included, to `max`, `xhigh`, `high`, or `medium`. The effort token is the last token, or the one before a trailing `fast`, on the ladder `max` > `xhigh` > `high` > `medium` > `low`. If the resulting slug is not detected, use the same family's detected slug with the highest effort at or below the target, else mark the role as needing a choice. `inherit-parent` and `auto` do not change. So `unlimited` turns `claude-opus-5-5-xhigh` into `claude-opus-5-5-max`. Grok slugs top out at `xhigh`, so under `unlimited` the fallback puts Grok at `xhigh` and keeps `grok-4.7-xhigh-fast` as it is. `large` keeps both defaults. `small` turns them into `claude-opus-5-5-medium` and `grok-4.7-medium-fast`.

**(c) Show the roles and confirm.** Show every role with its model, marking any real slug not in the detected set as needing a choice. Also list each line step 2 dropped. Ask whether to accept as-is or change specific roles, offering the detected models plus `inherit-parent` and `auto` (both mean: this role runs on the parent chat model, which is how Auto users stay on Auto) as the options. Prefer your structured-question tool over free text. For panel roles (arena runners, architect runners, interrogate reviewers) the value is a list, and one subagent runs per entry, alias entries included, so the list length sets the count. `arena cross-judge pool` is also a list, but Arena selects one value from it whose model family differs from the parent's when possible. `swarm workers` is the default model for every worker unless a race or comparison assigns another model per arm.

### 4. Validate

Every real slug written must be in the detected set. `inherit-parent` and `auto` always pass. If a chosen real slug is not available, stop and ask again.

### 5. Write the rule

Write `.agents/pstack-models.md` with a `# budget` line using the chosen label and target effort, and one line per role, using the same labels poteto-mode uses. Do not add host-specific frontmatter. Overwrite the whole file so re-runs stay idempotent. Shape:

```
# pstack model configuration. One line per role. Delete a line to fall back to the skill default.
# `inherit-parent` or `auto` as a value: the role runs on the parent chat model (omit the subagent `model`). Alias entries in a panel list still count toward its fan-out.
# budget: <unlimited|large|medium|small> (<target effort>)
feature, refactoring: <detected-model>
bug-fix: <detected-model>
perf-issue: <detected-model>
hillclimb: <detected-model>
judgment and prose: <detected-model>
hardest tasks: <detected-model>
how explorer: <detected-model>
how explainer: <detected-model>
why investigators: <detected-model>
why synthesizer: <detected-model>
reflect tooling: <detected-model>
reflect judgment, divergent, synthesizer: <detected-model>
arena runners: <detected-model>, <detected-model>
arena cross-judge pool: <detected-model>, <detected-model>
swarm workers: <detected-model>
architect runners: <detected-model>, <detected-model>
interrogate reviewers: <detected-model>, <detected-model>
```

### 6. Confirm

Tell the user that `.agents/pstack-models.md` was written. Project-installed pstack skills read it when they pick a model. Re-running this skill updates the project file.

### 7. Offer a verification skill (optional)

Check whether the project has a way to drive the real app for proof (a `verify-*` skill, or an existing harness). If not, offer once: "want a project-local verification skill, so agents can drive the app the way a user does and prove changes work? I can generate one with /create-verification-skill." On yes, invoke `/create-verification-skill` (resolves wherever pstack is installed: workspace, user, or plugin). On no, move on without pushing.

### 8. Offer a formal verification skill (optional)

Check whether the project already has a formal verification skill (a project skill that runs a model checker, a proof, or another verifier against the code). If not, offer once: "want a formal verification skill, so agents can prove a key property of your code holds in every case in scope, not only the cases tests reach? I can generate one with /create-formal-verification-skill." On yes, invoke `/create-formal-verification-skill` (resolves wherever pstack is installed: workspace, user, or plugin). On no, move on without pushing.
