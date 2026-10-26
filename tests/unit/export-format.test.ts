import { describe, expect, it } from "vitest";
import { createTranscriptExport, serializeTranscript } from "@/features/transcription/export-format";
import { initialReviewState } from "@/features/transcription/review-state";
import type { Transcript } from "@/features/transcription/types";

const transcript: Transcript = {
  durationSeconds: 62,
  text: "First phrase\nSecond phrase",
  segments: [
    { id: 4, start: 0, end: 2.001, text: "First phrase" },
    { id: 9, start: 60.9996, end: 62, text: "Second phrase" },
  ],
};
const snapshot = initialReviewState(transcript).snapshots[0]?.transcript;
if (!snapshot) throw new Error("Expected an immutable transcript snapshot");

describe("selected transcript export formats", () => {
  it("serializes the selected snapshot as the established JSON contract", () => {
    expect(JSON.parse(serializeTranscript(snapshot, "json"))).toEqual({
      duration_seconds: 62,
      segments: transcript.segments,
      text: transcript.text,
    });
  });

  it("serializes segment text as TXT and numbers each timed segment as SRT", () => {
    expect(serializeTranscript(snapshot, "txt")).toBe("First phrase\nSecond phrase");
    expect(serializeTranscript(snapshot, "srt")).toBe(
      "1\n00:00:00,000 --> 00:00:02,001\nFirst phrase\n\n2\n00:01:01,000 --> 00:01:02,000\nSecond phrase",
    );
  });

  it("keeps download names bounded to the revision ID and declares the format MIME type", () => {
    expect(createTranscriptExport(snapshot, "DRAFT 4/../../secret", "json")).toMatchObject({
      fileName: "transcript-draft-4-------secret.json",
      mimeType: "application/json;charset=utf-8",
    });
    expect(createTranscriptExport(snapshot, "original", "srt")).toMatchObject({
      fileName: "transcript-original.srt",
      mimeType: "text/plain;charset=utf-8",
    });
  });
});
