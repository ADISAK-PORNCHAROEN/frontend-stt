import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TranscriptPanel } from "@/features/transcription/components/transcript-panel";
import type { Transcript } from "@/features/transcription/types";

const transcript: Transcript = {
  durationSeconds: 4,
  text: "first\nsecond",
  segments: [
    { id: 1, start: 0, end: 2, text: "first phrase" },
    { id: 2, start: 2, end: 4, text: "second phrase" },
  ],
};

function panelProps(overrides: Partial<Parameters<typeof TranscriptPanel>[0]> = {}): Parameters<typeof TranscriptPanel>[0] {
  return {
    transcript,
    currentTime: 0,
    isOriginal: false,
    isDirty: false,
    isSaving: false,
    saveState: { kind: "idle" },
    originalState: { kind: "unloaded" },
    onReplay: vi.fn(),
    onEdit: vi.fn(),
    onViewOriginal: vi.fn(),
    onViewLatest: vi.fn(),
    onSave: vi.fn(),
    ...overrides,
  };
}

describe("TranscriptPanel", () => {
  beforeEach(() => {
    Object.defineProperty(Element.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
  });

  it("highlights the active segment and replays a timestamp row", () => {
    const props = panelProps({ currentTime: 2.5 });
    const { container } = render(<TranscriptPanel {...props} />);
    expect(screen.getByRole("heading", { name: "บทถอดเสียง" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "เล่นช่วงเวลา 00:02.0" })).toHaveAttribute("aria-current", "true");
    expect(container.querySelector('[data-segment-id="2"]')).toHaveClass("is-active");
    fireEvent.change(screen.getByRole("textbox", { name: "แก้ไขข้อความช่วงเวลา 00:00.0" }), { target: { value: "revised" } });
    expect(props.onEdit).toHaveBeenCalledWith(1, "revised");
    fireEvent.click(screen.getByRole("button", { name: "เล่นช่วงเวลา 00:00.0" }));
    expect(props.onReplay).toHaveBeenCalledWith(transcript.segments[0]);
  });

  it("shows dirty, saving, saved, and failure states with the right controls", () => {
    const props = panelProps({
      isDirty: true,
      isSaving: true,
      saveState: { kind: "failed", message: "save failed" },
      originalState: { kind: "failed", message: "original failed" },
    });
    const { unmount } = render(<TranscriptPanel {...props} />);
    expect(screen.getByRole("status")).toHaveTextContent("ยังไม่ได้บันทึก");
    expect(screen.getAllByRole("alert").map((alert) => alert.textContent)).toEqual(["save failed", "original failed"]);
    expect(screen.getByText("original failed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "กำลังบันทึก" })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "แก้ไขข้อความช่วงเวลา 00:00.0" })).toBeDisabled();
    expect(props.onSave).not.toHaveBeenCalled();

    unmount();
    const savedView = render(<TranscriptPanel {...panelProps({ saveState: { kind: "saved" } })} />);
    expect(screen.getByRole("status")).toHaveTextContent("บันทึกแล้ว");
    savedView.unmount();
  });

  it("keeps the original transcript read-only, supports returning, and disables loading", () => {
    const props = panelProps({ isOriginal: true, originalState: { kind: "loaded", transcript } });
    const { rerender } = render(<TranscriptPanel {...props} />);
    expect(screen.getByRole("heading", { name: "บทถอดเสียงต้นฉบับ" })).toBeInTheDocument();
    expect(screen.getByText("first phrase")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "กลับไปฉบับแก้ไข" }));
    expect(props.onViewLatest).toHaveBeenCalledOnce();

    rerender(<TranscriptPanel {...panelProps({ originalState: { kind: "loading" } })} />);
    expect(screen.getByRole("button", { name: "กำลังโหลดต้นฉบับ" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "กำลังโหลดต้นฉบับ" }));
    expect(props.onViewOriginal).not.toHaveBeenCalled();
  });

  it("shows the empty transcript state without rows", () => {
    const emptyTranscript: Transcript = { durationSeconds: 0, segments: [], text: "" };
    render(<TranscriptPanel {...panelProps({ transcript: emptyTranscript, currentTime: 1 })} />);
    expect(screen.getByRole("status")).toHaveTextContent("ไม่พบคำพูดในไฟล์นี้");
    expect(screen.queryByRole("list", { name: "ช่วงของบทถอดเสียง" })).not.toBeInTheDocument();
  });
});
