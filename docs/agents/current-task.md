# Current application task

## Accepted product work

Build the first version of a Thai-language, local-first transcription workspace for one personal user. The user selects one supported audio/video file from the local device, reviews it, and explicitly starts one job. The page tracks queue/processing while open, warns before leaving during an active job, and on success shows a playable local preview beside a read-only timestamped transcript. Selecting a segment seeks the media; the active segment follows playback. Provide TXT and SRT downloads.

Use the existing STT service on the same computer through a same-origin Next.js proxy. Support MP3, M4A, WAV, FLAC, and MP4 with audio. Respect limits of 1 GiB, two hours, and at most ten waiting service jobs. The interface has no account, archive, or persistent browser state. Tell the user that the service temporarily keeps successful source files for 24 hours and results for seven days; failed job data is retained for 24 hours. If the service is unavailable or a job fails, explain the issue and offer a fresh upload.

The user selected **Clear Timeline** from the three UI directions: use a light cool-blue canvas, white workspace surfaces, navy text, and blue for the primary action and active playback position. Keep timestamps tabular and use the coordinate rail beside transcript segments. The file picker stays above the work area; desktop places the player and transcript side by side, while mobile stacks them with natural scrolling. The approved direction contract is in `.impeccable/surfaces/src-app-page-tsx.md`.

## Completed setup task

The AI coding workflow was established inside this repository only, including all 56 skills from `backnotprop/pstack` and project-local model settings. They are installed under `.agents/skills/`, and the model map is `.agents/pstack-models.md`. Setup evidence is recorded in `docs/AI-FOUNDATION-REPORT.md`.

## Next task entry

The user approved the design brief and authorized implementation. Keep the architecture and security boundaries aligned with the accepted requirements above. If the user later selects a spec or ticket workflow, use its matching host skill only when available and allowed; do not create external tickets without authorization.
