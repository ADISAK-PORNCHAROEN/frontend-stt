# 01: Extract the transcription session lifecycle

**What to build:** The project owner can use the transcription workspace exactly as before while the upload and job lifecycle has one feature-local owner that is easier to change safely.

**GitHub Issue:** [#6](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/6) · **Parent spec:** [#5 Transcription Frontend Architecture and Reuse](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/5).

**Blocked by:** None. This ticket can start immediately.

**Status:** ready-for-agent.

- [ ] The existing empty, selected, unavailable, uploading, queued, processing, success, and failure states retain their user-visible behavior.
- [ ] One feature-local workflow owner coordinates file/session state, service readiness, upload progress, job polling, unload warnings, and cleanup of timers and object URLs.
- [ ] Playback time, media element coordination, transcript seeking, and active-segment following stay with the workspace and media UI.
- [ ] The browser API boundary continues to parse untrusted responses into feature types; same-origin endpoints and the server-only loopback proxy keep their current contracts and safeguards.
- [ ] Starting a new selection or leaving the page cannot let a stale response overwrite the current session or leak a timer/object URL; browser tracking remains distinct from cancelling a service job.
- [ ] The API integration and browser journey seams verify the existing externally visible workflow. Any automated-test-runner gap is reported accurately; this ticket does not silently add a test framework.
- [ ] The Clear Timeline layout and keyboard/mobile behavior remain visually consistent, and no new dependency is required.
