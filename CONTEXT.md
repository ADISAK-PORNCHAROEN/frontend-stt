# Transcription Workspace

This context defines the language for the single-user, local transcription workspace being designed for this project.

## Media and transcript

**Transcription workspace**:
The user's current place to review one media file alongside its transcription job and result.
_Avoid_: history, project

**Media file**:
A video or audio file selected from the user's device and submitted for transcription.
_Avoid_: clip URL, remote media

**Transcription job**:
One submitted media file moving through queued, processing, and completed or failed states.
_Avoid_: task (when referring to one transcription), project

**Transcript segment**:
A time-bounded span of recognized text within a transcription result. Selecting a segment seeks playback to its time position.
_Avoid_: paragraph, subtitle (unless referring to an exported subtitle format)

**Original transcript**:
The unchanged text first produced by ASR for a transcription job; it remains separate from reviewed text.
_Avoid_: latest transcript

**Transcript revision**:
A snapshot of transcript text at one point in review, classified as the original, a draft, or the latest reviewed transcript.
_Avoid_: transcript history (unless referring to a persistent archive)

**Review draft**:
A saved intermediate transcript revision that has not been committed as the latest reviewed transcript.
_Avoid_: unsaved edits

**Latest reviewed transcript**:
The most recently committed transcript text after manual corrections. Committing updated text replaces this version while the original transcript remains available.
_Avoid_: original transcript
