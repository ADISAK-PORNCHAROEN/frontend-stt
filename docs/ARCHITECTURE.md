# Architecture

## Runtime overview

This is a local-first Next.js 16.4.2 App Router application. The root route is statically rendered; interactive session state lives in one client feature boundary. The app has no account, database, archive, or persistent browser state.

| Concern | Source of truth | Role |
| --- | --- | --- |
| Root route and document | `src/app/page.tsx`, `src/app/layout.tsx` | Server-rendered entry point, Thai language metadata, global shell |
| Transcription session | `src/features/transcription/components/transcription-workspace.tsx` | Current File, object URL, one job, upload progress, polling, playback time and view state |
| Media and transcript UI | `src/features/transcription/components/` | File selection, native audio/video controls, segment seek and active-segment follow |
| Client API boundary | `src/features/transcription/api.ts` | Upload progress via XHR; parses unknown service responses into domain types |
| Same-origin API | `src/app/api/stt/` | Health, streaming upload, status and result/download Route Handlers |
| Service adapter | `src/lib/stt-service/proxy.ts` | Fixed loopback upstream, same-origin upload check, streamed size limit, no-store responses |
| Product contract | `PRODUCT.md`, `docs/agents/current-task.md` | Approved behavior, retention, file constraints and design direction |
| Visual system | `DESIGN.md`, `.impeccable/surfaces/src-app-page-tsx.md` | Time Atlas design contract and route-specific composition |

## Request and data flow

1. The browser holds the selected `File` and an object URL in memory. Replacing the file or unmounting the workspace revokes the URL.
2. The user explicitly starts the job. `XMLHttpRequest` sends `multipart/form-data` to `POST /api/stt/jobs` and reports upload progress.
3. The Next.js Route Handler streams the request to the configured local service (`STT_SERVICE_URL`, default `http://127.0.0.1:8000`). It does not buffer the up-to-1-GiB body in application memory.
4. The browser polls the same-origin status route while the page is open. On success it requests the JSON result, displays timestamped segments and uses the local object URL for playback.
5. TXT and SRT downloads are streamed through the result route. The browser does not save job history; the service applies its own temporary retention policy.

The browser never selects the upstream URL. Only HTTP loopback URLs (`127.0.0.1` or `localhost`) are accepted by the server adapter. The service hostname, job ID, and export format are validated before building upstream paths.

## Rendering and caching

- The root page is a Server Component and is statically prerendered. The client boundary is limited to the transcription workspace and its interactive components.
- API handlers are request-driven and uncached. `next.config.ts` uses Cache Components; keep route runtime configuration compatible with the installed Next.js docs and do not change `experimental.agentFeedback` as part of feature work.
- The service proxy always sends `Cache-Control: no-store`; it does not cache health, job status, transcript JSON, or downloads.
- SSG is appropriate for the shell because it contains no user-specific server data. There is no ISR or SSR data dependency in the initial product.

## Boundaries and limitations

- The STT service owns validation, job scheduling, transcript generation, and temporary retention. The app only tracks one job in the open page.
- Leaving during upload or processing triggers the browser's before-unload prompt. This does not persist tracking state or cancel the service job.
- A service restart, closed tab, browser crash, or expired service result can prevent the page from recovering the job. The recovery path is to choose the source file and submit again.
- The service's limit of ten queued jobs is enforced by the service; the UI translates a returned queue-full error.
- User-provided files and service responses are untrusted inputs. Keep validation at the browser and server boundary; parse service JSON from `unknown`.

## Change guidance

- Keep UI state transitions inside the transcription feature. Add shared state or persistence only when an accepted requirement needs it.
- Keep upstream paths fixed in the adapter. Do not accept a URL or arbitrary path from the browser.
- Read the installed Next.js guide under `node_modules/next/dist/docs/` before changing Route Handler, cache, font, or page APIs.
- Update this map when adding identity, persistence, cancellation, new media sources, or a second service consumer.
