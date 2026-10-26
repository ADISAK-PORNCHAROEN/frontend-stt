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

**THESIS:** Make the transcript the main place to work. Keep its time rail, active passage, and editing state easy to scan while the source clip stays visible for reference.

**OWN-WORLD:** Keep Time Atlas's cool blue-gray canvas, crisp white surfaces, navy copy, clear blue actions, Thai-capable sans, and tabular time numerals. The plotted time rail beside transcript segments remains the signature; status colors describe real state.

**STORY:** Choose a local file and start explicitly. Keep selected-file details, replacement, model choice, and start together. Show a compact, full-width progress strip while uploading, queued, or processing. After success, put the transcript on the left at roughly two thirds of the workspace and the original media player on the right. Preserve whole-row timestamp replay, follow controls, text-only edit and save, immutable original view, recoverable failures, and saved-only JSON/TXT/SRT downloads.

**FIRST VIEWPORT:** Keep the header to the Time Atlas wordmark. Preserve the existing empty start screen's heading, full-width local-file drop area, workflow, and temporary-retention disclosure. In the selected state, put the filename and metadata, one file replacement picker, model selector, and explicit start action in one compact toolbar without an empty column or leaked dropzone help. Put processing status above the media and guidance areas. After success, show transcript first and media second on desktop; below 1024px, stack them in DOM order with natural page scrolling. At desktop-fit sizes, keep the header and footer in view and make only the transcript list scroll.

**FORM:** Direction roll seed key `f671f96e` (surface, reroll 0; `.impeccable/questions/roll.json`). Follow the user's selected Transcript-first Review sketch at `.impeccable/mocks/decision/transcript-first-review.html`. Keep the existing Clear Timeline visual system and coordinate rail. Use a private, stateless workspace layout shell only if it owns the shared responsive ratio and desktop-fit scroll containment; do not add a controller, new state, or service/API surface. Preserve current clear-to-home and file-replacement actions.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
