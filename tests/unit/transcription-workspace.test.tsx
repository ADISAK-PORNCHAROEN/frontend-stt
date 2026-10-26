import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TranscriptionWorkspace } from "@/features/transcription/components/transcription-workspace";
import { isJobId, type JobId, type Transcript, type WorkspaceSession } from "@/features/transcription/types";

const mocks = vi.hoisted(() => ({
  useTranscriptionSession: vi.fn(),
  useTranscriptReview: vi.fn(),
}));

vi.mock("@/features/transcription/hooks/use-transcription-session", () => ({ useTranscriptionSession: mocks.useTranscriptionSession }));
vi.mock("@/features/transcription/hooks/use-transcript-review", () => ({ useTranscriptReview: mocks.useTranscriptReview }));

const JOB_ID_VALUE = "0123456789abcdef0123456789abcdef";
const JOB_ID: JobId = (() => {
  if (!isJobId(JOB_ID_VALUE)) throw new Error("Invalid test job ID");
  return JOB_ID_VALUE;
})();
const transcript: Transcript = {
  durationSeconds: 4,
  text: "first\nsecond",
  segments: [
    { id: 1, start: 0, end: 2, text: "first" },
    { id: 2, start: 2, end: 4, text: "second" },
  ],
};
const file = new File(["synthetic fixture"], "sample.wav", { type: "audio/wav" });

function sessionState(overrides: Record<string, unknown> = {}) {
  return {
    session: { kind: "empty" } satisfies WorkspaceSession,
    media: null,
    serviceState: "ready",
    selectedModel: "turbo",
    chooseModel: vi.fn(),
    selectionError: null,
    setSelectionError: vi.fn(),
    jobMessage: null,
    checkService: vi.fn(),
    selectFile: vi.fn(),
    clearSession: vi.fn(),
    retryFailedJob: vi.fn(),
    updateDuration: vi.fn(),
    startTranscription: vi.fn(),
    ...overrides,
  };
}

function selectedSession(durationSeconds: number | null = 28): WorkspaceSession {
  return { kind: "selected", file, url: "blob:synthetic", durationSeconds };
}

function succeededSession(): WorkspaceSession {
  return { kind: "succeeded", file, url: "blob:synthetic", durationSeconds: 28, jobId: JOB_ID, transcript };
}

function reviewState(overrides: Record<string, unknown> = {}) {
  return {
    transcript,
    isOriginal: false,
    isDirty: false,
    isSaving: false,
    saveState: { kind: "idle" },
    originalState: { kind: "unloaded" },
    activeEdit: null,
    stagedCount: 0,
    beginEdit: vi.fn(),
    updateActiveText: vi.fn(),
    stageActiveEdit: vi.fn(),
    cancelActiveEdit: vi.fn(),
    discardChanges: vi.fn(),
    viewOriginal: vi.fn(),
    viewLatest: vi.fn(),
    saveChanges: vi.fn(),
    ...overrides,
  };
}

describe("TranscriptionWorkspace", () => {
  beforeEach(() => {
    mocks.useTranscriptionSession.mockReset();
    mocks.useTranscriptReview.mockReset();
    mocks.useTranscriptReview.mockReturnValue(reviewState());
    Object.defineProperty(Element.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
    Object.defineProperty(HTMLMediaElement.prototype, "play", { configurable: true, value: vi.fn().mockResolvedValue(undefined) });
    Object.defineProperty(HTMLMediaElement.prototype, "pause", { configurable: true, value: vi.fn() });
  });

  it("renders the home state, shows checking status, and retries an unavailable service", () => {
    const state = sessionState({ serviceState: "checking" });
    mocks.useTranscriptionSession.mockReturnValue(state);
    const { rerender } = render(<TranscriptionWorkspace />);
    expect(screen.getByRole("heading", { name: /ฟังทุกช่วงเวลา.*อ่านทุกถ้อยคำ/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "เริ่มจากไฟล์ แล้วฟังกลับตามเวลา" })).toBeInTheDocument();
    expect(screen.getByText("กำลังตรวจการเชื่อมต่อ STT service")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("เลือกไฟล์"), { target: { files: [new File(["home"], "home.mp3", { type: "audio/mpeg" })] } });
    expect(state.selectFile).toHaveBeenCalledWith(expect.objectContaining({ name: "home.mp3" }));

    const unavailable = sessionState({ serviceState: "unavailable" });
    mocks.useTranscriptionSession.mockReturnValue(unavailable);
    rerender(<TranscriptionWorkspace />);
    expect(document.querySelector(".service-notice")).toHaveTextContent("STT service ยังไม่พร้อม");
    fireEvent.click(screen.getByRole("button", { name: "ตรวจอีกครั้ง" }));
    expect(unavailable.checkService).toHaveBeenCalledOnce();
  });

  it("accepts a selected file, changes the model, submits, and handles start-disabled reasons", () => {
    const selected = sessionState({ session: selectedSession(), media: selectedSession() });
    mocks.useTranscriptionSession.mockReturnValue(selected);
    const view = render(<TranscriptionWorkspace />);
    const toolbar = document.querySelector(".selected-toolbar");
    expect(toolbar).toContainElement(screen.getByLabelText("เปลี่ยนไฟล์"));
    expect(toolbar).toContainElement(screen.getByRole("combobox", { name: "โมเดลถอดเสียง" }));
    expect(toolbar).toContainElement(screen.getByRole("button", { name: "เริ่มถอดเสียง" }));
    expect(toolbar?.querySelector("#file-help, .drop-footnote, .drop-size")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ล้างไฟล์" })).toBeInTheDocument();
    const model = screen.getByRole("combobox", { name: "โมเดลถอดเสียง" });
    fireEvent.change(model, { target: { value: "large-v3" } });
    expect(selected.chooseModel).toHaveBeenCalledWith("large-v3");
    fireEvent.change(model, { target: { value: "unsupported" } });
    expect(selected.chooseModel).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "เริ่มถอดเสียง" }));
    expect(selected.startTranscription).toHaveBeenCalledOnce();
    fireEvent.change(screen.getByLabelText("เปลี่ยนไฟล์"), { target: { files: [new File(["another"], "again.mp3", { type: "audio/mpeg" })] } });
    expect(selected.selectFile).toHaveBeenCalledWith(expect.objectContaining({ name: "again.mp3" }));
    fireEvent.click(screen.getByRole("button", { name: "ล้างไฟล์" }));
    expect(selected.clearSession).toHaveBeenCalledOnce();

    const unavailable = sessionState({ session: selectedSession(), media: selectedSession(), serviceState: "unavailable", selectedModel: null });
    mocks.useTranscriptionSession.mockReturnValue(unavailable);
    view.rerender(<TranscriptionWorkspace />);
    expect(screen.getByRole("button", { name: "เริ่มถอดเสียง" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "ตรวจอีกครั้ง" }));
    expect(unavailable.checkService).toHaveBeenCalledOnce();

    const tooLong = selectedSession(7201);
    const tooLongState = sessionState({ session: tooLong, media: tooLong });
    mocks.useTranscriptionSession.mockReturnValue(tooLongState);
    view.rerender(<TranscriptionWorkspace />);
    expect(screen.getByRole("button", { name: "เริ่มถอดเสียง" })).toBeDisabled();
    const activeMedia = screen.getByLabelText("เล่นไฟล์เสียง sample.wav");
    if (!(activeMedia instanceof HTMLAudioElement)) throw new Error("Expected audio player");
    Object.defineProperty(activeMedia, "duration", { configurable: true, value: 30 });
    fireEvent.loadedMetadata(activeMedia);
    expect(tooLongState.updateDuration).toHaveBeenCalledWith("blob:synthetic", 30);
    view.unmount();
  });

  it("renders upload, queue, and running progress and uses a supplied job message", () => {
    const states: WorkspaceSession[] = [
      { kind: "submitting", file, url: "blob:synthetic", durationSeconds: null, uploadPercent: 35 },
      { kind: "queued", file, url: "blob:synthetic", durationSeconds: null, jobId: JOB_ID, progressPercent: 0 },
      { kind: "running", file, url: "blob:synthetic", durationSeconds: null, jobId: JOB_ID, progressPercent: 47 },
    ];
    for (const [index, session] of states.entries()) {
      const state = sessionState({ session, media: session, jobMessage: index === 2 ? "กำลังรอการตอบกลับ" : null });
      mocks.useTranscriptionSession.mockReturnValue(state);
      const view = render(<TranscriptionWorkspace />);
      const workspaceBody = document.querySelector(".workspace-body");
      const progressPanel = document.querySelector(".progress-panel");
      expect(progressPanel).not.toBeNull();
      const workspaceGrid = workspaceBody?.querySelector(".workspace-grid");
      expect(progressPanel?.parentElement).toBe(workspaceGrid);
      expect(workspaceGrid).not.toBeNull();
      if (!workspaceGrid || !progressPanel) throw new Error("Workspace progress layout not rendered");
      const mediaPanel = workspaceGrid.querySelector(".media-panel");
      if (!mediaPanel) throw new Error("Workspace media panel not rendered");
      expect(mediaPanel.compareDocumentPosition(progressPanel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", String(index === 0 ? 35 : index === 1 ? 0 : 47));
      expect(progressPanel?.querySelectorAll("ol li")).toHaveLength(3);
      if (index === 0) expect(document.querySelector(".progress-panel")).toHaveTextContent("กำลังส่งไฟล์");
      if (index === 1) expect(document.querySelector("#progress-title")).toHaveTextContent("อยู่ในคิวถอดเสียง");
      if (index === 2) expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "47");
      if (index === 2) expect(document.querySelector(".progress-panel")).toHaveTextContent("กำลังรอการตอบกลับ");
      view.unmount();
    }
  });

  it("shows retry for failed jobs and service guidance for transient job messages", () => {
    const failed: WorkspaceSession = { kind: "failed", file, url: "blob:synthetic", durationSeconds: 28, jobId: JOB_ID, message: "failed text" };
    const state = sessionState({ session: failed, media: failed });
    mocks.useTranscriptionSession.mockReturnValue(state);
    const view = render(<TranscriptionWorkspace />);
    expect(screen.getByRole("alert")).toHaveTextContent("failed text");
    fireEvent.click(screen.getByRole("button", { name: "ลองส่งไฟล์นี้อีกครั้ง" }));
    expect(state.retryFailedJob).toHaveBeenCalledOnce();
    view.unmount();

    mocks.useTranscriptionSession.mockReturnValue(sessionState({ session: selectedSession(), media: selectedSession(), jobMessage: "cannot poll" }));
    render(<TranscriptionWorkspace />);
    expect(screen.getByRole("alert")).toHaveTextContent("cannot poll เลือกไฟล์ใหม่เพื่อส่งงานอีกครั้ง");
  });

  it("plays bounded transcript ranges and stops playback when a range ends", () => {
    const state = sessionState({ session: succeededSession(), media: succeededSession() });
    mocks.useTranscriptionSession.mockReturnValue(state);
    render(<TranscriptionWorkspace />);
    const audioElement = screen.getByLabelText("เล่นไฟล์เสียง sample.wav");
    if (!(audioElement instanceof HTMLAudioElement)) throw new Error("Expected audio player");
    const audio = audioElement;
    Object.defineProperty(audio, "duration", { configurable: true, value: 4 });
    Object.defineProperty(audio, "currentTime", { configurable: true, writable: true, value: 0 });
    fireEvent.click(screen.getByRole("button", { name: /เล่นช่วงเวลา 00:02.0/ }));
    expect(audio.currentTime).toBe(1.5);
    expect(audio.play).toHaveBeenCalledOnce();

    audio.currentTime = 0.5;
    fireEvent.seeking(audio);
    fireEvent.timeUpdate(audio);
    expect(screen.getAllByText("00:00.5")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: /เล่นช่วงเวลา 00:02.0/ }));
    audio.currentTime = 4.5;
    fireEvent.timeUpdate(audio);
    expect(audio.currentTime).toBe(4);
    expect(audio.pause).toHaveBeenCalledOnce();
    audio.currentTime = 0.5;
    fireEvent.seeking(audio);
    expect(state.updateDuration).not.toHaveBeenCalled();
  });

  it("renders saved exports and disables them for dirty/saving results while protecting unload", () => {
    const session = succeededSession();
    const cleanReview = reviewState();
    const sessionHooks = sessionState({ session, media: session });
    mocks.useTranscriptionSession.mockReturnValue(sessionHooks);
    mocks.useTranscriptReview.mockReturnValue(cleanReview);
    const view = render(<TranscriptionWorkspace />);
    const workspaceGrid = document.querySelector(".workspace-grid");
    expect(Array.from(workspaceGrid?.children ?? []).map((element) => element.className.split(" ")[0])).toEqual(["workspace-main", "workspace-side"]);
    expect(screen.getByRole("link", { name: "ดาวน์โหลด TXT" })).toHaveAttribute("href", `/api/stt/jobs/${JOB_ID}/result?format=txt`);
    const transcriptPanel = screen.getByRole("region", { name: "บทถอดเสียง" });
    expect(within(transcriptPanel).getByText(/ถอดเสียงเสร็จแล้ว/)).toBeInTheDocument();
    expect(mocks.useTranscriptReview).toHaveBeenCalledWith(JOB_ID, transcript);
    const succeededAudio = screen.getByLabelText("เล่นไฟล์เสียง sample.wav");
    Object.defineProperty(succeededAudio, "duration", { configurable: true, value: 28 });
    fireEvent.loadedMetadata(succeededAudio);
    expect(sessionHooks.updateDuration).toHaveBeenCalledWith("blob:synthetic", 28);
    fireEvent.click(screen.getByRole("button", { name: "ดูต้นฉบับ" }));
    expect(cleanReview.viewOriginal).toHaveBeenCalledOnce();
    const originalReview = reviewState({ isOriginal: true });
    mocks.useTranscriptReview.mockReturnValue(originalReview);
    view.rerender(<TranscriptionWorkspace />);
    fireEvent.click(screen.getByRole("button", { name: "กลับไปฉบับแก้ไข" }));
    expect(originalReview.viewLatest).toHaveBeenCalledOnce();
    const stagedReview = reviewState({ isDirty: true });
    mocks.useTranscriptReview.mockReturnValue(stagedReview);
    view.rerender(<TranscriptionWorkspace />);
    fireEvent.click(screen.getByRole("button", { name: "บันทึกทั้งหมด" }));
    expect(stagedReview.saveChanges).toHaveBeenCalledOnce();
    view.unmount();

    const dirtyReview = reviewState({ isDirty: true, transcript: null });
    mocks.useTranscriptReview.mockReturnValue(dirtyReview);
    const dirtyView = render(<TranscriptionWorkspace />);
    expect(screen.getByRole("button", { name: "ดาวน์โหลด SRT" })).toBeDisabled();
    expect(screen.getAllByRole("status").some((status) => status.textContent?.includes("มีการแก้ไขที่ยังไม่ได้บันทึก"))).toBe(true);
    const unload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(unload);
    expect(unload.defaultPrevented).toBe(true);
    mocks.useTranscriptReview.mockReturnValue(reviewState());
    dirtyView.rerender(<TranscriptionWorkspace />);
    const afterCleanup = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(afterCleanup);
    expect(afterCleanup.defaultPrevented).toBe(false);
    dirtyView.unmount();

    mocks.useTranscriptReview.mockReturnValue(reviewState({ isSaving: true }));
    render(<TranscriptionWorkspace />);
    expect(screen.getByRole("button", { name: "ดาวน์โหลด JSON" })).toBeDisabled();
  });
});
