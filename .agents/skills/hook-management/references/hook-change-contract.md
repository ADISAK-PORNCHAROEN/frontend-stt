# Hook change contract

Read this contract before reviewing or changing hook automation. Hook systems
are host-specific; a Git hook, an AI-host lifecycle hook, a skill, and a CI job
are different mechanisms. Verify current official documentation and the
repository's actual version/configuration before claiming support.

## Supported review and configuration scope

| System | Supported behavior | Evidence and boundary |
| --- | --- | --- |
| Git | Inspect and, after an explicit request, configure a named repository hook or `core.hooksPath` that calls an existing project-owned command | Git documents hook locations, executable requirements, environment, and event semantics at <https://git-scm.com/docs/githooks>. A successful config edit does not prove the hook ran. |
| Claude Code | Inspect and, after an explicit request naming scope/event/behavior, update hook entries in the applicable settings file | Official guide: <https://code.claude.com/docs/en/hooks-guide>. Preserve existing keys; use `/hooks` to inspect loaded hooks and a bounded real event to verify behavior when authorized. |
| Codex project hooks | Inspect and, after an explicit request naming scope/event/behavior, configure `.codex/hooks.json` or `.codex/config.toml` using supported events | Official guide: <https://learn.chatgpt.com/docs/hooks>. Project hooks load only when the project layer is trusted; inspect and trust definitions through `/hooks`. Configuration alone does not prove a hook ran. |
| Codex plugin hooks | Review or, after an explicit request, configure a named plugin hook definition and its trust/runtime requirements | Official plugin docs: <https://developers.openai.com/plugins/build/plugins>. Installing a plugin does not deploy hook scripts or trust non-managed hooks; inspect and trust the exact definition in `/hooks`. |
| Impeccable design detector | Only on an explicit request that identifies the host, scope, event, and detector behavior; inspect the bundled `.agents/skills/impeccable/reference/hooks.md` and verify host semantics first | For Codex, Impeccable documents `PostToolUse` after UI-file edits and `Stop` for the session deep pass. Its `hooks on` command may write multiple detected provider manifests, so do not run it unless the exact target set is confirmed and no unrelated host would be changed. The separate engine must already be available or separately authorized. |

Do not infer hook support from a skill being discoverable. Use the current host
guide to verify the exact settings location, event, trust behavior, and runtime
requirements. If the requested mechanism is unsupported or the upstream command
cannot isolate the named host/scope, report that boundary instead of silently
substituting another hook system.

## Change procedure

1. Record host/version, repository root, requested scope, event, desired
   behavior, and whether the user authorized writes.
2. Inventory the exact settings file, hook directory, `core.hooksPath`, current
   entries, referenced executable paths, and dirty state. Follow configured
   paths only after resolving them; do not enumerate or rewrite a parent
   settings directory.
3. Compare the request with official event semantics, invocation context,
   permissions, bypass behavior, working directory, and platform requirements.
   Prefer an existing project-owned command. Do not invent an executable path.
4. Before writing, preserve the original relevant file bytes or exact entries
   using the repository's established backup/history convention. Change only
   the requested hook entry and retain all other hooks/settings.
5. Validate syntax with the host's documented method. Test only the named
   event, scope, and behavior; avoid sending commits, pushes, external
   notifications, or modifying user data unless explicitly authorized.
6. Report before/after paths, the exact change, syntax result, whether the event
   was exercised, remaining host/runtime uncertainty, and restoration steps.

## No automatic setup behavior

Foundation setup only copies this Markdown skill into the project skill bundle
and routes explicit hook requests to it. It does not create hook files, edit
settings, enable a host feature, install a plugin, add a Foundation-authored
executable, or run a hook. The standard Impeccable package includes five
upstream `.js` support files; preserve them as package resources. Foundation
does not author `.js`/`.mjs` checkers or helpers.
