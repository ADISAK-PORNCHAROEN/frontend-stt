# graphify reference: commit hook and native CLAUDE.md integration

> **Foundation adaptation notice:** This file was adapted from Graphify v0.9.80. Hook changes now require an explicit host, scope, event, and behavior, and native `CLAUDE.md` integration is disallowed when that file is the Foundation `@AGENTS.md` bridge. See the included `NOTICE` and `LICENSE` files.

Load this only when the user explicitly asks to configure Graphify automation. Before any write, route through the project-local `hook-management` skill and establish host, project scope, event, and desired behavior. Foundation setup never runs these commands.

## For git commit hook

This option targets a Git `post-commit` hook in the current repository. The behavior is an automatic incremental graph refresh after a commit; it cannot change the completed commit. Run the installer only after the user explicitly requests that exact host/scope/event/behavior and the hook-management skill has inspected the existing hook and `core.hooksPath`.

```bash
graphify hook install    # install
graphify hook uninstall  # remove
graphify hook status     # check
```

After every `git commit`, the hook detects which code files changed (via `git diff HEAD~1`), re-runs AST extraction on those files, and rebuilds `graph.json` and `GRAPH_REPORT.md`. Doc/image changes are ignored by the hook - run `/graphify --update` manually for those.

Inspect and preserve the existing hook before proceeding. Graphify reports that it appends when a hook already exists, but review the exact resulting diff and verify the existing action remains intact. Do not assume its status output proves the hook executed.

---

## For native CLAUDE.md integration

This command edits the project's `CLAUDE.md`. Foundation-managed projects
require that file to contain exactly `@AGENTS.md`, so do not run this command
there. Route Graphify usage from `AGENTS.md` to the project-local Graphify skill
instead. In projects without that bridge, use the command only after an explicit
request, scope check, and before/after review.

Run once per project to make graphify always-on in Claude Code sessions:

```bash
graphify claude install
```

This writes a `## graphify` section to the local `CLAUDE.md` that instructs Claude to check the graph before answering codebase questions and rebuild it after code changes. No manual `/graphify` needed in future sessions.

```bash
graphify claude uninstall  # remove the section
```
