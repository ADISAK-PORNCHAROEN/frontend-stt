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
const latestTranscript: Transcript = {
  durationSeconds: 4,
  text: "latest first\nlatest second",
  segments: [
    { id: 1, start: 0, end: 2, text: "latest first" },
    { id: 2, start: 2, end: 4, text: "latest second" },
  ],
};
const originalTranscript: Transcript = {
  durationSeconds: 4,
  text: "original first\noriginal second",
  segments: [
    { id: 1, start: 0, end: 2, text: "original first" },
    { id: 2, start: 2, end: 4, text: "original second" },
  ],
};

describe("useTranscriptReview", () => {
  beforeEach(() => {
    api.getOriginalTranscript.mockReset();
    api.saveTranscript.mockReset();
    api.saveTranscript.mockResolvedValue(undefined);
    api.getOriginalTranscript.mockResolvedValue(originalTranscript);
  });

  it("keeps original and every saved draft as separate immutable snapshots", async () => {
    const { result } = renderHook(() => useTranscriptReview(JOB_ID, latestTranscript));
    act(() => result.current.selectRevision("original"));
    await waitFor(() => expect(result.current.view.originalState.kind).toBe("loaded"));
    expect(result.current.view.transcript?.segments[0]?.text).toBe("original first");

    act(() => result.current.beginEdit(1));
    act(() => result.current.updateActiveText("edited original"));
    act(() => result.current.saveDraft());
    const firstDraftId = result.current.view.revisions.find(({ kind }) => kind === "draft")?.id;
    expect(firstDraftId).toBeDefined();
    expect(result.current.view.transcript?.segments[0]?.text).toBe("edited original");

    act(() => result.current.selectRevision("original"));
    expect(result.current.view.transcript?.segments[0]?.text).toBe("original first");
    act(() => result.current.selectRevision(result.current.view.latestId ?? ""));
    expect(result.current.view.transcript?.segments[0]?.text).toBe("latest first");

    act(() => result.current.selectRevision(firstDraftId ?? ""));
    act(() => result.current.beginEdit(2));
    act(() => result.current.updateActiveText("second edit"));
    act(() => result.current.saveDraft());
    const draftIds = result.current.view.revisions.filter(({ kind }) => kind === "draft").map(({ id }) => id);
    expect(draftIds).toHaveLength(2);
    expect(draftIds[0]).not.toBe(draftIds[1]);

    act(() => result.current.selectRevision(firstDraftId ?? ""));
    expect(result.current.view.transcript?.segments.map(({ text }) => text)).toEqual(["edited original", "original second"]);
  });

  it("offers save, discard, or stay before changing away from unsaved text", async () => {
    const { result } = renderHook(() => useTranscriptReview(JOB_ID, latestTranscript));
    act(() => result.current.beginEdit(1));
    act(() => result.current.updateActiveText("unsaved latest"));
    act(() => result.current.selectRevision("original"));
    expect(result.current.view.pendingSwitch?.id).toBe("original");
    expect(result.current.view.currentId).toBe(result.current.view.latestId);

    act(() => result.current.resolveSwitch("stay"));
    expect(result.current.view.pendingSwitch).toBeNull();
    expect(result.current.view.activeEdit?.text).toBe("unsaved latest");

    act(() => result.current.selectRevision("original"));
    act(() => result.current.resolveSwitch("save"));
    await waitFor(() => expect(result.current.view.originalState.kind).toBe("loaded"));
    expect(result.current.view.currentId).toBe("original");
    const savedDraftId = result.current.view.revisions.find(({ kind }) => kind === "draft")?.id;
    expect(savedDraftId).toBeDefined();
    act(() => result.current.selectRevision(savedDraftId ?? ""));
    expect(result.current.view.transcript?.segments[0]?.text).toBe("unsaved latest");

    act(() => result.current.beginEdit(2));
    act(() => result.current.updateActiveText("discard this"));
    act(() => result.current.selectRevision(result.current.view.latestId ?? ""));
    expect(result.current.view.pendingSwitch?.id).toBe(result.current.view.latestId);
    act(() => result.current.resolveSwitch("discard"));
    expect(result.current.view.currentId).toBe(result.current.view.latestId);
    expect(result.current.view.isDirty).toBe(false);
    act(() => result.current.selectRevision(savedDraftId ?? ""));
    expect(result.current.view.transcript?.segments[1]?.text).toBe("latest second");
  });

  it("retains a selected draft after failed commit and promotes a copy only after success", async () => {
    api.saveTranscript.mockRejectedValueOnce(new Error("fixture save failure")).mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useTranscriptReview(JOB_ID, latestTranscript));
    act(() => result.current.beginEdit(1));
    act(() => result.current.updateActiveText("committable draft"));
    act(() => result.current.saveDraft());
    const draftId = result.current.view.currentId;
    const originalLatestId = result.current.view.latestId;

    await act(async () => result.current.commitSelected());
    expect(result.current.view.commitState.kind).toBe("failed");
    expect(result.current.view.currentId).toBe(draftId);
    expect(result.current.view.transcript?.segments[0]?.text).toBe("committable draft");
    expect(result.current.view.revisions.some(({ id }) => id === draftId)).toBe(true);
    expect(result.current.view.latestId).toBe(originalLatestId);
    act(() => result.current.beginEdit(2));
    act(() => result.current.updateActiveText("temporary text"));
    act(() => result.current.cancelActiveEdit());
    expect(result.current.view.commitState.kind).toBe("failed");
    expect(result.current.view.transcript?.segments[1]?.text).toBe("latest second");

    await act(async () => result.current.commitSelected());
    expect(result.current.view.commitState.kind).toBe("saved");
    expect(result.current.view.latestId).not.toBe(originalLatestId);
    expect(result.current.view.currentId).toBe(result.current.view.latestId);
    expect(result.current.view.transcript?.segments[0]?.text).toBe("committable draft");
    expect(api.saveTranscript).toHaveBeenNthCalledWith(1, JOB_ID, [
      { id: 1, text: "committable draft" },
      { id: 2, text: "latest second" },
    ]);
    expect(api.saveTranscript).toHaveBeenNthCalledWith(2, JOB_ID, [
      { id: 1, text: "committable draft" },
      { id: 2, text: "latest second" },
    ]);

    act(() => result.current.selectRevision("original"));
    await waitFor(() => expect(result.current.view.transcript?.segments[0]?.text).toBe("original first"));
  });

  it("does not show the latest transcript when the original is selected but still loading or failed", async () => {
    api.getOriginalTranscript.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(originalTranscript);
    const { result } = renderHook(() => useTranscriptReview(JOB_ID, latestTranscript));
    act(() => result.current.selectRevision("original"));
    expect(result.current.view.transcript).toBeNull();
    await waitFor(() => expect(result.current.view.originalState.kind).toBe("failed"));
    expect(result.current.view.transcript).toBeNull();

    act(() => result.current.selectRevision("original"));
    await waitFor(() => expect(result.current.view.originalState.kind).toBe("loaded"));
    expect(result.current.view.transcript?.segments[0]?.text).toBe("original first");
    expect(api.getOriginalTranscript).toHaveBeenCalledTimes(2);
  });

  it("keeps the review view empty until a completed transcript and job are available", async () => {
    const { result } = renderHook(() => useTranscriptReview(null, null));
    expect(result.current.view.transcript).toBeNull();
    expect(result.current.view.revisions).toEqual([]);
    act(() => result.current.beginEdit(1));
    act(() => result.current.updateActiveText("ignored"));
    act(() => result.current.stageActiveEdit());
    act(() => result.current.cancelActiveEdit());
    act(() => result.current.discardChanges());
    act(() => result.current.saveDraft());
    act(() => result.current.retryOriginal());
    act(() => result.current.resolveSwitch("stay"));
    await act(async () => result.current.commitSelected());
    expect(api.saveTranscript).not.toHaveBeenCalled();
    expect(api.getOriginalTranscript).not.toHaveBeenCalled();
  });

  it("blocks duplicate commits while the same request is pending", async () => {
    let completeCommit: () => void = () => undefined;
    api.saveTranscript.mockReturnValue(new Promise<void>((resolve) => { completeCommit = resolve; }));
    const { result } = renderHook(() => useTranscriptReview(JOB_ID, latestTranscript));
    act(() => result.current.beginEdit(1));
    act(() => result.current.updateActiveText("pending commit"));
    act(() => result.current.saveDraft());
    let commit: Promise<void> = Promise.resolve();
    act(() => {
      commit = result.current.commitSelected();
      void result.current.commitSelected();
    });
    expect(result.current.view.isSaving).toBe(true);
    expect(api.saveTranscript).toHaveBeenCalledOnce();

    await act(async () => {
      completeCommit();
      await commit;
    });
    expect(result.current.view.commitState.kind).toBe("saved");
  });
});
