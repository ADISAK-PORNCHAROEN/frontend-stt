# STT Transcription Workspace

## Problem Statement

The project owner needs a clear way to turn a local audio or video file into a transcript, then check the recognized text against the original recording. The existing STT service can transcribe files, but its job API is local-only and is not directly callable from a browser on another origin.

## Solution

Provide a Thai-language, personal transcription workspace with the Clear Timeline design. The owner selects a supported local file, checks its details and service readiness, and explicitly starts one transcription. The page follows that job while open, then presents the local media player beside a read-only transcript with timestamped segments, playback synchronization, and TXT/SRT downloads.

The browser calls same-origin Next.js endpoints. Those endpoints proxy to the loopback STT service, stream large uploads, and return uncached health, job, transcript, and download responses. The page explains service failures and the service's temporary retention; it does not keep an account, saved history, or persistent browser state.

## User Stories

1. As the project owner, I want to select or drop a media file from my device, so that I can transcribe a recording without uploading it to a third-party website.
2. As the project owner, I want the interface to identify the supported formats, so that I know which files I can submit.
3. As the project owner, I want to see the selected file's name, size, type, and playable preview when available, so that I can confirm I chose the right recording before starting.
4. As the project owner, I want the page to check whether the local STT service is ready, so that I do not start a job that cannot be accepted.
5. As the project owner, I want to press an explicit start action after selecting a file, so that a large upload never begins unexpectedly.
6. As the project owner, I want unsupported or oversized files to be rejected with clear Thai guidance, so that I can choose a usable file without guessing.
7. As the project owner, I want recordings longer than two hours to be rejected by the service with a clear explanation, so that I understand why the job cannot proceed.
8. As the project owner, I want upload progress and queued/processing status while the page is open, so that I know whether the current job is advancing.
9. As the project owner, I want the workspace to track only one job at a time, so that its player, status, and transcript always refer to the same recording.
10. As the project owner, I want a warning before I leave during upload or processing, so that I do not accidentally lose the page's job tracking.
11. As the project owner, I want service-unavailable, queue-full, expired-job, and transcription-failure messages in understandable Thai, so that I know what happened and how to continue.
12. As the project owner, I want to submit a fresh upload after a failed or unavailable job, so that I can retry without an ambiguous stale-job state.
13. As the project owner, I want successful results to appear only after the service publishes them, so that the interface never suggests a transcript exists prematurely.
14. As the project owner, I want the original local media to remain playable beside the transcript, so that I can check recognized text against the source.
15. As the project owner, I want each transcript segment to show its time position, so that I can locate a passage in a long recording.
16. As the project owner, I want to select a segment's timestamp and seek the player to that point, so that I can review the corresponding audio or video.
17. As the project owner, I want the current segment to highlight and follow playback, so that I can keep my place while listening.
18. As the project owner, I want the transcript to remain read-only in V1, so that the displayed text reflects the service result without introducing an unapproved editing workflow.
19. As the project owner, I want to download the transcript as plain text, so that I can reuse the recognized text elsewhere.
20. As the project owner, I want to download an SRT subtitle file, so that I can use timestamped captions in a compatible media tool.
21. As the project owner, I want the interface to explain that the service temporarily retains successful source files for up to 24 hours and results for up to seven days, so that I understand where data remains after the page closes.
22. As the project owner, I want to know that failed job data is retained by the service for up to 24 hours, so that I understand the service's failure-data lifecycle.
23. As the project owner, I want the page to avoid presenting a saved history, so that its behavior matches the ephemeral, single-user V1 boundary.
24. As the project owner, I want the Clear Timeline layout to make the file action, player, transcript, and current time position easy to scan, so that I can move between recording and text without visual friction.
25. As the project owner, I want the player and transcript side by side on desktop and stacked on narrow screens, so that the same workflow remains usable on mobile.
26. As the project owner, I want readable Thai text, visible keyboard focus, and status labels that do not rely on color alone, so that the workspace remains understandable and operable.

## Implementation Decisions

- Use the existing Next.js App Router application and local STT service; do not add a separate public transcription provider.
- Keep the root shell statically rendered and place interactive file, job, player, and transcript state in the transcription workspace client boundary. Keep API requests uncached; ISR and server-rendered user data are not needed for this local, single-user flow.
- Use the Clear Timeline direction: cool light-blue canvas, white surfaces, navy text, a clear blue primary action/current-time marker, tabular timestamps, and a coordinate rail beside transcript segments. Keep file selection above the work areas; use adjacent player/transcript panels on desktop and natural vertical stacking on mobile.
- Keep the original `File` and its object URL in the current browser session for playback. Replacing the selection or leaving the workspace ends that local review; the frontend does not persist job tracking or transcript history.
- Restrict the interface to one active job. Accept MP3, M4A, WAV, FLAC, and MP4 with audio. Observe the service limits of 1 GiB per file, two hours per file, and ten waiting jobs. The service remains authoritative for media parsing, duration, and queue admission.
- Use these same-origin API contracts:
  - `GET /api/stt/health` reports whether the local service and its worker are ready.
  - `POST /api/stt/jobs` sends one multipart field named `file`; success returns HTTP 202 with `job_id` and `status=queued`.
  - `GET /api/stt/jobs/{job_id}` returns lifecycle status and progress, with safe error fields for failures.
  - `GET /api/stt/jobs/{job_id}/result?format=json|txt|srt` returns the successful transcript or requested export; the JSON transcript contains duration, segments with start/end/text, and full text.
- Keep the service destination server-controlled and loopback-only. The browser never chooses an upstream URL or calls the STT service cross-origin. Stream the upload through the Next.js proxy, reject cross-origin upload requests, validate job IDs and export formats, reject upstream redirects, and send no-store responses.
- Treat service responses as untrusted data and parse them at the client/server boundary. Render transcript text as text, not HTML. Translate known errors (including unavailable service, invalid media, full queue, missing/expired result, and internal failure) into user-facing recovery guidance.
- Preserve automatic language detection from the service; the UI language is Thai while transcript text remains in the detected language.
- Disclose successful-source retention (up to 24 hours), successful-result retention (up to seven days), and failed-data retention (up to 24 hours). A closed or reloaded page does not recover the job; the user selects and submits the source again.

## Testing Decisions

- Tests assert externally visible behavior: HTTP status/body and headers at the API boundary, and what the project owner sees and can do in the browser. They must not assert private component state, function names, or implementation-only call sequences.
- **API integration seam:** exercise the same-origin Next.js Route Handlers against a disposable, controllable loopback STT service. Cover health readiness; multipart upload and the returned job ID; status transitions; JSON/TXT/SRT result responses; service error mapping; uncached responses; and rejection of unsafe destinations or invalid identifiers/formats.
- **Browser journey seam:** drive the real workspace through same-origin API responses from a controlled fixture. Cover local file selection, readiness, explicit submission, upload/job states, successful transcript display, timestamp seek and playback-follow behavior, exports, and recoverable failures.
- **Visual review:** inspect the Clear Timeline empty, selected, processing, success, and failure states at desktop and mobile widths. Check Thai text wrapping, timeline legibility, keyboard focus, natural scrolling, and status labels.
- The repository currently has no configured unit, integration, or browser test runner and no prior test files for this feature. Select and add the smallest suitable test harness as part of the first implementation ticket; do not claim automated coverage until it is configured and run.

## Out of Scope

- Accounts, multi-user access, roles, or public/LAN deployment.
- Durable job history, browser persistence, or a transcript library.
- URL import, remote media, MOV/MKV support, or upload destinations other than the existing local STT service.
- Transcript editing, word-level alignment, manual language selection, concurrent tracked jobs, or cancellation of a job already accepted by the service.
- Replacing the existing service's API, worker, inference model, queue policy, or retention rules.

## Further Notes

- **GitHub spec issue:** [#1](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/1). Implementation tickets: [#2](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/2), [#3](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/3), and [#4](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/4).
- This spec captures the approved V1 scope and Clear Timeline design. The current frontend already contains the primary UI and same-origin proxy flows; the agreed tickets are intended to verify those end-to-end behaviors and close any acceptance gaps, rather than duplicate existing work.
- The local STT service returned HTTP 503 from the current preview during planning, so a live successful transcription, playback seek against a real result, and actual TXT/SRT downloads were not observed in this session.
- The project owner confirmed separate API integration and browser journey seams, and approved the three-ticket dependency order. GitHub Issues are the canonical tracker; the project-local Markdown spec and ticket files are maintained as reviewable copies. GitHub Actions is not used.
