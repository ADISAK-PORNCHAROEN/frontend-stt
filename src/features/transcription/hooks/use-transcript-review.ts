"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { getOriginalTranscript, saveTranscript } from "../api";
import type { JobId, Transcript, TranscriptSegment } from "../types";
import { ORIGINAL_REVISION_ID, initialReviewState, isReviewDirty, reviewReducer, reviewView } from "../review-state";
import type { SwitchDecision } from "../review-state";

const ORIGINAL_LOAD_ERROR = "โหลดบทถอดเสียงต้นฉบับไม่สำเร็จ กรุณาลองอีกครั้ง";
const COMMIT_ERROR = "ตั้งฉบับล่าสุดไม่สำเร็จ กรุณาลองอีกครั้ง";

export function useTranscriptReview(jobId: JobId | null, initialTranscript: Transcript | null) {
  const [state, dispatch] = useReducer(
    reviewReducer,
    initialTranscript,
    (transcript) => transcript ? initialReviewState(transcript) : null,
  );
  const requestIdentity = useRef(0);
  const commitRequestIdentity = useRef(0);
  const commitGate = useRef<number | null>(null);
  const selectedId = state?.selectedId ?? null;
  const originalStateKind = state?.originalState.kind ?? "unloaded";

  useEffect(() => () => {
    requestIdentity.current += 1;
    commitGate.current = null;
  }, []);

  useEffect(() => {
    if (!jobId || selectedId !== ORIGINAL_REVISION_ID || originalStateKind !== "unloaded") return;
    const requestId = ++requestIdentity.current;
    dispatch({ type: "original-load-start", requestId });
    void getOriginalTranscript(jobId).then((transcript) => {
      if (requestIdentity.current === requestId) dispatch({ type: "original-load-success", requestId, transcript });
    }).catch(() => {
      if (requestIdentity.current === requestId) dispatch({ type: "original-load-failure", requestId, message: ORIGINAL_LOAD_ERROR });
    });
  }, [jobId, originalStateKind, selectedId]);

  const view = useMemo(() => reviewView(state), [state]);

  const beginEdit = useCallback((segmentId: number) => {
    dispatch({ type: "begin-edit", segmentId });
  }, []);

  const updateActiveText = useCallback((text: string) => {
    dispatch({ type: "update-active-text", text });
  }, []);

  const stageActiveEdit = useCallback(() => {
    dispatch({ type: "stage-active-edit" });
  }, []);

  const cancelActiveEdit = useCallback(() => {
    dispatch({ type: "cancel-active-edit" });
  }, []);

  const discardChanges = useCallback(() => {
    dispatch({ type: "discard-changes" });
  }, []);

  const saveDraft = useCallback(() => {
    dispatch({ type: "save-draft" });
  }, []);

  const selectRevision = useCallback((id: string) => {
    if (selectedId === ORIGINAL_REVISION_ID && id === ORIGINAL_REVISION_ID && originalStateKind === "failed") {
      dispatch({ type: "retry-original" });
      return;
    }
    dispatch({ type: "select-revision", id });
  }, [originalStateKind, selectedId]);

  const resolveSwitch = useCallback((decision: SwitchDecision) => {
    dispatch({ type: "resolve-switch", decision });
  }, []);

  const retryOriginal = useCallback(() => {
    dispatch({ type: "retry-original" });
  }, []);

  const commitSelected = useCallback(async () => {
    if (!jobId || !state || commitGate.current !== null || isReviewDirty(state) || state.commitState.kind === "saving") return;
    const target = state.snapshots.find((snapshot) => snapshot.id === state.selectedId);
    if (!target || target.id === state.latestId) return;

    const requestId = ++commitRequestIdentity.current;
    const instanceId = requestIdentity.current;
    commitGate.current = requestId;
    dispatch({ type: "commit-start", requestId });
    const segments: Pick<TranscriptSegment, "id" | "text">[] = target.transcript.segments.map(({ id, text }) => ({ id, text }));
    try {
      await saveTranscript(jobId, segments);
      if (requestIdentity.current === instanceId) dispatch({ type: "commit-success", requestId });
    } catch {
      if (requestIdentity.current === instanceId) dispatch({ type: "commit-failure", requestId, message: COMMIT_ERROR });
    } finally {
      if (commitGate.current === requestId) commitGate.current = null;
    }
  }, [jobId, state]);

  return {
    view,
    beginEdit,
    updateActiveText,
    stageActiveEdit,
    cancelActiveEdit,
    discardChanges,
    saveDraft,
    selectRevision,
    resolveSwitch,
    retryOriginal,
    commitSelected,
  };
}
