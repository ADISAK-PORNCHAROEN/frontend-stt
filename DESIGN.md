---
name: Time Atlas - Clear Timeline
description: A calm, light transcription workspace that connects a recording to its transcript by time.
colors:
  canvas: "#eff5fb"
  surface: "#ffffff"
  surface-soft: "#f8fbff"
  surface-tint: "#dce7f2"
  ink: "#172b49"
  ink-muted: "#536982"
  accent: "#3c66d3"
  accent-hover: "#365fc6"
  accent-soft: "#edf3ff"
  coordinate: "#8195b1"
  coordinate-soft: "#a9bdd6"
  line: "#d7e2ef"
  danger: "#96363e"
  danger-soft: "#fff3f1"
  success: "#26764f"
typography:
  display:
    fontFamily: "Noto Sans Thai, Geist Sans, Tahoma, sans-serif"
    fontSize: "clamp(30px, 3.6vw, 48px)"
    fontWeight: 660
    lineHeight: 1.16
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Noto Sans Thai, Geist Sans, Tahoma, sans-serif"
    fontSize: "16px"
    lineHeight: 1.55
  label:
    fontFamily: "Geist Mono, Consolas, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.7
rounded:
  md: "8px"
  lg: "12px"
  xl: "16px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#ffffff"
    typography: "14px / 640"
    rounded: "{rounded.md}"
    padding: "9px 16px"
    height: "44px"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "14px 20px"
  transcript-segment:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "14px / 1.65"
    rounded: "{rounded.md}"
    padding: "9px 10px"
---

# Design System: Time Atlas - Clear Timeline

## Creative direction

**North Star: Clear Timeline**

Keep the page calm, light, and task-focused. Make the next step obvious: select a local file, start transcription, then move through the recording by timestamp. Use the transcript rail as a useful position cue, not decoration.

Keep the Time Atlas wordmark. Use a cool blue-gray canvas, white panels, deep navy text, and one clear blue accent. Thai copy stays readable at normal body size.

## Color and type

- Canvas #eff5fb; white surfaces; soft areas #f8fbff and #dce7f2.
- Primary text #172b49; supporting text #536982.
- Clear blue #3c66d3 marks primary actions, active transcript, and current playback time.
- Muted blues #8195b1 and #a9bdd6 draw inactive timeline points and rails.
- Pair ready green #26764f and error red #96363e with readable status text.
- Use Noto Sans Thai with Geist Sans and Tahoma fallbacks. Use Geist Mono with Consolas for tabular timestamps.
- Display type is 30-48px; body is 16px with 1.55 line-height; supporting copy is 12-14px.

Do not bring back the old dark navy and amber palette. Keep the blue accent purposeful.

## Layout

Center the page in a shell capped at 1380px. Use 32px outer insets on desktop and 16px on small screens. Keep only the product mark in the compact header. Show service status beside file selection while it is checking or unavailable, with a retry action for unavailable service; omit the healthy status indicator.

Keep the header and footer at the viewport edges on supported desktop and mobile sizes. The start screen balances its file drop area with concise workflow and retention information. After a file is chosen, align its name, replacement action, model, and start control in one toolbar. During processing, keep the original player and a compact status panel visible together. After success, place the original media on the left and a wider transcript workspace on the right at desktop sizes; stack the media above the transcript on mobile. Keep the page within one viewport and make the transcript list the only scroll region in every completed state. Verify the layout at 1440×1000, 1280×720, and 390×844.

Use 4px spacing increments. Panels use 16px corners and a restrained shadow. The transcript panel uses internal scrolling at desktop and mobile sizes. Keep editing and save controls in view while transcript rows scroll.

## Interaction details

- Use blue with white text for the primary start and save actions; keep secondary actions outlined.
- Keep the upload target compact and dashed, with file types and retention information near the action.
- Use a dark viewport for video inside the light media frame.
- Pair each timestamp with a thin rail and point. Mark the active row with a pale-blue fill, blue leading edge, rail, and point.
- Keep the original ASR transcript immutable. Let the owner edit existing segment text while preserving IDs, order, times, and structure; saving and viewing the original are explicit actions.
- Let the timestamp control replay its segment with up to 0.5 seconds of context on either side, then stop. Disable JSON/TXT/SRT downloads until the current edits are saved.
- Show Turbo and large-v3 before starting a job, with the service-configured default selected.
- Preserve visible keyboard focus and reduced-motion support.

## Do

- Keep file selection first and the player and transcript tied to one active job.
- Let long Thai transcript lines wrap.
- Pair status colors with labels and keep error/retention copy near the related action.

## Don't

- Don't use dark panels, amber highlights, or decorative atlas wallpaper.
- Don't make timestamps look like body text.
- Don't imply media or transcript history is saved in the browser.
- Don't make active state depend on color alone.
