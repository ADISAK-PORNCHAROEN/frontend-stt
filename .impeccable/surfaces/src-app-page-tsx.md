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
- **Chosen visual direction:** Stable Workbench, explicitly selected by the owner. Keep Clear Timeline's cool-blue canvas, white workspace surfaces, navy text, and clear blue for primary actions and active playback. Retain the conventional tool shell, original player, editable latest transcript, immutable original view, and plotted coordinate rail.

## Direction contract

**THESIS:** Keep the media and transcript in a stable workbench. The source clip remains easy to operate while timestamped text stays visible, editable, and tied to playback.

**OWN-WORLD:** Keep Time Atlas's cool blue-gray canvas, crisp white surfaces, navy copy, clear blue actions, Thai-capable sans, and tabular time numerals. The plotted time rail beside transcript segments remains the signature; status colors describe real state.

**STORY:** Choose a local file and start explicitly. Keep selected-file details, replacement, model choice, and start together in a balanced toolbar. During processing, keep the player and compact progress details beside one another. After success, put the original media on the left and the transcript on the right on desktop; place media above transcript on mobile. Preserve whole-row timestamp replay, follow controls, text-only edit and save, immutable original view, recoverable failures, and saved-only JSON/TXT/SRT downloads.

**FIRST VIEWPORT:** Keep the header to the Time Atlas wordmark. Give the home screen a clear hero, a distinct file drop area, short workflow guidance, and concise temporary-retention information. In the selected state, put the filename and metadata, replacement picker, model selector, and explicit start action in one compact toolbar without an empty column or leaked dropzone help. During processing, show media and job state together. After success, keep media left and transcript right on desktop, then stack media above transcript on mobile. At 1440×1000, 1280×720, and 390×844, keep header and footer anchored, prevent document scrolling, and make only transcript rows scroll in review states.

**FORM:** Follow the owner's selected Stable Workbench sketch at `.impeccable/mocks/decision/stable-workbench-20261026.html`. Keep Clear Timeline's color, type, panel, and coordinate-rail system. Use a private, stateless workspace layout shell only if it owns the shared responsive ratio and viewport-contained scroll behavior; do not add a controller, new state, or service/API surface. Preserve current clear-to-home and file-replacement actions.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
