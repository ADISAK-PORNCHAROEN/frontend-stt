import type { TranscriptSnapshot } from "./review-state";

export const TRANSCRIPT_EXPORT_FORMATS = ["json", "txt", "srt"] as const;
export type TranscriptExportFormat = typeof TRANSCRIPT_EXPORT_FORMATS[number];

export type TranscriptExport = Readonly<{
  content: string;
  fileName: string;
  mimeType: string;
}>;

function srtTimestamp(seconds: number): string {
  const totalMilliseconds = Math.max(0, Math.round(seconds * 1_000));
  const hours = Math.floor(totalMilliseconds / 3_600_000);
  const minutes = Math.floor((totalMilliseconds % 3_600_000) / 60_000);
  const wholeSeconds = Math.floor((totalMilliseconds % 60_000) / 1_000);
  const milliseconds = totalMilliseconds % 1_000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(wholeSeconds).padStart(2, "0")},${String(milliseconds).padStart(3, "0")}`;
}

export function serializeTranscript(snapshot: TranscriptSnapshot, format: TranscriptExportFormat): string {
  if (format === "json") {
    return JSON.stringify({
      duration_seconds: snapshot.durationSeconds,
      segments: snapshot.segments.map(({ id, start, end, text }) => ({ id, start, end, text })),
      text: snapshot.text,
    }, null, 2);
  }

  if (format === "txt") return snapshot.segments.map(({ text }) => text).join("\n");

  return snapshot.segments.map(({ start, end, text }, index) =>
    `${index + 1}\n${srtTimestamp(start)} --> ${srtTimestamp(end)}\n${text}`,
  ).join("\n\n");
}

export function createTranscriptExport(
  snapshot: TranscriptSnapshot,
  revisionId: string,
  format: TranscriptExportFormat,
): TranscriptExport {
  const safeRevisionId = revisionId.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  return {
    content: serializeTranscript(snapshot, format),
    fileName: `transcript-${safeRevisionId}.${format}`,
    mimeType: format === "json" ? "application/json;charset=utf-8" : "text/plain;charset=utf-8",
  };
}
