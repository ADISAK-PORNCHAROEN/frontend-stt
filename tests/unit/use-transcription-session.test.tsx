import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_FILE_BYTES } from "@/features/transcription/constants";
import { useTranscriptionSession } from "@/features/transcription/hooks/use-transcription-session";
import { isJobId, type JobId, type Transcript } from "@/features/transcription/types";

const api = vi.hoisted(() => {
  class ApiError extends Error {
    constructor(readonly code: string, message: string) {
      super(message);
    }
  }
  return {
    ApiError,
    getRemoteJob: vi.fn(),
    getServiceHealth: vi.fn(),
    getTranscript: vi.fn(),
    submitFile: vi.fn(),
  };
});

vi.mock("@/features/transcription/api", () => api);

const JOB_ID_VALUE = "0123456789abcdef0123456789abcdef";
const JOB_ID: JobId = (() => {
  if (!isJobId(JOB_ID_VALUE)) throw new Error("Invalid test job ID");
  return JOB_ID_VALUE;
})();
const transcript: Transcript = {
  durationSeconds: 2,
  text: "a",
  segments: [{ id: 1, start: 0, end: 2, text: "a" }],
};

function makeFile(size = 16): File {
  const file = new File(["synthetic fixture"], "sample.wav", { type: "audio/wav" });
  Object.defineProperty(file, "size", { configurable: true, value: size });
  return file;
}

describe("useTranscriptionSession", () => {
  let createObjectUrl: ReturnType<typeof vi.fn>;
  let revokeObjectUrl: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    api.getRemoteJob.mockReset();
    api.getServiceHealth.mockReset();
    api.getTranscript.mockReset();
    api.submitFile.mockReset();
    api.getServiceHealth.mockResolvedValue({ ready: true, defaultModel: "turbo" });
    api.getRemoteJob.mockResolvedValue({ status: "queued", progressPercent: 0 });
    api.getTranscript.mockResolvedValue(transcript);
    api.submitFile.mockResolvedValue(JOB_ID);
    createObjectUrl = vi.fn(() => "blob:synthetic-media");
    revokeObjectUrl = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectUrl });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revokeObjectUrl });
  });

  it("loads service defaults, respects user model choice, and owns its media URL", async () => {
    const { result, unmount } = renderHook(() => useTranscriptionSession());
    await waitFor(() => expect(result.current.serviceState).toBe("ready"));
    expect(result.current.selectedModel).toBe("turbo");
    const file = makeFile();
    act(() => result.current.selectFile(file));
    expect(result.current.session).toMatchObject({ kind: "selected", file, url: "blob:synthetic-media", durationSeconds: null });
    expect(result.current.media?.file).toBe(file);
    expect(createObjectUrl).toHaveBeenCalledWith(file);

    act(() => result.current.chooseModel("large-v3"));
    await act(async () => result.current.checkService());
    expect(result.current.selectedModel).toBe("large-v3");
    act(() => result.current.clearSession());
    expect(result.current.session).toEqual({ kind: "empty" });
    expect(result.current.media).toBeNull();
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:synthetic-media");
    unmount();
  });

  it("keeps the newest health result and recovers cleanly from a service failure", async () => {
    let finishOldHealth: (value: { ready: boolean; defaultModel: "turbo" | null }) => void = () => undefined;
    api.getServiceHealth.mockReturnValueOnce(new Promise((resolve) => { finishOldHealth = resolve; }));
    const { result } = renderHook(() => useTranscriptionSession());
    await waitFor(() => expect(api.getServiceHealth).toHaveBeenCalledOnce());
    api.getServiceHealth.mockResolvedValueOnce({ ready: true, defaultModel: "large-v3" });
    await act(async () => result.current.checkService());
    expect(result.current.serviceState).toBe("ready");
    expect(result.current.selectedModel).toBe("large-v3");
    await act(async () => { finishOldHealth({ ready: false, defaultModel: "turbo" }); });
    expect(result.current.serviceState).toBe("ready");
    expect(result.current.selectedModel).toBe("large-v3");

    api.getServiceHealth.mockRejectedValueOnce(new Error("offline"));
    await act(async () => result.current.checkService());
    expect(result.current.serviceState).toBe("unavailable");
  });

  it("tracks duration only for the owned URL and rejects unsupported duration or file size", async () => {
    const { result } = renderHook(() => useTranscriptionSession());
    await waitFor(() => expect(result.current.serviceState).toBe("ready"));
    act(() => result.current.updateDuration("blob:other", 20));
    act(() => result.current.selectFile(makeFile()));
    act(() => result.current.updateDuration("blob:other", 20));
    expect(result.current.session).toMatchObject({ kind: "selected", durationSeconds: null });
    act(() => result.current.updateDuration("blob:synthetic-media", 7201));
    expect(result.current.selectionError).toContain("ยาวเกิน 2 ชั่วโมง");
    await act(async () => result.current.startTranscription());
    expect(result.current.session.kind).toBe("selected");

    act(() => result.current.updateDuration("blob:synthetic-media", 30));
    act(() => result.current.selectFile(makeFile(MAX_FILE_BYTES + 1)));
    await act(async () => result.current.startTranscription());
    expect(result.current.selectionError).toContain("ขนาดเกิน 1 GiB");
  });

  it("uploads the selected model, reports progress, then follows queued, running, and success", async () => {
    api.submitFile.mockImplementation(async (_file: File, _model: string, progress: (value: number) => void) => {
      progress(63);
      return JOB_ID;
    });
    api.getRemoteJob
      .mockResolvedValueOnce({ status: "queued", progressPercent: 0 })
      .mockResolvedValueOnce({ status: "running", progressPercent: 47 })
      .mockResolvedValueOnce({ status: "running", progressPercent: 47 })
      .mockResolvedValueOnce({ status: "succeeded", progressPercent: 100 });
    const { result } = renderHook(() => useTranscriptionSession());
    await waitFor(() => expect(result.current.serviceState).toBe("ready"));
    act(() => {
      result.current.selectFile(makeFile());
      result.current.chooseModel("large-v3");
    });
    await act(async () => result.current.startTranscription());
    expect(api.submitFile).toHaveBeenCalledWith(expect.any(File), "large-v3", expect.any(Function), expect.any(AbortSignal));
    await waitFor(() => expect(result.current.session.kind).toBe("queued"));
    await waitFor(() => expect(result.current.session).toMatchObject({ kind: "running", progressPercent: 47 }), { timeout: 4_000 });
    await waitFor(() => expect(result.current.session).toMatchObject({ kind: "succeeded", transcript }), { timeout: 4_000 });
    expect(result.current.jobMessage).toBeNull();
  });

  it("turns a failed job into a retryable selection and handles a missing job", async () => {
    api.getRemoteJob
      .mockResolvedValueOnce({ status: "failed", progressPercent: 100, message: "failed job" })
      .mockRejectedValueOnce(new api.ApiError("not_found", "job expired"));
    const { result } = renderHook(() => useTranscriptionSession());
    await waitFor(() => expect(result.current.serviceState).toBe("ready"));
    act(() => result.current.selectFile(makeFile()));
    await act(async () => result.current.startTranscription());
    await waitFor(() => expect(result.current.session).toMatchObject({ kind: "failed", message: "failed job" }));
    act(() => result.current.retryFailedJob());
    expect(result.current.session).toMatchObject({ kind: "selected", file: expect.any(File), url: "blob:synthetic-media" });

    await act(async () => result.current.startTranscription());
    await waitFor(() => expect(result.current.session).toMatchObject({ kind: "failed", message: "job expired" }));
  });

  it("keeps upload errors recoverable and does not replace a newer selection", async () => {
    api.submitFile.mockRejectedValueOnce(new Error("service unavailable"));
    const { result } = renderHook(() => useTranscriptionSession());
    await waitFor(() => expect(result.current.serviceState).toBe("ready"));
    act(() => result.current.selectFile(makeFile()));
    await act(async () => result.current.startTranscription());
    expect(result.current.session.kind).toBe("selected");
    expect(result.current.serviceState).toBe("unavailable");
    expect(result.current.jobMessage).toBe("service unavailable");

    api.getServiceHealth.mockResolvedValueOnce({ ready: true, defaultModel: "turbo" });
    await act(async () => result.current.checkService());
    api.submitFile.mockImplementationOnce((_file: File, _model: string, _progress: (value: number) => void, signal: AbortSignal) =>
      new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true })));
    let upload: Promise<void> = Promise.resolve();
    await act(async () => {
      upload = result.current.startTranscription();
    });
    act(() => result.current.selectFile(makeFile()));
    await act(async () => upload);
    expect(result.current.session).toMatchObject({ kind: "selected", url: "blob:synthetic-media" });
  });

  it("discloses an unavailable service before upload and clears state on reset", async () => {
    api.getServiceHealth.mockResolvedValue({ ready: false, defaultModel: null });
    const { result, unmount } = renderHook(() => useTranscriptionSession());
    await waitFor(() => expect(result.current.serviceState).toBe("unavailable"));
    act(() => result.current.selectFile(makeFile()));
    await act(async () => result.current.startTranscription());
    expect(result.current.jobMessage).toContain("STT service ยังไม่พร้อม");
    expect(api.submitFile).not.toHaveBeenCalled();
    act(() => result.current.clearSession());
    expect(result.current.jobMessage).toBeNull();
    unmount();
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:synthetic-media");
  });
});
