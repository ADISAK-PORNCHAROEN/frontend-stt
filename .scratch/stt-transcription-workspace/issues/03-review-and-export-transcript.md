# 03: Review and export a completed transcript

**What to build:** After a job succeeds, the owner can compare the read-only transcript with the original recording, seek by timestamp, follow playback, and download the result.

**Blocked by:** 02: Submit one file and follow its transcription job.

**Status:** ready-for-agent

- [ ] The workspace retrieves the successful JSON result and shows the browser-held original media beside its timestamped transcript segments.
- [ ] Selecting a segment timestamp seeks to and plays the matching media position; the active segment is highlighted and followed during playback.
- [ ] Transcript text remains read-only; TXT and SRT exports download from the same-origin result endpoint.
- [ ] The coordinate rail and tabular timestamps follow Clear Timeline; the player and transcript sit side by side on desktop and stack with natural scrolling on mobile.
- [ ] API integration coverage verifies JSON, TXT, and SRT result behavior and unavailable-result errors against a controllable local service; browser coverage verifies seek, active-segment follow, and downloads using a successful-result fixture.
- [ ] Visual review covers the completed state at desktop and mobile widths, including long Thai transcript lines, keyboard focus, and readable timestamps.

