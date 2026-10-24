# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The project owner is the only user in the first version. They open the web app on the same computer as the local STT service and use it without an account.

## Product Purpose

The product lets the owner transcribe an audio or video file and review the resulting transcript against playback of the original file. Success means the owner can play or seek the media, follow timestamped transcript segments, and download the transcript as TXT or SRT.

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
- Transcript results are read-only in the frontend. Timestamped segments can be selected to seek playback; the active segment is highlighted and followed during playback.
- The frontend offers transcript display and TXT/SRT downloads. It does not keep a durable job or transcript library.
- The user reviews a selected file and explicitly starts transcription. The interface is desktop-first and must remain usable on mobile.
- When the service is unavailable or a job fails, the interface explains the failure in user-facing language and lets the user submit the file again.
- The service is loopback-only, has no authentication, and does not accept cross-origin browser requests. Its current API does not return the uploaded media for playback.
- The user selected the Time Atlas visual direction for the first transcription workspace. Its coordinate marks and plotted points clarify time positions while familiar browser media controls and transcript reading remain primary.

## Evidence on Hand

- Existing frontend source: `src/app/page.tsx`, `src/app/layout.tsx`, and `src/app/globals.css`.
- Existing STT service: the `stt-services` project; its API contract and operational constraints are described in `docs/API.md`, `docs/SCHEMA.md`, and `docs/SECURITY-MODEL.md`.
- No approved product name, logo, testimonials, or other brand assets have been supplied. Do not invent them.

## Product Principles

- Keep the original media available for playback in the current browser session so the user can check the transcript against its source.
- Show service status and failures clearly; do not imply a job completed when the service has not published its result.
- Keep the first version local, single-user, and ephemeral.
- Preserve the service's transcript as generated; provide exports without introducing an unapproved editing workflow.
