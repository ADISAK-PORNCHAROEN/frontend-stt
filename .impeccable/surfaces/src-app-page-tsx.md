---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: []
---

# Transcription Workspace

- **Scope and mode:** Root route `/`, Operate. One personal, local-first workflow; no account, durable app history, or multiple simultaneous tracked jobs.
- **Audience and task:** The owner runs the page on the same computer as the existing STT service, selects a supported local audio/video file, reviews it, and starts transcription explicitly.
- **Proof and content:** Show real job state. On success, keep the original browser file available for playback next to a read-only transcript of timestamped segments. Segment selection seeks; playback highlights and follows the active segment. Offer TXT and SRT downloads.
- **Constraints:** Thai interface; media may be in varied languages and categories. Accept MP3, M4A, WAV, FLAC, and MP4 with audio; 1 GiB, two-hour, and ten-waiting-job limits. Warn before leaving during active processing. Disclose temporary service retention (successful source 24 hours, result seven days; failed data 24 hours). Explain service and job failures and allow a fresh upload.
- **Chosen visual direction:** Clear Timeline, selected from the three UI directions. Use a light cool-blue canvas, white workspace surfaces, navy text, and clear blue for the primary action and active playback position. Keep a conventional tool shell, original player, read-only transcript, and the plotted coordinate rail. Desktop uses adjacent work areas; mobile stacks them and scrolls without clipping.

## Direction contract

**THESIS:** The interface clears away visual friction so the user can move between a clip and its words. The active blue time mark makes the current passage easy to find again.

**OWN-WORLD:** A cool blue-gray canvas separates crisp white work surfaces; navy carries readable copy and clear blue marks the primary action, selection, and active position. Use a clean Thai-capable sans and tabular time numerals. A fine plotted rail beside transcript segments is the signature; colors also distinguish real status and selection.

**STORY:** Choose a local file, check its details and service readiness, then start. Follow queued and processing status. When complete, play the original and see the matching segment highlighted; export TXT or SRT. A failure explains recovery by selecting and submitting the file again.

**FIRST VIEWPORT:** A compact header names the tool and reports service readiness. A restrained heading leads into the full-width file picker and explicit start action above the work area. White player and transcript surfaces sit side by side on desktop, with a slightly wider transcript; each row places its timestamp and plotted coordinate on a narrow rail. On mobile, stack these areas with natural page scrolling. Status and retention information remain visible without covering the transcript.

**FORM:** The third Clear Timeline UI direction in `.impeccable/prototypes/index.html` was selected; code-led path. The choice preserves the transcript rail and task structure while replacing the dark palette with light blue-gray surfaces and a stronger blue action color.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
