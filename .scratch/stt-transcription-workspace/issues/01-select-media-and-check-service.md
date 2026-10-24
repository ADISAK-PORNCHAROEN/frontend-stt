# 01: Select a media file and check service readiness

**What to build:** The project owner can choose a supported local recording, review it in the Clear Timeline workspace, and see whether the local STT service can accept a job.

**GitHub Issue:** [#2](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/2) · **Spec:** [#1](https://github.com/ADISAK-PORNCHAROEN/frontend-stt/issues/1)

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] The Clear Timeline empty and selected-file states let the owner browse or drop one MP3, M4A, WAV, FLAC, or MP4 file with audio.
- [ ] The selected file's name, size, type, and playable local preview are shown when browser metadata is available; unsupported files, files over 1 GiB, and readable durations over two hours receive clear Thai guidance.
- [ ] The page reads readiness from the same-origin health endpoint, explains an unavailable service, and only enables explicit submission when a valid file is selected and the service is ready.
- [ ] The file picker, service state, retention notice, and primary action follow Clear Timeline on desktop and mobile, with keyboard focus and readable Thai text.
- [ ] API integration coverage exercises the health endpoint against a controllable local service; browser coverage verifies selection, validation, readiness, and the disabled/enabled start action.

