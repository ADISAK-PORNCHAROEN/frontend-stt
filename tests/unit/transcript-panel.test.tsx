import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
    activeEdit: null,
    onReplay: vi.fn(),
    onBeginEdit: vi.fn(),
    onEdit: vi.fn(),
    onStageEdit: vi.fn(),
    onCancelEdit: vi.fn(),
    onViewOriginal: vi.fn(),
    onViewLatest: vi.fn(),
    onSave: vi.fn(),
    ...overrides,
  };
}

describe("TranscriptPanel", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("makes each read-only row a keyboard-operable playback control and highlights the active segment", () => {
    const props = panelProps({ currentTime: 2.5 });
    const { container } = render(<TranscriptPanel {...props} />);
    expect(screen.getByRole("heading", { name: "บทถอดเสียง" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /เล่นช่วงเวลา 00:02.0: second phrase/ })).toHaveAttribute("aria-current", "true");
    expect(container.querySelector('[data-segment-id="2"]')).toHaveClass("is-active");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /เล่นช่วงเวลา 00:00.0: first phrase/ }));
    expect(props.onReplay).toHaveBeenCalledWith(transcript.segments[0]);
    expect(screen.getByRole("button", { name: "แก้ไขข้อความช่วงเวลา 00:00.0" })).toBeEnabled();
  });

  it("edits one row at a time and stages or cancels the active draft", () => {
    const props = panelProps();
    const { rerender } = render(<TranscriptPanel {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "แก้ไขข้อความช่วงเวลา 00:00.0" }));
    expect(props.onBeginEdit).toHaveBeenCalledWith(1);

    const editedProps = panelProps({ activeEdit: { segmentId: 1, text: "draft" }, isDirty: true });
    rerender(<TranscriptPanel {...editedProps} />);
    const editor = screen.getByRole("textbox", { name: "แก้ไขข้อความช่วงเวลา 00:00.0" });
    expect(editor).toHaveValue("draft");
    expect(screen.getByRole("button", { name: "แก้ไขข้อความช่วงเวลา 00:02.0" })).toBeDisabled();
    const replayButton = screen.getByRole("button", { name: "เล่นช่วงเวลา 00:00.0" });
    expect(replayButton).toHaveAttribute("aria-current", "true");
    fireEvent.click(replayButton);
    expect(editedProps.onReplay).toHaveBeenCalledWith(transcript.segments[0]);
    fireEvent.change(editor, { target: { value: "revised" } });
    expect(editedProps.onEdit).toHaveBeenCalledWith("revised");
    fireEvent.click(screen.getByRole("button", { name: "เก็บช่วงนี้" }));
    expect(editedProps.onStageEdit).toHaveBeenCalledOnce();
    rerender(<TranscriptPanel {...panelProps({ isDirty: true })} />);
    expect(screen.getByRole("button", { name: "แก้ไขข้อความช่วงเวลา 00:00.0" })).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "แก้ไขข้อความช่วงเวลา 00:00.0" }));
    const canceledProps = panelProps({ activeEdit: { segmentId: 1, text: "draft again" }, isDirty: true });
    rerender(<TranscriptPanel {...canceledProps} />);
    fireEvent.click(screen.getByRole("button", { name: "ยกเลิก" }));
    expect(canceledProps.onCancelEdit).toHaveBeenCalledOnce();
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
    expect(screen.getByRole("button", { name: "แก้ไขข้อความช่วงเวลา 00:00.0" })).toBeDisabled();
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
    expect(screen.queryByRole("button", { name: /แก้ไขข้อความ/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /เล่นช่วงเวลา 00:00.0/ }));
    expect(props.onReplay).toHaveBeenCalledWith(transcript.segments[0]);
    fireEvent.click(screen.getByRole("button", { name: "กลับไปฉบับแก้ไข" }));
    expect(props.onViewLatest).toHaveBeenCalledOnce();

    const loadingProps = panelProps({ originalState: { kind: "loading" } });
    rerender(<TranscriptPanel {...loadingProps} />);
    expect(screen.getByRole("button", { name: "กำลังโหลดต้นฉบับ" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "กำลังโหลดต้นฉบับ" }));
    expect(loadingProps.onViewOriginal).not.toHaveBeenCalled();
  });

  it("pauses follow on manual scrolling and exposes Return to Follow", () => {
    const scrollTo = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollTo", { configurable: true, value: scrollTo });
    const nativeGetComputedStyle = window.getComputedStyle.bind(window);
    vi.spyOn(window, "getComputedStyle").mockImplementation((element) => {
      const style = nativeGetComputedStyle(element);
      if (element instanceof HTMLOListElement && element.classList.contains("transcript-list")) {
        Object.defineProperty(style, "overflowY", { configurable: true, value: "auto" });
      }
      return style;
    });
    render(<TranscriptPanel {...panelProps()} />);
    const list = screen.getByRole("list", { name: "ช่วงของบทถอดเสียง" });
    Object.defineProperty(list, "scrollHeight", { configurable: true, value: 600 });
    Object.defineProperty(list, "clientHeight", { configurable: true, value: 200 });
    fireEvent.wheel(list, { deltaY: 80 });
    expect(screen.getByRole("button", { name: "กลับไปติดตามเสียง" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "กลับไปติดตามเสียง" }));
    expect(screen.queryByRole("button", { name: "กลับไปติดตามเสียง" })).not.toBeInTheDocument();
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  it("keeps an in-view row still and scrolls an out-of-view row using reduced motion", () => {
    const scrollTo = vi.fn();
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
    const nativeGetComputedStyle = window.getComputedStyle.bind(window);
    vi.spyOn(window, "getComputedStyle").mockImplementation((element) => {
      const style = nativeGetComputedStyle(element);
      if (element instanceof HTMLOListElement && element.classList.contains("transcript-list")) {
        Object.defineProperty(style, "overflowY", { configurable: true, value: "auto" });
      }
      return style;
    });
    const nativeGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      if (this.classList.contains("transcript-list")) return new DOMRect(0, 100, 300, 200);
      if (this.dataset.segmentId === "1") return new DOMRect(0, 120, 300, 50);
      if (this.dataset.segmentId === "2") return new DOMRect(0, 280, 300, 50);
      return nativeGetBoundingClientRect.call(this);
    });
    const { rerender } = render(<TranscriptPanel {...panelProps({ currentTime: 0 })} />);
    const list = screen.getByRole("list", { name: "ช่วงของบทถอดเสียง" });
    Object.defineProperty(list, "scrollHeight", { configurable: true, value: 600 });
    Object.defineProperty(list, "clientHeight", { configurable: true, value: 200 });
    Object.defineProperty(list, "scrollTop", { configurable: true, writable: true, value: 40 });
    Object.defineProperty(list, "scrollTo", { configurable: true, value: scrollTo });

    rerender(<TranscriptPanel {...panelProps({ currentTime: 2.5 })} />);
    expect(scrollTo).toHaveBeenCalledWith({ top: 82, behavior: "auto" });
  });

  it("pauses follow on touch, keyboard, and scrollbar input but ignores editor and trackpad no-ops", () => {
    const scrollTo = vi.fn();
    const nativeGetComputedStyle = window.getComputedStyle.bind(window);
    vi.spyOn(window, "getComputedStyle").mockImplementation((element) => {
      const style = nativeGetComputedStyle(element);
      if (element instanceof HTMLOListElement && element.classList.contains("transcript-list")) {
        Object.defineProperty(style, "overflowY", { configurable: true, value: "auto" });
      }
      return style;
    });
    render(<TranscriptPanel {...panelProps({ activeEdit: { segmentId: 1, text: "draft" } })} />);
    const list = screen.getByRole("list", { name: "ช่วงของบทถอดเสียง" });
    Object.defineProperty(list, "scrollHeight", { configurable: true, value: 600 });
    Object.defineProperty(list, "clientHeight", { configurable: true, value: 200 });
    Object.defineProperty(list, "offsetWidth", { configurable: true, value: 300 });
    Object.defineProperty(list, "clientWidth", { configurable: true, value: 280 });
    Object.defineProperty(list, "scrollTo", { configurable: true, value: scrollTo });
    vi.spyOn(list, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 100, 300, 200));
    const editor = screen.getByRole("textbox", { name: "แก้ไขข้อความช่วงเวลา 00:00.0" });

    fireEvent.touchMove(editor);
    fireEvent.keyDown(editor, { key: "ArrowDown" });
    fireEvent.pointerDown(editor, { clientX: 295 });
    fireEvent.wheel(list, { deltaY: 0 });
    fireEvent.keyDown(list, { key: "Enter" });
    expect(screen.queryByRole("button", { name: "กลับไปติดตามเสียง" })).not.toBeInTheDocument();

    fireEvent.touchMove(list);
    expect(screen.getByRole("button", { name: "กลับไปติดตามเสียง" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "กลับไปติดตามเสียง" }));
    fireEvent.keyDown(list, { key: "PageDown" });
    expect(screen.getByRole("button", { name: "กลับไปติดตามเสียง" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "กลับไปติดตามเสียง" }));
    fireEvent.pointerDown(list, { clientX: 250 });
    expect(screen.queryByRole("button", { name: "กลับไปติดตามเสียง" })).not.toBeInTheDocument();
    fireEvent.pointerDown(list, { clientX: 295 });
    expect(screen.getByRole("button", { name: "กลับไปติดตามเสียง" })).toBeVisible();
  });

  it("shows the empty transcript state without rows", () => {
    const emptyTranscript: Transcript = { durationSeconds: 0, segments: [], text: "" };
    render(<TranscriptPanel {...panelProps({ transcript: emptyTranscript, currentTime: 1 })} />);
    expect(screen.getByRole("status")).toHaveTextContent("ไม่พบคำพูดในไฟล์นี้");
    expect(screen.queryByRole("list", { name: "ช่วงของบทถอดเสียง" })).not.toBeInTheDocument();
  });
});
