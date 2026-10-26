# Transcription Frontend Architecture and Reuse

## Problem Statement

The transcription workspace currently brings together session lifecycle work, media playback coordination, and page composition. The project also needs a clear home for reusable UI so later changes can share visual behavior without making transcription-specific components depend on a generic component layer. Without these ownership rules, changes can spread across unrelated parts of the app and make the upload, job, player, and transcript states harder to maintain.

## Solution

Keep the app as a feature-first modular monolith. Next.js App Router files own page composition, document setup, and same-origin endpoints. The transcription feature owns its workflow, domain types, browser API adapter, and domain UI. A small shared UI area holds only presentation primitives that have real callers and no transcription-specific knowledge. Extract the job lifecycle into a feature-local hook while keeping playback coordination close to the workspace. Preserve the current product behavior, rendering model, API contracts, and design.

## User Stories

1. As a developer maintaining the app, I want route files to stay focused on routing and shell composition, so that product behavior has a clear owner.
2. As a developer maintaining the transcription workflow, I want its state, types, policies, and UI grouped by feature, so that I can find and change related behavior together.
3. As a developer building a new screen, I want to reuse generic controls with consistent variants, so that common interactions do not acquire slightly different styling and semantics.
4. As a developer maintaining reusable controls, I want shared primitives to stay independent of transcript, media, and STT types, so that any feature can use them without importing transcription behavior.
5. As a developer maintaining the upload and job flow, I want one feature-local owner for session state, readiness, upload progress, polling, unload warnings, and resource cleanup, so that lifecycle changes do not require coordinating unrelated state setters.
6. As a developer maintaining playback, I want media time, seeking, and transcript-follow behavior to remain with the workspace and player UI, so that frequent playback updates do not complicate the remote job lifecycle.
7. As a developer changing the service integration, I want browser API parsing to convert untrusted responses into feature types at the boundary, so that UI components do not depend on raw service payloads.
8. As a developer changing a Route Handler, I want it to call a server-only adapter with a fixed loopback destination, so that browser code cannot select an upstream service URL.
9. As a user, I want the same upload, status, playback, transcript, and export behavior after the refactor, so that code organization does not change how the workspace works.
10. As a user on a slower connection or mobile device, I want the existing Clear Timeline layout and responsive behavior preserved, so that the refactor does not reduce readability or access to controls.
11. As a developer, I want the static shell and interactive client boundary to remain explicit, so that the local single-user workflow does not gain unnecessary server rendering or cache behavior.
12. As a project owner, I want new dependencies added only when an accepted need requires them, so that the frontend remains easy to maintain and update.

## Implementation Decisions

- Use a feature-first modular monolith: App Router modules own route entry and HTTP routing; the transcription feature owns its UI, session model, file rules, formatting, and browser workflow.
- Keep the root page as a static Server Component and keep browser state inside the transcription workspace client boundary. API responses remain uncached; the initial product has no ISR or server-rendered user-data requirement.
- Add a feature-local session hook as the owner of file/session selection, service readiness, upload progress, job polling, unload warnings, and asynchronous resource cleanup. Keep media element refs, playback time, seek, and active-segment derivation in the workspace and its player/transcript components.
- Preserve the existing discriminated session model. A reducer may live inside the hook if it makes valid transitions easier to follow; do not introduce a global store for the single workspace.
- Keep the browser API adapter responsible for same-origin requests, upload progress transport, runtime parsing from unknown values, and safe error mapping. UI components consume typed feature values.
- Keep Next.js Route Handlers as thin same-origin HTTP adapters. Preserve the server-only service adapter, loopback-only destination, upload streaming, request validation, and no-store response behavior.
- Keep generic UI primitives presentation-only and free of feature types, API calls, and workflow decisions. Extract only controls with multiple concrete call sites; keep file selection, media playback, transcript segments, and status composition feature-owned.
- Use shared modules only for code that is genuinely reused across features. Keep the current STT proxy as a server integration boundary, and never import it from client-reachable modules.
- Preserve current design tokens and visual behavior. Keep global reset, document-level styles, and design tokens in the app styling layer; move feature-specific styles incrementally when components are changed instead of rewriting all styles as part of this refactor.
- Use the installed React, TypeScript, Next.js, and Tailwind stack. Do not add a UI, state, query, schema, icon, or form library for this refactor. Reconsider one only when a concrete requirement needs shared remote caching, complex shared validation, advanced accessible primitives, or cross-route state.

## Testing Decisions

- Validate observable behavior, not hook names, private state shape, file locations, or implementation-only call order.
- Reuse the already-approved API integration seam: exercise same-origin Route Handlers against a controllable local STT service and verify the existing health, upload, status, result/export, validation, and no-store behavior.
- Reuse the already-approved browser journey seam: drive the real workspace through same-origin API responses and verify file selection, readiness, upload/job lifecycle, transcript display, playback seek/follow, downloads, and recoverable failures.
- Review the existing Clear Timeline states at desktop and mobile widths after UI extraction, including keyboard focus, Thai wrapping, status visibility, and natural scrolling.
- The repository currently has no configured automated test runner. This planning work does not claim automated coverage or add a runner. Keep that limitation visible when implementation is scheduled; use only configured project commands when required and report their actual results.

## Out of Scope

- Changes to the accepted V1 behavior, STT service, same-origin API contracts, service retention, or supported media.
- Accounts, multiple active jobs, persistence, saved history, transcript editing, URL import, or public/LAN deployment.
- Replacing the existing design direction or performing a broad CSS rewrite.
- Adding a global state store, dependency-injection framework, remote cache, form framework, or component package without an accepted need.
- Reorganizing the service into extra domain/application/adapter layers before another workflow or consumer justifies them.

## Further Notes

- **GitHub spec issue:** [#5 Transcription Frontend Architecture and Reuse](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/5).
- This architecture follow-up complements the approved product spec, [STT Transcription Workspace (V1)](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/1), and its implementation tickets [#2](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/2), [#3](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/3), and [#4](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/4). It does not replace or close them.
- The project owner approved separate API integration and browser journey seams for the V1 work; this spec reuses those seams without introducing a new testing boundary.
