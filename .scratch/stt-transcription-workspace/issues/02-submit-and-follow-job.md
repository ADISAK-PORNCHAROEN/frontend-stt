# 02: Submit one file and follow its transcription job

**What to build:** The owner can submit the selected file once, follow upload and job progress, and recover clearly when the service or job fails.

**Blocked by:** 01: Select a media file and check service readiness.

**Status:** ready-for-agent

- [ ] The explicit start action sends one multipart field named `file` through the same-origin upload endpoint; the Next.js proxy streams it only to the configured loopback STT service and does not buffer the full upload.
- [ ] The workspace shows upload progress, queued/processing status, and service-reported progress for one job at a time; a successful state appears only after the service reports success.
- [ ] Leaving the page during upload or processing triggers a browser warning; the page does not persist job tracking or create a history entry.
- [ ] Unavailable service, queue-full, invalid media, expired job, and processing failures produce clear Thai messages and a fresh-file recovery path.
- [ ] The page discloses the service's temporary retention: successful source files up to 24 hours, successful results up to seven days, and failed job data up to 24 hours.
- [ ] API integration coverage exercises streamed multipart submission, job ID handling, status/progress transitions, safe errors, and no-store responses against a controllable local service; browser coverage verifies the visible lifecycle and recovery behavior.

