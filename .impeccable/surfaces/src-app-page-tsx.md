---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: []
---

# Transcription Workspace

- **Scope and mode:** Root route `/`, Operate. One personal, local-first workflow; no account, durable app history, or multiple simultaneous tracked jobs.
- **Audience and task:** The owner runs the page on the same computer as the existing STT service, selects a supported local audio/video file, reviews it, and starts transcription explicitly.
- **Proof and content:** Show real job state. On success, keep the original browser file available for playback next to timestamped transcript segments. Replay a segment with up to 0.5 seconds of context on either side, allow text-only edits, save the complete review, view the immutable original ASR text, and offer JSON/TXT/SRT downloads of saved text. Block downloads while edits are unsaved.
- **Constraints:** Thai interface; media may be in varied languages and categories. Accept MP3, M4A, WAV, FLAC, and MP4 with audio; 1 GiB, two-hour, and ten-waiting-job limits. Warn before leaving during active processing. Disclose temporary service retention (successful source 24 hours, result seven days; failed data 24 hours). Explain service and job failures and allow a fresh upload.
- **Chosen visual direction:** Clear Timeline, selected from the three UI directions. Use a light cool-blue canvas, white workspace surfaces, navy text, and clear blue for the primary action and active playback position. Keep a conventional tool shell, original player, editable latest transcript, immutable original view, and the plotted coordinate rail. Desktop uses adjacent work areas; mobile stacks them and scrolls without clipping.

## Direction contract

**THESIS:** The interface clears away visual friction so the user can move between a clip and its words. The active blue time mark makes the current passage easy to find again.

**OWN-WORLD:** A cool blue-gray canvas separates crisp white work surfaces; navy carries readable copy and clear blue marks the primary action, selection, and active position. Use a clean Thai-capable sans and tabular time numerals. A fine plotted rail beside transcript segments is the signature; colors also distinguish real status and selection.

**STORY:** Choose a local file, check its details and service readiness, select the configured Whisper default or another supported model, then start. Follow queued and processing status. When complete, replay a bounded segment, correct its text, save the review, compare it with the original ASR transcript, and download JSON/TXT/SRT from the latest saved result. A failure explains recovery by selecting and submitting the file again.

**FIRST VIEWPORT:** Keep the header to the Time Atlas wordmark. On the empty start screen, pair the large Thai product heading and task explanation with a prominent local-file drop area and primary browse action. Show service status beside the upload only while it is checking or unavailable; keep the healthy state out of the header. Place the three-step workflow and temporary-retention disclosure in a quiet, flat row below. Once a file is selected, keep the file details, configured model selector, and explicit start action above the work areas. On desktop, place the player and transcript side by side, with more room for the transcript; on mobile, stack the heading, upload area, workflow, and disclosure with natural page scrolling. Keep the plotted transcript rail, original-view action, save state, and playback-follow behavior visible in the transcript workspace.

**FORM:** The selected Clear Timeline direction remains the visual system. The empty start state uses a split heading/upload composition and a flat workflow-and-retention row, while the existing player/transcript workspace keeps its established adjacent desktop layout and coordinate rail.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
