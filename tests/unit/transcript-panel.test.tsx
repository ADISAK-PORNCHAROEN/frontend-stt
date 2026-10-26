import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TranscriptPanel } from "@/features/transcription/components/transcript-panel";
import { initialReviewState, reviewView, type ReviewView } from "@/features/transcription/review-state";
import type { Transcript } from "@/features/transcription/types";

const transcript: Transcript = {
  durationSeconds: 4,
  text: "first\nsecond",
  segments: [
    { id: 1, start: 0, end: 2, text: "first phrase" },
    { id: 2, start: 2, end: 4, text: "second phrase" },
  ],
};

function panelView(overrides: Partial<ReviewView> = {}): ReviewView {
  return { ...reviewView(initialReviewState(transcript)), ...overrides };
}

function panelProps(overrides: Partial<Parameters<typeof TranscriptPanel>[0]> = {}): Parameters<typeof TranscriptPanel>[0] {
  return {
    view: panelView(),
    currentTime: 0,
    onReplay: vi.fn(),
    onBeginEdit: vi.fn(),
    onEdit: vi.fn(),
    onStageEdit: vi.fn(),
    onCancelEdit: vi.fn(),
    onDiscardChanges: vi.fn(),
    onSaveDraft: vi.fn(),
    onSelectRevision: vi.fn(),
    onResolveSwitch: vi.fn(),
    onRetryOriginal: vi.fn(),
    onCommit: vi.fn(),
    ...overrides,
  };
}

describe("TranscriptPanel", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value() { this.setAttribute("open", ""); } });
    Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value() { this.removeAttribute("open"); } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("makes each read-only row a keyboard-operable playback control and highlights the active segment", () => {
    const props = panelProps({ currentTime: 2.5 });
    const { container } = render(<TranscriptPanel {...props} />);
    expect(screen.getByRole("heading", { name: "ฉบับล่าสุดที่ตรวจแล้ว" })).toBeInTheDocument();
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

    const editedProps = panelProps({ view: panelView({ activeEdit: { segmentId: 1, text: "draft" }, isDirty: true }) });
    rerender(<TranscriptPanel {...editedProps} />);
    const editor = screen.getByRole("textbox", { name: "แก้ไขข้อความช่วงเวลา 00:00.0" });
    expect(editor).toHaveValue("draft");
    expect(screen.getByRole("list", { name: "ช่วงของบทถอดเสียง" })).not.toContainElement(editor);
    expect(screen.getByRole("button", { name: "ทิ้งข้อความที่แก้" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "แก้ไขข้อความช่วงเวลา 00:02.0" })).toBeDisabled();
    const replayButton = screen.getByRole("button", { name: /เล่นช่วงเวลา 00:00.0/ });
    expect(replayButton).toHaveAttribute("aria-current", "true");
    fireEvent.click(replayButton);
    expect(editedProps.onReplay).toHaveBeenCalledWith(transcript.segments[0]);
    fireEvent.change(editor, { target: { value: "revised" } });
    expect(editedProps.onEdit).toHaveBeenCalledWith("revised");
    fireEvent.click(screen.getByRole("button", { name: "เก็บช่วงนี้" }));
    expect(editedProps.onStageEdit).toHaveBeenCalledOnce();
    rerender(<TranscriptPanel {...panelProps({ view: panelView({ isDirty: true }) })} />);
    expect(screen.getByRole("button", { name: "แก้ไขข้อความช่วงเวลา 00:00.0" })).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "แก้ไขข้อความช่วงเวลา 00:00.0" }));
    const canceledProps = panelProps({ view: panelView({ activeEdit: { segmentId: 1, text: "draft again" }, isDirty: true }) });
    rerender(<TranscriptPanel {...canceledProps} />);
    fireEvent.click(screen.getByRole("button", { name: "ยกเลิกช่วงนี้" }));
    expect(canceledProps.onCancelEdit).toHaveBeenCalledOnce();
  });

  it("offers batch save and discard for staged edits", () => {
    const props = panelProps({ view: panelView({ isDirty: true, stagedCount: 2 }) });
    render(<TranscriptPanel {...props} />);
    expect(screen.getByText(/2 ช่วงที่แก้ไข/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "ทิ้งข้อความที่แก้" }));
    expect(props.onDiscardChanges).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "บันทึกเป็นฉบับร่าง" }));
    expect(props.onSaveDraft).toHaveBeenCalledOnce();
  });

  it("offers save, discard, and stay when changing revisions with unsaved text", () => {
    const props = panelProps({ view: panelView({
      isDirty: true,
      activeEdit: { segmentId: 1, text: "pending text" },
      pendingSwitch: { id: "original", label: "ต้นฉบับ ASR" },
      selectedId: "original",
      currentId: "latest-0",
    }) });
    render(<TranscriptPanel {...props} />);
    const dialog = screen.getByRole("dialog", { name: "มีข้อความที่ยังไม่ได้บันทึก" });
    expect(dialog).toContainElement(screen.getByRole("button", { name: "อยู่ต่อ" }));
    expect(dialog).toContainElement(screen.getByRole("button", { name: "ทิ้งข้อความ" }));
    expect(dialog).toContainElement(screen.getByRole("button", { name: "บันทึกร่างแล้วเปลี่ยนฉบับ" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "อยู่ต่อ" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "ทิ้งข้อความ" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "บันทึกร่างแล้วเปลี่ยนฉบับ" }));
    expect(props.onResolveSwitch).toHaveBeenNthCalledWith(1, "stay");
    expect(props.onResolveSwitch).toHaveBeenNthCalledWith(2, "discard");
    expect(props.onResolveSwitch).toHaveBeenNthCalledWith(3, "save");
  });

  it("shows draft and commit failure states and supports retrying original loading", () => {
    const props = panelProps({
      view: panelView({
        isDirty: true,
        commitState: { kind: "failed", targetId: "draft-1", message: "save failed" },
        originalState: { kind: "failed", message: "original failed" },
      }),
    });
    const { unmount } = render(<TranscriptPanel {...props} />);
    expect(screen.getByText(/มีข้อความที่ยังไม่ได้บันทึกเป็นฉบับร่าง/)).toHaveClass("unsaved-note");
    expect(screen.getAllByRole("alert").map((alert) => alert.textContent)).toEqual([
      "save failed ฉบับที่เลือกยังอยู่ครบ",
      "original failedลองโหลดอีกครั้ง",
    ]);
    expect(screen.getByText("original failed")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "ลองโหลดอีกครั้ง" }));
    expect(props.onRetryOriginal).toHaveBeenCalledOnce();
    expect(props.onCommit).not.toHaveBeenCalled();

    unmount();
    const savedView = render(<TranscriptPanel {...panelProps({ view: panelView({ commitState: { kind: "saved", targetId: "latest-1" } }) })} />);
    expect(screen.getByText(/ตั้งฉบับที่เลือกเป็นฉบับล่าสุดแล้ว/)).toHaveClass("review-saved-note");
    savedView.unmount();
  });

  it("keeps the original snapshot selectable while allowing edits that create drafts", () => {
    const props = panelProps({ view: panelView({
      currentId: "original",
      selectedId: "original",
      selectedKind: "original",
      selectedLabel: "ต้นฉบับ ASR",
      isOriginal: true,
      isLatest: false,
      originalState: { kind: "loaded", id: "original" },
    }) });
    const { rerender } = render(<TranscriptPanel {...props} />);
    expect(screen.getByRole("heading", { name: "บทถอดเสียงต้นฉบับ" })).toBeInTheDocument();
    expect(screen.getByText("first phrase")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "แก้ไขข้อความช่วงเวลา 00:00.0" }));
    expect(props.onBeginEdit).toHaveBeenCalledWith(1);
    fireEvent.click(screen.getByRole("button", { name: /เล่นช่วงเวลา 00:00.0/ }));
    expect(props.onReplay).toHaveBeenCalledWith(transcript.segments[0]);
    fireEvent.change(screen.getByRole("combobox", { name: "เลือกฉบับบทถอดเสียง" }), { target: { value: "latest-0" } });
    expect(props.onSelectRevision).toHaveBeenCalledWith("latest-0");

    const loadingProps = panelProps({ view: panelView({
      currentId: "original",
      selectedId: "original",
      selectedKind: "original",
      selectedLabel: "ต้นฉบับ ASR",
      transcript: null,
      isOriginal: true,
      isLatest: false,
      originalState: { kind: "loading", requestId: 1 },
    }) });
    rerender(<TranscriptPanel {...loadingProps} />);
    expect(screen.getByRole("status")).toHaveTextContent("กำลังโหลดบทถอดเสียงต้นฉบับ");
    expect(screen.queryByText("first phrase")).not.toBeInTheDocument();
  });

  it("previews each selected format from the immutable snapshot and returns focus on close", () => {
    const props = panelProps();
    render(<TranscriptPanel {...props} />);
    const openPreview = screen.getByRole("button", { name: "ตัวอย่างและส่งออก" });
    openPreview.focus();
    fireEvent.click(openPreview);
    const dialog = screen.getByRole("dialog", { name: /ตัวอย่าง JSON/ });
    expect(screen.getByRole("combobox", { name: "รูปแบบตัวอย่าง" })).toHaveFocus();
    const preview = screen.getByTestId("transcript-export-preview");
    expect(preview.textContent).toContain('"duration_seconds": 4');
    expect(preview.textContent).toContain('"text": "first\\nsecond"');

    const format = screen.getByRole("combobox", { name: "รูปแบบตัวอย่าง" });
    fireEvent.change(format, { target: { value: "txt" } });
    expect(screen.getByRole("dialog", { name: /ตัวอย่าง TXT/ })).toBeInTheDocument();
    expect(preview.textContent).toBe("first phrase\nsecond phrase");
    fireEvent.change(format, { target: { value: "srt" } });
    expect(screen.getByRole("dialog", { name: /ตัวอย่าง SRT/ })).toBeInTheDocument();
    expect(preview.textContent).toContain("00:00:00,000 --> 00:00:02,000");
    expect(preview.textContent).toContain("00:00:02,000 --> 00:00:04,000");

    fireEvent(dialog, new Event("cancel", { cancelable: true }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(openPreview).toHaveFocus();
  });

  it("previews the immutable selected revision while keeping unsaved text out of download", () => {
    const props = panelProps({ view: panelView({
      isDirty: true,
      activeEdit: { segmentId: 1, text: "not yet a revision" },
      transcript: { ...transcript, text: "not yet a revision\\nsecond phrase", segments: [{ ...transcript.segments[0]!, text: "not yet a revision" }, transcript.segments[1]!] },
    }) });
    render(<TranscriptPanel {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "ตัวอย่างและส่งออก" }));
    const preview = screen.getByTestId("transcript-export-preview");
    expect(preview.textContent).toContain('"text": "first\\nsecond"');
    expect(preview.textContent).not.toContain("not yet a revision");
    expect(screen.getByRole("button", { name: "ดาวน์โหลด JSON" })).toBeDisabled();
    expect(screen.getAllByRole("status").some((status) => status.textContent?.includes("ข้อความที่ยังไม่บันทึกจะไม่รวม"))).toBe(true);
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
    render(<TranscriptPanel {...panelProps({ view: panelView({ activeEdit: { segmentId: 1, text: "draft" } }) })} />);
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
    render(<TranscriptPanel {...panelProps({ view: panelView({ transcript: emptyTranscript }), currentTime: 1 })} />);
    expect(screen.getByText("ไม่พบคำพูดในไฟล์นี้")).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "ช่วงของบทถอดเสียง" })).not.toBeInTheDocument();
  });
});
