---
name: hook-management
description: Inspect, explain, configure, migrate, or remove repository hooks when the user explicitly asks. Identify the host, scope, event, and requested behavior before changing configuration; never install hooks during Foundation setup.
---

# Hook management

Use this skill only for an explicit hook-related request. First read the
[hook change contract](references/hook-change-contract.md), inspect the actual
host/version and current configuration, then report what is installed,
configured, enabled, and observed separately.

Before any write, establish all four facts:

1. Host or hook system and its supported version.
2. Scope: this repository, the current user, or a managed installation.
3. Exact lifecycle event or Git hook name.
4. Requested behavior and the existing project command or executable that
   should run.

If any fact is missing, continue read-only inspection and ask for the missing
decision before changing files or settings. Never infer that a request to set up
Foundation authorizes hook installation.

Inspect and preserve existing hooks and settings. Make the smallest change in
the named scope, keep unrelated entries, and show the exact diff. Re-read the
resulting configuration and validate it with the host's documented inspection
method. Report whether behavior was merely configured or actually exercised.

Do not add a Foundation checker, installer, helper script, or automatic hook.
Do not author Foundation checker/helper scripts. Preserve the five `.js`
support files shipped in the standard upstream Impeccable package; do not add
custom `.js`/`.mjs` checkers or helpers. Do not install dependencies or alter
host-global settings without a separate explicit request. If the
requested behavior requires unsupported host functionality or a new executable,
explain the limitation and obtain explicit authorization for that specific
implementation before proceeding.
