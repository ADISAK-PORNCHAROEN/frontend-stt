# 01 — Select a Whisper Model per Job

**GitHub ticket:** [frontend-stt#9](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/9)
**Status:** Blocked
**Ready for agent:** No — waiting for frontend-stt#5 and stt-service#11.

## Parent

[Whisper Model Choice and Transcript Review](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/8)

## Service prerequisite

[stt-service#11: Select and Run a Whisper Model per Job](https://github.com/ADISAK-PORNCHAROEN/stt-service/issues/11)

## What to build

Add the model choice to the existing frontend submission flow and carry it through the same-origin proxy. Keep service-side validation, persistence, and worker behavior in stt-service#11.

## Acceptance criteria

- [ ] The workspace offers Turbo and large-v3 when starting a new job.
- [ ] The initial selection matches the configured model returned by the STT service readiness contract.
- [ ] Submitting a job sends the selected model through the same-origin route and proxy as part of the upload; the browser never calls the STT service directly.
- [ ] The workspace presents service-reported model-load failures as clear job errors.
- [ ] Playwright verifies the service-configured default, both dropdown options, model forwarding through the proxy, and recoverable errors.
- [ ] The selector works with keyboard input and remains usable on narrow screens.

## Blocked by

- [frontend-stt#5 Transcription Frontend Architecture and Reuse](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/5) — finish the active frontend architecture work first.
- [stt-service#11 Select and Run a Whisper Model per Job](https://github.com/ADISAK-PORNCHAROEN/stt-service/issues/11) — the service must accept and expose the per-job model contract first.
