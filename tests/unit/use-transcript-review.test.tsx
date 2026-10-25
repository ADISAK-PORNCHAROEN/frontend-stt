import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { isJobId, type JobId, type Transcript } from "@/features/transcription/types";
import { useTranscriptReview } from "@/features/transcription/hooks/use-transcript-review";

const api = vi.hoisted(() => ({
  getOriginalTranscript: vi.fn(),
  saveTranscript: vi.fn(),
}));

vi.mock("@/features/transcription/api", () => api);

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

describe("useTranscriptReview", () => {
  beforeEach(() => {
    api.getOriginalTranscript.mockReset();
    api.saveTranscript.mockReset();
  });

  it("keeps an empty review inert when no transcript is available", async () => {
    const { result } = renderHook(() => useTranscriptReview(null, null));
    await waitFor(() => expect(result.current.isDirty).toBe(false));
    act(() => result.current.beginEdit(1));
    act(() => result.current.updateActiveText("ignored"));
    act(() => result.current.stageActiveEdit());
    await act(async () => {
      await result.current.viewOriginal();
      await result.current.saveChanges();
    });
    expect(result.current.transcript).toBeNull();
    expect(result.current.originalState).toEqual({ kind: "unloaded" });
    expect(api.getOriginalTranscript).not.toHaveBeenCalled();
    expect(api.saveTranscript).not.toHaveBeenCalled();
  });

  it("stages one known segment, sends the complete ordered text-only save, and promotes success", async () => {
    api.saveTranscript.mockResolvedValue(undefined);
    const { result } = renderHook(() => useTranscriptReview(JOB_ID, transcript));
    act(() => result.current.beginEdit(900));
    act(() => result.current.beginEdit(2));
    act(() => result.current.updateActiveText(" second revised "));
    expect(result.current.isDirty).toBe(true);
    expect(result.current.activeEdit).toEqual({ segmentId: 2, text: " second revised " });
    await act(async () => result.current.saveChanges());
    expect(api.saveTranscript).not.toHaveBeenCalled();
    act(() => result.current.stageActiveEdit());
    expect(result.current.transcript?.segments.map(({ id, text }) => ({ id, text }))).toEqual([
      { id: 1, text: "first" },
      { id: 2, text: " second revised " },
    ]);
    await act(async () => result.current.saveChanges());
    expect(api.saveTranscript).toHaveBeenCalledWith(JOB_ID, [
      { id: 1, text: "first" },
      { id: 2, text: " second revised " },
    ]);
    expect(result.current.isDirty).toBe(false);
    expect(result.current.saveState).toEqual({ kind: "saved" });
    expect(result.current.transcript?.text).toBe("first\nsecond revised");
  });

  it("cancels only the active row and preserves staged changes, including a prior stage for that row", () => {
    const { result } = renderHook(() => useTranscriptReview(JOB_ID, transcript));
    act(() => result.current.beginEdit(1));
    act(() => result.current.updateActiveText("staged first"));
    act(() => result.current.stageActiveEdit());
    act(() => result.current.beginEdit(1));
    act(() => result.current.updateActiveText("temporary first"));
    act(() => result.current.beginEdit(2));
    act(() => result.current.cancelActiveEdit());

    expect(result.current.activeEdit).toBeNull();
    expect(result.current.transcript?.segments.map(({ id, text }) => ({ id, text }))).toEqual([
      { id: 1, text: "staged first" },
      { id: 2, text: "second" },
    ]);
    expect(result.current.isDirty).toBe(true);

    act(() => result.current.beginEdit(2));
    act(() => result.current.updateActiveText("staged second"));
    act(() => result.current.stageActiveEdit());
    expect(result.current.transcript?.segments.map(({ id, text }) => ({ id, text }))).toEqual([
      { id: 1, text: "staged first" },
      { id: 2, text: "staged second" },
    ]);
  });

  it("clears an active draft when it is staged back to the saved text", () => {
    const { result } = renderHook(() => useTranscriptReview(JOB_ID, transcript));
    act(() => result.current.beginEdit(1));
    act(() => result.current.updateActiveText("temporary"));
    expect(result.current.isDirty).toBe(true);
    act(() => result.current.updateActiveText("first"));
    act(() => result.current.stageActiveEdit());
    expect(result.current.isDirty).toBe(false);
    expect(result.current.transcript?.segments[0]?.text).toBe("first");
  });

  it("retains a failed draft and lets the user retry successfully", async () => {
    api.saveTranscript.mockRejectedValueOnce(new Error("service unavailable"));
    api.saveTranscript.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useTranscriptReview(JOB_ID, transcript));
    act(() => result.current.beginEdit(1));
    act(() => result.current.updateActiveText("corrected first"));
    act(() => result.current.stageActiveEdit());
    await act(async () => result.current.saveChanges());
    expect(result.current.saveState).toEqual({ kind: "failed", message: "บันทึกการแก้ไขไม่สำเร็จ กรุณาลองอีกครั้ง" });
    expect(result.current.isDirty).toBe(true);
    expect(result.current.transcript?.segments[0]?.text).toBe("corrected first");
    await act(async () => result.current.saveChanges());
    expect(result.current.saveState).toEqual({ kind: "saved" });
    expect(result.current.isDirty).toBe(false);
    expect(api.saveTranscript).toHaveBeenCalledTimes(2);
  });

  it("prevents a duplicate save while a request is pending", async () => {
    let completeSave: () => void = () => undefined;
    api.saveTranscript.mockReturnValue(new Promise<void>((resolve) => { completeSave = resolve; }));
    const { result } = renderHook(() => useTranscriptReview(JOB_ID, transcript));
    act(() => result.current.beginEdit(1));
    act(() => result.current.updateActiveText("corrected"));
    act(() => result.current.stageActiveEdit());
    let firstSave: Promise<void> = Promise.resolve();
    await act(async () => { firstSave = result.current.saveChanges(); });
    expect(result.current.isSaving).toBe(true);
    await act(async () => result.current.saveChanges());
    expect(api.saveTranscript).toHaveBeenCalledOnce();
    await act(async () => {
      completeSave();
      await firstSave;
    });
    expect(result.current.saveState).toEqual({ kind: "saved" });
  });

  it("loads the immutable original once and switches between original and latest", async () => {
    api.getOriginalTranscript.mockResolvedValue({ ...transcript, text: "original copy" });
    const { result } = renderHook(() => useTranscriptReview(JOB_ID, transcript));
    act(() => result.current.beginEdit(1));
    act(() => result.current.updateActiveText("edited latest"));
    act(() => result.current.stageActiveEdit());
    await act(async () => result.current.viewOriginal());
    expect(result.current.isOriginal).toBe(true);
    expect(result.current.transcript?.text).toBe("original copy");
    expect(result.current.originalState.kind).toBe("loaded");
    act(() => result.current.viewLatest());
    expect(result.current.transcript?.segments[0]?.text).toBe("edited latest");
    await act(async () => result.current.viewOriginal());
    expect(api.getOriginalTranscript).toHaveBeenCalledOnce();
  });

  it("reports original-load failure and supports a later retry", async () => {
    api.getOriginalTranscript.mockRejectedValueOnce(new Error("offline"));
    api.getOriginalTranscript.mockResolvedValueOnce({ ...transcript, text: "original" });
    const { result } = renderHook(() => useTranscriptReview(JOB_ID, transcript));
    await act(async () => result.current.viewOriginal());
    expect(result.current.originalState).toEqual({ kind: "failed", message: "โหลดบทถอดเสียงต้นฉบับไม่สำเร็จ กรุณาลองอีกครั้ง" });
    await act(async () => result.current.viewOriginal());
    expect(result.current.originalState.kind).toBe("loaded");
    expect(result.current.isOriginal).toBe(true);
    expect(api.getOriginalTranscript).toHaveBeenCalledTimes(2);
  });

  it("ignores an original response after the review unmounts", async () => {
    let completeLoad: (value: Transcript) => void = () => undefined;
    api.getOriginalTranscript.mockReturnValue(new Promise<Transcript>((resolve) => { completeLoad = resolve; }));
    const { result, unmount } = renderHook(() => useTranscriptReview(JOB_ID, transcript));
    let load: Promise<void> = Promise.resolve();
    await act(async () => { load = result.current.viewOriginal(); });
    unmount();
    completeLoad({ ...transcript, text: "late response" });
    await load;
    expect(api.getOriginalTranscript).toHaveBeenCalledOnce();
  });
});
