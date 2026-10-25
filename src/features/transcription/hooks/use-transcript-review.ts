"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getOriginalTranscript, saveTranscript } from "../api";
import type { JobId, Transcript, TranscriptSegment } from "../types";

type OriginalState =
  | { kind: "unloaded" }
  | { kind: "loading" }
  | { kind: "loaded"; transcript: Transcript }
  | { kind: "failed"; message: string };

type SaveState = { kind: "idle" } | { kind: "saving" } | { kind: "saved" } | { kind: "failed"; message: string };

function initialDraft(transcript: Transcript | null): Record<number, string> {
  return transcript ? Object.fromEntries(transcript.segments.map(({ id, text }) => [id, text])) : {};
}

export function useTranscriptReview(jobId: JobId | null, initialTranscript: Transcript | null) {
  const [savedTranscript, setSavedTranscript] = useState(initialTranscript);
  const [draftTexts, setDraftTexts] = useState<Record<number, string>>(() => initialDraft(initialTranscript));
  const [originalState, setOriginalState] = useState<OriginalState>({ kind: "unloaded" });
  const [saveState, setSaveState] = useState<SaveState>({ kind: "idle" });
  const [showingOriginal, setShowingOriginal] = useState(false);
  const requestIdentity = useRef(0);

  useEffect(() => {
    const identity = ++requestIdentity.current;
    return () => {
      if (requestIdentity.current === identity) requestIdentity.current += 1;
    };
  }, []);

  const isDirty = savedTranscript?.segments.some((segment) => draftTexts[segment.id] !== segment.text) ?? false;
  const isSaving = saveState.kind === "saving";
  const latestDraft = useMemo<Transcript | null>(() => {
    if (!savedTranscript) return null;
    const segments = savedTranscript.segments.map((segment) => ({
      ...segment,
      text: draftTexts[segment.id] ?? segment.text,
    }));
    return { ...savedTranscript, segments, text: segments.map(({ text }) => text.trim()).join("\n") };
  }, [draftTexts, savedTranscript]);
  const transcript = showingOriginal && originalState.kind === "loaded"
    ? originalState.transcript
    : latestDraft;

  const updateText = useCallback((segmentId: number, text: string) => {
    if (!savedTranscript?.segments.some((segment) => segment.id === segmentId)) return;
    setDraftTexts((current) => ({ ...current, [segmentId]: text }));
    setSaveState({ kind: "idle" });
  }, [savedTranscript]);

  const viewOriginal = useCallback(async () => {
    if (!jobId || !savedTranscript) return;
    if (originalState.kind === "loaded") {
      setShowingOriginal(true);
      return;
    }
    const identity = requestIdentity.current;
    setOriginalState({ kind: "loading" });
    try {
      const original = await getOriginalTranscript(jobId);
      if (requestIdentity.current !== identity) return;
      setOriginalState({ kind: "loaded", transcript: original });
      setShowingOriginal(true);
    } catch {
      if (requestIdentity.current === identity) {
        setOriginalState({ kind: "failed", message: "โหลดบทถอดเสียงต้นฉบับไม่สำเร็จ กรุณาลองอีกครั้ง" });
      }
    }
  }, [jobId, originalState.kind, savedTranscript]);

  const viewLatest = useCallback(() => setShowingOriginal(false), []);

  const saveChanges = useCallback(async () => {
    if (!jobId || !savedTranscript || !latestDraft || !isDirty || isSaving) return;
    const identity = requestIdentity.current;
    const submittedSegments: Pick<TranscriptSegment, "id" | "text">[] = latestDraft.segments.map(({ id, text }) => ({ id, text }));
    setSaveState({ kind: "saving" });
    try {
      await saveTranscript(jobId, submittedSegments);
      if (requestIdentity.current !== identity) return;
      setSavedTranscript((current) => {
        if (!current) return current;
        const textById = new Map(submittedSegments.map(({ id, text }) => [id, text]));
        const segments = current.segments.map((segment) => ({ ...segment, text: textById.get(segment.id) ?? segment.text }));
        return { ...current, segments, text: segments.map(({ text }) => text.trim()).join("\n") };
      });
      setSaveState({ kind: "saved" });
    } catch {
      if (requestIdentity.current === identity) {
        setSaveState({ kind: "failed", message: "บันทึกการแก้ไขไม่สำเร็จ กรุณาลองอีกครั้ง" });
      }
    }
  }, [isDirty, isSaving, jobId, latestDraft, savedTranscript]);

  return {
    transcript,
    isOriginal: showingOriginal,
    isDirty,
    isSaving,
    saveState,
    originalState,
    updateText,
    viewOriginal,
    viewLatest,
    saveChanges,
  };
}
