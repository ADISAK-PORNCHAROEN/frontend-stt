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
type ActiveEdit = { segmentId: number; text: string };

export function useTranscriptReview(jobId: JobId | null, initialTranscript: Transcript | null) {
  const [savedTranscript, setSavedTranscript] = useState(initialTranscript);
  const [stagedTexts, setStagedTexts] = useState<Record<number, string>>({});
  const [activeEdit, setActiveEdit] = useState<ActiveEdit | null>(null);
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

  const isSaving = saveState.kind === "saving";
  const hasStagedChanges = savedTranscript?.segments.some((segment) => stagedTexts[segment.id] !== undefined) ?? false;
  const stagedCount = Object.keys(stagedTexts).length;
  const activeSavedText = activeEdit && savedTranscript?.segments.find((segment) => segment.id === activeEdit.segmentId)?.text;
  const activeBaseText = activeEdit ? stagedTexts[activeEdit.segmentId] ?? activeSavedText : undefined;
  const isDirty = hasStagedChanges || (activeEdit !== null && activeEdit.text !== activeBaseText);
  const latestDraft = useMemo<Transcript | null>(() => {
    if (!savedTranscript) return null;
    const segments = savedTranscript.segments.map((segment) => ({
      ...segment,
      text: activeEdit?.segmentId === segment.id
        ? activeEdit.text
        : stagedTexts[segment.id] ?? segment.text,
    }));
    return { ...savedTranscript, segments, text: segments.map(({ text }) => text.trim()).join("\n") };
  }, [activeEdit, savedTranscript, stagedTexts]);
  const transcript = showingOriginal && originalState.kind === "loaded"
    ? originalState.transcript
    : latestDraft;

  const beginEdit = useCallback((segmentId: number) => {
    if (isSaving || showingOriginal || activeEdit !== null) return;
    const segment = savedTranscript?.segments.find((item) => item.id === segmentId);
    if (!segment) return;
    setActiveEdit({ segmentId, text: stagedTexts[segmentId] ?? segment.text });
  }, [activeEdit, isSaving, savedTranscript, showingOriginal, stagedTexts]);

  const updateActiveText = useCallback((text: string) => {
    if (!activeEdit || isSaving) return;
    setActiveEdit((current) => current ? { ...current, text } : current);
    setSaveState({ kind: "idle" });
  }, [activeEdit, isSaving]);

  const stageActiveEdit = useCallback(() => {
    if (!activeEdit || !savedTranscript || isSaving) return;
    const savedText = savedTranscript.segments.find((segment) => segment.id === activeEdit.segmentId)?.text;
    if (savedText === undefined) return;
    setStagedTexts((current) => {
      if (activeEdit.text === savedText) {
        const next = { ...current };
        delete next[activeEdit.segmentId];
        return next;
      }
      return { ...current, [activeEdit.segmentId]: activeEdit.text };
    });
    setActiveEdit(null);
    setSaveState({ kind: "idle" });
  }, [activeEdit, isSaving, savedTranscript]);

  const cancelActiveEdit = useCallback(() => {
    if (!activeEdit || isSaving) return;
    setActiveEdit(null);
  }, [activeEdit, isSaving]);

  const discardChanges = useCallback(() => {
    if (isSaving) return;
    setStagedTexts({});
    setActiveEdit(null);
    setSaveState({ kind: "idle" });
  }, [isSaving]);

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
    if (!jobId || !savedTranscript || !latestDraft || !hasStagedChanges || activeEdit || isSaving) return;
    const identity = requestIdentity.current;
    const submittedSegments: Pick<TranscriptSegment, "id" | "text">[] = savedTranscript.segments.map(({ id, text }) => ({
      id,
      text: stagedTexts[id] ?? text,
    }));
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
      setStagedTexts({});
      setSaveState({ kind: "saved" });
    } catch {
      if (requestIdentity.current === identity) {
        setSaveState({ kind: "failed", message: "บันทึกการแก้ไขไม่สำเร็จ กรุณาลองอีกครั้ง" });
      }
    }
  }, [activeEdit, hasStagedChanges, isSaving, jobId, latestDraft, savedTranscript, stagedTexts]);

  return {
    transcript,
    isOriginal: showingOriginal,
    isDirty,
    isSaving,
    saveState,
    originalState,
    activeEdit,
    stagedCount,
    beginEdit,
    updateActiveText,
    stageActiveEdit,
    cancelActiveEdit,
    discardChanges,
    viewOriginal,
    viewLatest,
    saveChanges,
  };
}
