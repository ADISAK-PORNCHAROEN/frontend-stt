import { describe, expect, it } from "vitest";
import { ALLOWED_EXTENSIONS, FILE_ACCEPT, MAX_FILE_BYTES, getFileExtension } from "@/features/transcription/constants";
import { formatDuration, formatFileSize, formatMediaType, formatTimestamp } from "@/features/transcription/format";
import { isJobId } from "@/features/transcription/types";

describe("transcription formats", () => {
  it("formats timestamps across minutes and hours and clamps invalid time", () => {
    expect(formatTimestamp(0)).toBe("00:00.0");
    expect(formatTimestamp(61.28)).toBe("01:01.2");
    expect(formatTimestamp(3661.9)).toBe("01:01:01.9");
    expect(formatTimestamp(-3)).toBe("00:00.0");
    expect(formatTimestamp(Number.NaN, false)).toBe("00:00");
    expect(formatDuration(3661)).toBe("01:01:01");
  });

  it("formats file sizes and media type fallbacks", () => {
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(1023)).toBe("1023 B");
    expect(formatFileSize(1024)).toBe("1 KiB");
    expect(formatFileSize(1024 ** 2)).toBe("1.0 MiB");
    expect(formatFileSize(MAX_FILE_BYTES)).toBe("1.00 GiB");
    expect(formatFileSize(-1)).toBe("ไม่ทราบขนาด");
    expect(formatFileSize(Number.POSITIVE_INFINITY)).toBe("ไม่ทราบขนาด");
    expect(formatMediaType({ name: "clip.mp4", type: "video/mp4" })).toBe("video/mp4");
    expect(formatMediaType({ name: "clip.wav", type: "" })).toBe("WAV (จากนามสกุล)");
    expect(formatMediaType({ name: "clip.", type: "" })).toBe("ไม่ทราบชนิดไฟล์");
  });

  it("normalizes extension and recognizes only well-shaped job IDs", () => {
    expect(ALLOWED_EXTENSIONS).toEqual(["mp3", "m4a", "wav", "flac", "mp4"]);
    expect(FILE_ACCEPT).toBe(".mp3,.m4a,.wav,.flac,.mp4");
    expect(getFileExtension("meeting.MP4")).toBe("mp4");
    expect(getFileExtension("no-extension")).toBe("");
    expect(getFileExtension("trailing.")).toBe("");
    expect(isJobId("0123456789abcdef0123456789abcdef")).toBe(true);
    expect(isJobId("G123456789abcdef0123456789abcdef")).toBe(false);
    expect(isJobId(null)).toBe(false);
  });
});
