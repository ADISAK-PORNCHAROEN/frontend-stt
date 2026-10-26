# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The project owner is the only user in the first version. They open the web app on the same computer as the local STT service and use it without an account.

## Product Purpose

The product lets the owner transcribe an audio or video file and review the result against playback of the original file. Success means the owner can select a Whisper model, replay timestamped segments, keep immutable transcript revisions, preview a selected revision as JSON, TXT, or SRT, and download exactly that preview.

## Positioning

This is a personal, local-first transcription workspace that uses the existing `stt-services` project and keeps media playback in the browser session. It does not provide accounts or a durable transcript library in its first version.

The local-first and ephemeral boundary is recorded in [ADR 0001](docs/adr/0001-local-first-ephemeral-workspace.md).

## Operating Context

The frontend and STT service run on the same computer. A transcription is one file submitted to the service's queued job API. The frontend tracks the job while the page is open and warns before leaving during active processing.

The frontend follows one transcription job at a time. The service keeps successful source files for up to 24 hours and successful results for up to seven days; failed job data is retained for up to 24 hours. The UI does not provide a durable history, and it tells the user about the service's temporary retention.

## Capabilities and Constraints

- The first version accepts the service's current formats: MP3, M4A, WAV, FLAC, and MP4 with audio.
- The current service limits uploads to 1 GiB, media duration to two hours, and its waiting queue to ten jobs.
- The service detects the language automatically; its HTTP API does not accept a per-job language selection.
- The interface language is Thai; transcript content remains in the language recognized by the service.
- The model selector offers Turbo and large-v3. Its initial value comes from the configured model returned by service readiness; the selected model is sent through the same-origin upload route.
- Each timestamped segment can be replayed from up to 0.5 seconds before through up to 0.5 seconds after its bounds, then playback stops. The active segment is highlighted and followed during playback.
- The owner may edit text for existing segments only. Saving sends the complete segment ID/text set; order, IDs, times, and segment structure remain unchanged. The original ASR transcript remains available as an immutable view.
- The original transcript is immutable. Each saved draft is a new session revision; committing a selected revision uses the existing same-origin transcript API and updates the service's latest reviewed result.
- The owner may select the original, a draft, or the latest reviewed revision, preview JSON/TXT/SRT, and download only that revision in the selected format. An unsaved edit is excluded from both preview and download, and downloads are disabled while the edit is dirty or saving.
- Revision history and draft snapshots exist only in the current page session. Do not add a revision-history API or durable browser storage; the service remains the source of the original and latest reviewed artifacts.
- The user reviews a selected file and explicitly starts transcription. The interface is desktop-first and must remain usable on mobile.
- Selecting a replacement file opens a confirmation that names the candidate. Cancel preserves the current file and job state; confirmation replaces it and clears the prior file's session state. Clearing a selected file also requires confirmation.
- Show an approximate remaining time only for the current job when its progress is advancing and there is enough recent progress to estimate. Hide it while queued, with insufficient or stalled progress, or without progress data; label it as a progress-based estimate rather than a service ETA.
- Keep the header and footer at viewport edges and the page within one viewport. After a transcript is available, the transcript list is the only scroll region; the model selector and start control stay on one row at desktop and mobile sizes.
- When the service is unavailable or a job fails, the interface explains the failure in user-facing language and lets the user submit the file again.
- The service is loopback-only, has no authentication, and does not accept cross-origin browser requests. Its current API does not return the uploaded media for playback.
- The user selected the Time Atlas visual direction for the first transcription workspace. Its coordinate marks and plotted points clarify time positions while familiar browser media controls and transcript reading remain primary.

## Evidence on Hand

- Existing frontend source: `src/app/page.tsx`, `src/app/layout.tsx`, and `src/app/tailwind.css`.
- Existing STT service: the `stt-services` project; its API contract and operational constraints are described in `docs/API.md`, `docs/SCHEMA.md`, and `docs/SECURITY-MODEL.md`.
- No approved product name, logo, testimonials, or other brand assets have been supplied. Do not invent them.

## Product Principles

- Keep the original media available for playback in the current browser session so the user can check the transcript against its source.
- Show service status and failures clearly; do not imply a job completed when the service has not published its result.
- Keep the first version local, single-user, and ephemeral.
- Keep the original ASR transcript immutable. Let the owner edit text only, preserve segment IDs/order/times, create a new snapshot for every saved draft, and commit a selected snapshot through the existing same-origin API.
- Keep revision drafts in memory for the current page session. Preview and download only the selected immutable snapshot and format, with unsaved text excluded.
