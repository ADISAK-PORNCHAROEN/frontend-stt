# Issue tracker

GitHub Issues are the canonical tracker for project specs and tickets. Keep the reviewable Markdown copies in `docs/specs/` and `.scratch/<feature-slug>/issues/` aligned with the Issues. Specs live under `docs/specs/`; tickets live one per file under `.scratch/<feature-slug>/issues/` in dependency order. New actionable tickets use the `ready-for-agent` label.

When publishing a spec and its tickets, create the spec issue first, then create tickets in dependency order and include GitHub issue references for the spec and blockers. This project does not use GitHub Actions.

Work on `develop` by default. As ticket acceptance criteria are completed and verified, check those boxes in GitHub Issues. Close a leaf work ticket when its full agreed scope and required verification are complete; for partial progress, check only the verified boxes and leave the ticket open. Keep parent/spec issues open unless the user explicitly asks to close them.
