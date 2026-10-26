import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_FILE_BYTES } from "@/features/transcription/constants";
import { FileDrop } from "@/features/transcription/components/file-drop";
import { MediaPlayer } from "@/features/transcription/components/media-player";
import type { MediaFile } from "@/features/transcription/types";

function makeFile(name: string, type = "audio/wav", size = 16): File {
  const file = new File(["synthetic fixture"], name, { type });
  Object.defineProperty(file, "size", { configurable: true, value: size });
  return file;
}

describe("FileDrop", () => {
  it("keeps compact file replacement free of dropzone-only copy and references only rendered errors", () => {
    const { container, rerender } = render(<FileDrop compact disabled={false} error={null} onSelect={vi.fn()} onInvalid={vi.fn()} />);
    const input = container.querySelector<HTMLInputElement>("#media-file");
    if (!input) throw new Error("Compact media file input not rendered");
    expect(input).not.toHaveAttribute("aria-describedby");
    expect(container.querySelector("#file-help, .drop-footnote, .drop-size, .drop-copy")).not.toBeInTheDocument();
    expect(screen.getByLabelText("เปลี่ยนไฟล์")).toBeInTheDocument();

    rerender(<FileDrop compact disabled={false} error="ไฟล์ไม่รองรับ" onSelect={vi.fn()} onInvalid={vi.fn()} />);
    expect(input).toHaveAttribute("aria-describedby", "file-error");
    expect(container.querySelector("#file-error")).toHaveTextContent("ไฟล์ไม่รองรับ");
    expect(container.querySelector("#file-help, .drop-footnote, .drop-size")).not.toBeInTheDocument();
  });

  it("selects supported files by picker and drop, and clears the native input", () => {
    const onSelect = vi.fn();
    const { container } = render(<FileDrop disabled={false} error={null} onSelect={onSelect} onInvalid={vi.fn()} />);
    const input = container.querySelector<HTMLInputElement>("#media-file");
    if (!input) throw new Error("Media file input not rendered");
    fireEvent.change(input, { target: { files: [makeFile("clip.MP4", "video/mp4")] } });
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ name: "clip.MP4" }));
    expect(input.value).toBe("");

    const drop = container.querySelector(".file-drop");
    if (!drop) throw new Error("File drop surface not rendered");
    fireEvent.dragOver(drop);
    const file = makeFile("dropped.flac", "audio/flac");
    fireEvent.dragEnter(drop, { dataTransfer: { files: [file] } });
    expect(drop).toHaveClass("is-dragging");
    fireEvent.dragLeave(drop, { target: drop });
    expect(drop).not.toHaveClass("is-dragging");
    fireEvent.drop(drop, { dataTransfer: { files: [file] } });
    expect(onSelect).toHaveBeenLastCalledWith(file);
  });

  it("reports invalid extension and oversized files and renders the error state", () => {
    const onInvalid = vi.fn();
    const { container, rerender } = render(<FileDrop disabled={false} error="previous error" onSelect={vi.fn()} onInvalid={onInvalid} />);
    expect(container.querySelector(".file-drop")).toHaveClass("has-error");
    expect(screen.getByRole("status")).toHaveTextContent("previous error");
    const input = screen.getByLabelText("เลือกไฟล์");
    fireEvent.change(input, { target: { files: [makeFile("unsupported.mov", "video/quicktime")] } });
    expect(onInvalid).toHaveBeenCalledWith(expect.stringContaining("รูปแบบไฟล์นี้ยังไม่รองรับ"));

    const largeFile = makeFile("large.wav", "audio/wav", MAX_FILE_BYTES + 1);
    const drop = container.querySelector(".file-drop");
    if (!drop) throw new Error("File drop surface not rendered");
    fireEvent.drop(drop, { dataTransfer: { files: [largeFile] } });
    expect(onInvalid).toHaveBeenLastCalledWith("ไฟล์มีขนาดเกิน 1 GiB กรุณาเลือกไฟล์ที่เล็กกว่านี้");

    rerender(<FileDrop disabled={false} error={null} onSelect={vi.fn()} onInvalid={onInvalid} />);
    fireEvent.change(screen.getByLabelText("เลือกไฟล์"), { target: { files: [] } });
    expect(onInvalid).toHaveBeenCalledTimes(2);
  });

  it("ignores selection and drag state while disabled", () => {
    const onSelect = vi.fn();
    const { container } = render(<FileDrop disabled error={null} onSelect={onSelect} onInvalid={vi.fn()} />);
    const drop = container.querySelector(".file-drop");
    if (!drop) throw new Error("File drop surface not rendered");
    fireEvent.dragEnter(drop);
    fireEvent.change(screen.getByLabelText("เลือกไฟล์"), { target: { files: [makeFile("clip.wav")] } });
    fireEvent.drop(drop, { dataTransfer: { files: [makeFile("clip.wav")] } });
    expect(drop).not.toHaveClass("is-dragging");
    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe("MediaPlayer", () => {
  beforeEach(() => {
    Object.defineProperty(HTMLMediaElement.prototype, "play", { configurable: true, value: vi.fn().mockResolvedValue(undefined) });
  });

  function renderPlayer(name: string, durationSeconds: number | null) {
    const media: MediaFile = { file: makeFile(name), url: "blob:fixture", durationSeconds };
    const playerRef: { current: HTMLMediaElement | null } = { current: null };
    const onTimeChange = vi.fn();
    const onSeeking = vi.fn();
    const onDuration = vi.fn();
    const view = render(<MediaPlayer media={media} playerRef={playerRef} currentTime={12.3} onTimeChange={onTimeChange} onSeeking={onSeeking} onDuration={onDuration} />);
    return { ...view, playerRef, onTimeChange, onSeeking, onDuration };
  }

  it("renders audio controls and forwards timing, seek, metadata, and preview failure", () => {
    const { playerRef, onTimeChange, onSeeking, onDuration } = renderPlayer("voice.wav", null);
    const audio = screen.getByLabelText("เล่นไฟล์เสียง voice.wav");
    expect(audio).toHaveAttribute("controls");
    expect(playerRef.current).toBe(audio);
    expect(screen.getByText("อ่านความยาวสื่อไม่ได้")).toBeInTheDocument();

    Object.defineProperty(audio, "currentTime", { configurable: true, value: 2.5 });
    fireEvent.timeUpdate(audio);
    fireEvent.seeking(audio);
    expect(onTimeChange).toHaveBeenCalledWith(2.5);
    expect(onSeeking).toHaveBeenCalledOnce();

    Object.defineProperty(audio, "duration", { configurable: true, value: 34 });
    fireEvent.loadedMetadata(audio);
    expect(onDuration).toHaveBeenCalledWith(34);
    Object.defineProperty(audio, "duration", { configurable: true, value: Number.NaN });
    fireEvent.loadedMetadata(audio);
    expect(onDuration).toHaveBeenCalledTimes(1);

    fireEvent.error(audio);
    expect(screen.getByRole("status")).toHaveTextContent("เบราว์เซอร์เล่นตัวอย่างไฟล์นี้ไม่ได้");
  });

  it("renders video controls and updates the media timestamp", () => {
    const { playerRef, onDuration, onTimeChange } = renderPlayer("clip.MP4", 28);
    const video = screen.getByLabelText("เล่นวิดีโอ clip.MP4");
    expect(video.tagName).toBe("VIDEO");
    expect(video).toHaveAttribute("controls");
    expect(playerRef.current).toBe(video);
    Object.defineProperty(video, "duration", { configurable: true, value: 28 });
    Object.defineProperty(video, "currentTime", { configurable: true, value: 6.75 });
    fireEvent.loadedMetadata(video);
    fireEvent.timeUpdate(video);
    expect(onDuration).toHaveBeenCalledWith(28);
    expect(onTimeChange).toHaveBeenCalledWith(6.75);
    expect(screen.getByText("ความยาว 00:28")).toBeInTheDocument();
    fireEvent.error(video);
    expect(screen.getByRole("status")).toHaveTextContent("เบราว์เซอร์เล่นตัวอย่างไฟล์นี้ไม่ได้");
  });
});
