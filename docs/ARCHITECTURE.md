# Architecture

## Runtime overview

This is a local-first Next.js 16.4.2 App Router application. The root route is statically rendered; interactive session state lives in one client feature boundary. The app has no account, database, archive, or persistent browser state.

| Concern | Source of truth | Role |
| --- | --- | --- |
| Root route and document | `src/app/page.tsx`, `src/app/layout.tsx` | Server-rendered entry point, Thai language metadata, global shell |
| Transcription session | `src/features/transcription/hooks/use-transcription-session.ts` | Current File, object URL, service readiness, one job, upload progress, polling, unload warning and lifecycle cleanup |
| Transcript review | `src/features/transcription/review-state.ts`, `src/features/transcription/hooks/use-transcript-review.ts` | Immutable original and review snapshots, current-page drafts, dirty-switch decisions, commit status, and selected preview source |
| Progress estimate | `src/features/transcription/progress-estimate.ts`, `src/features/transcription/hooks/use-progress-estimate.ts` | Approximate remaining time from advancing samples for the active job only; hides estimates for queue, insufficient, stale, stalled, or absent progress |
| Export formatter | `src/features/transcription/export-format.ts` | Serializes one immutable selected transcript snapshot as JSON, TXT, or SRT for preview and browser download |
| Workspace and playback | `src/features/transcription/components/transcription-workspace.tsx` | Page composition, player ref, playback time, bounded replay, and wiring session state into feature UI |
| Media and transcript UI | `src/features/transcription/components/` | Confirmed file replacement/clear, model selection, native media controls, segment replay, revision selection/editing, and preview/export dialog |
| Client API boundary | `src/features/transcription/api.ts` | Upload progress via XHR; validates model and segment IDs; parses unknown service responses and sends text-only saves |
| Same-origin API | `src/app/api/stt/` | Health, streaming upload, status, transcript update, and result/download Route Handlers |
| Service adapter | `src/lib/stt-service/proxy.ts` | Fixed loopback upstream, same-origin upload check, streamed size limit, no-store responses |
| Product contract | `PRODUCT.md`, `docs/agents/current-task.md` | Approved behavior, retention, file constraints and design direction |
| Visual system | `DESIGN.md`, `.impeccable/surfaces/src-app-page-tsx.md` | Time Atlas design contract and route-specific composition |

## Request and data flow

1. `useTranscriptionSession` holds the selected `File` and its object URL in memory. Replacing the file or unmounting the feature releases the URL through one owner. Async session updates carry an identity so stale upload, polling, health, or duration work cannot overwrite a newer selection.
2. The user explicitly starts the job. `XMLHttpRequest` sends `multipart/form-data` to `POST /api/stt/jobs` and reports upload progress.
3. The Next.js Route Handler streams the request to the configured local service (`STT_SERVICE_URL`, default `http://127.0.0.1:8000`). It does not buffer the up-to-1-GiB body in application memory.
4. The feature hook polls the same-origin status route while the page is open. On success it requests the JSON result and retains the service's segment IDs; the workspace displays timestamped segments and uses the local object URL for playback.
5. The review reducer keeps the immutable original and each saved draft snapshot in page memory. Editing any snapshot creates a separate working copy; saving creates a new draft, and dirty revision changes require save, discard, or stay. Segment replay is clamped from `max(0, start - 0.5)` through `min(media duration, end + 0.5)` and pauses at the end.
6. Committing a selected snapshot sends every existing `{id, text}` pair through the existing same-origin `PUT /api/stt/jobs/{jobId}/transcript`. The proxy enforces local same-origin requests and a body limit; the service validates and persists the update. A failed commit leaves the selected text and revision history in memory.
7. The browser lazily requests the immutable original through the existing original-json result format. Preview and download serialize only the selected immutable snapshot using the same JSON/TXT/SRT formatter; draft snapshots stay in memory. No revision-history API or browser persistence is added. The service remains the source for original and latest reviewed artifacts and applies its own temporary retention policy.
8. File replacement and clear are confirmation-gated. Cancel leaves the selected file, job, revisions, and edits in place; confirmed replacement clears the old file's session state.

The browser never selects the upstream URL. Only HTTP loopback URLs (`127.0.0.1` or `localhost`) are accepted by the server adapter. The service hostname, job ID, and export format are validated before building upstream paths.

## Rendering and caching

- The root page is a Server Component and is statically prerendered. The client boundary is limited to the transcription workspace and its interactive components.
- API handlers are request-driven and uncached. `next.config.ts` uses Cache Components; keep route runtime configuration compatible with the installed Next.js docs and do not change `experimental.agentFeedback` as part of feature work.
- The service proxy always sends `Cache-Control: no-store`; it does not cache health, job status, transcript JSON, or downloads.
- SSG is appropriate for the shell because it contains no user-specific server data. There is no ISR or SSR data dependency in the initial product.

## Boundaries and limitations

- The STT service owns validation, job scheduling, transcript generation, and temporary retention. The app only tracks one job in the open page.
- The service owns canonical latest and immutable original transcript artifacts. The frontend holds review drafts only in current-page memory and does not persist them across reloads.
- Revision history is session-only. Selected previews read immutable snapshots, not live working text; commit still uses the existing transcript update route, and export does not add an API endpoint.
- Leaving during upload or processing triggers the hook's before-unload prompt. Unmount aborts browser upload tracking and clears polling timers; this does not cancel a job already accepted by the service or persist tracking state.
- A service restart, closed tab, browser crash, or expired service result can prevent the page from recovering the job. The recovery path is to choose the source file and submit again.
- The service's limit of ten queued jobs is enforced by the service; the UI translates a returned queue-full error.
- User-provided files and service responses are untrusted inputs. Keep validation at the browser and server boundary; parse service JSON from `unknown`.

## Change guidance

- Keep session lifecycle in the feature hook and playback coordination in the workspace/player. Keep generic UI primitives presentational; do not move STT types or behavior into `src/components/ui/`.
- Keep UI state transitions inside the transcription feature. Add shared state or persistence only when an accepted requirement needs it.
- Keep upstream paths fixed in the adapter. Do not accept a URL or arbitrary path from the browser.
- Read the installed Next.js guide under `node_modules/next/dist/docs/` before changing Route Handler, cache, font, or page APIs.
- Update this map when adding identity, persistence, cancellation, new media sources, or a second service consumer.
