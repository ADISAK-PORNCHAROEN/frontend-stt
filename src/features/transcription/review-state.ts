import type { Transcript, TranscriptSegment } from "./types";

export const ORIGINAL_REVISION_ID = "original";

export type RevisionKind = "latest" | "original" | "draft";

export type TranscriptSnapshot = Readonly<{
  durationSeconds: number;
  text: string;
  segments: readonly Readonly<TranscriptSegment>[];
}>;

export type ReviewSnapshot = Readonly<{
  id: string;
  kind: RevisionKind;
  sequence: number;
  transcript: TranscriptSnapshot;
}>;

export type ActiveEdit = Readonly<{ segmentId: number; text: string }>;

export type OriginalState =
  | { kind: "unloaded" }
  | { kind: "loading"; requestId: number }
  | { kind: "loaded"; id: typeof ORIGINAL_REVISION_ID }
  | { kind: "failed"; message: string };

export type CommitState =
  | { kind: "idle" }
  | { kind: "saving"; requestId: number; targetId: string }
  | { kind: "saved"; targetId: string }
  | { kind: "failed"; targetId: string; message: string };

export type ReviewState = Readonly<{
  snapshots: readonly ReviewSnapshot[];
  selectedId: string;
  latestId: string;
  originalState: OriginalState;
  pendingEdits: Readonly<Record<number, string>>;
  activeEdit: ActiveEdit | null;
  pendingSwitchId: string | null;
  commitState: CommitState;
  nextDraftNumber: number;
  nextLatestNumber: number;
}>;

export type RevisionOption = Readonly<{ id: string; kind: RevisionKind; label: string }>;

export type ReviewView = Readonly<{
  currentId: string | null;
  selectedId: string | null;
  latestId: string | null;
  selectedKind: RevisionKind | null;
  selectedLabel: string | null;
  revisions: readonly RevisionOption[];
  transcript: Transcript | null;
  selectedSnapshotTranscript: TranscriptSnapshot | null;
  isOriginal: boolean;
  isLatest: boolean;
  isDirty: boolean;
  isSaving: boolean;
  activeEdit: ActiveEdit | null;
  stagedCount: number;
  commitState: CommitState;
  originalState: OriginalState;
  pendingSwitch: Readonly<{ id: string; label: string }> | null;
  draftSaveCount: number;
}>;

export type SwitchDecision = "save" | "discard" | "stay";

export type ReviewAction =
  | { type: "begin-edit"; segmentId: number }
  | { type: "update-active-text"; text: string }
  | { type: "stage-active-edit" }
  | { type: "cancel-active-edit" }
  | { type: "discard-changes" }
  | { type: "save-draft" }
  | { type: "select-revision"; id: string }
  | { type: "resolve-switch"; decision: SwitchDecision }
  | { type: "retry-original" }
  | { type: "original-load-start"; requestId: number }
  | { type: "original-load-success"; requestId: number; transcript: Transcript }
  | { type: "original-load-failure"; requestId: number; message: string }
  | { type: "commit-start"; requestId: number }
  | { type: "commit-success"; requestId: number }
  | { type: "commit-failure"; requestId: number; message: string };

function makeSnapshot(id: string, kind: RevisionKind, sequence: number, transcript: Transcript): ReviewSnapshot {
  const segments = Object.freeze(transcript.segments.map((segment) => Object.freeze({ ...segment })));
  return Object.freeze({
    id,
    kind,
    sequence,
    transcript: Object.freeze({
      durationSeconds: transcript.durationSeconds,
      text: transcript.text,
      segments,
    }),
  });
}

function copyTranscript(snapshot: TranscriptSnapshot): Transcript {
  return {
    durationSeconds: snapshot.durationSeconds,
    text: snapshot.text,
    segments: snapshot.segments.map((segment) => ({ ...segment })),
  };
}

export function initialReviewState(transcript: Transcript): ReviewState {
  const latestId = "latest-0";
  return {
    snapshots: [makeSnapshot(latestId, "latest", 0, transcript)],
    selectedId: latestId,
    latestId,
    originalState: { kind: "unloaded" },
    pendingEdits: {},
    activeEdit: null,
    pendingSwitchId: null,
    commitState: { kind: "idle" },
    nextDraftNumber: 1,
    nextLatestNumber: 1,
  };
}

function findSnapshot(state: ReviewState, id: string): ReviewSnapshot | undefined {
  return state.snapshots.find((snapshot) => snapshot.id === id);
}

function selectedSnapshot(state: ReviewState): ReviewSnapshot | undefined {
  return findSnapshot(state, state.selectedId);
}

function isKnownRevision(state: ReviewState, id: string): boolean {
  return id === ORIGINAL_REVISION_ID || id === state.latestId || state.snapshots.some((snapshot) => snapshot.id === id && snapshot.kind === "draft");
}

function dirtySegmentCount(state: ReviewState): number {
  const selected = selectedSnapshot(state);
  if (!selected) return 0;
  const changedIds = new Set<number>();
  for (const [segmentId, text] of Object.entries(state.pendingEdits)) {
    const id = Number(segmentId);
    const baseText = selected.transcript.segments.find((segment) => segment.id === id)?.text;
    if (baseText !== undefined && text !== baseText) changedIds.add(id);
  }
  if (state.activeEdit) {
    const baseText = state.pendingEdits[state.activeEdit.segmentId]
      ?? selected.transcript.segments.find((segment) => segment.id === state.activeEdit?.segmentId)?.text;
    const snapshotText = selected.transcript.segments.find((segment) => segment.id === state.activeEdit?.segmentId)?.text;
    if (state.activeEdit.text !== baseText && snapshotText !== undefined) changedIds.add(state.activeEdit.segmentId);
  }
  return changedIds.size;
}

export function isReviewDirty(state: ReviewState): boolean {
  return dirtySegmentCount(state) > 0;
}

function makeWorkingTranscript(state: ReviewState, snapshot: ReviewSnapshot): Transcript {
  const segments = snapshot.transcript.segments.map((segment) => ({
    ...segment,
    text: state.activeEdit?.segmentId === segment.id
      ? state.activeEdit.text
      : state.pendingEdits[segment.id] ?? segment.text,
  }));
  return {
    durationSeconds: snapshot.transcript.durationSeconds,
    segments,
    text: segments.map(({ text }) => text).join("\n"),
  };
}

function revisionOptions(state: ReviewState): RevisionOption[] {
  const drafts = state.snapshots
    .filter((snapshot) => snapshot.kind === "draft")
    .toSorted((left, right) => left.sequence - right.sequence)
    .map((snapshot) => ({ id: snapshot.id, kind: snapshot.kind, label: `ฉบับร่าง ${snapshot.sequence}` }));
  return [
    { id: state.latestId, kind: "latest", label: "ฉบับล่าสุดที่ตรวจแล้ว" },
    { id: ORIGINAL_REVISION_ID, kind: "original", label: "ต้นฉบับ ASR" },
    ...drafts,
  ];
}

export function reviewView(state: ReviewState | null): ReviewView {
  if (!state) {
    return {
      currentId: null,
      selectedId: null,
      latestId: null,
      selectedKind: null,
      selectedLabel: null,
      revisions: [],
      transcript: null,
      selectedSnapshotTranscript: null,
      isOriginal: false,
      isLatest: false,
      isDirty: false,
      isSaving: false,
      activeEdit: null,
      stagedCount: 0,
      commitState: { kind: "idle" },
      originalState: { kind: "unloaded" },
      pendingSwitch: null,
      draftSaveCount: 0,
    };
  }

  const revisions = revisionOptions(state);
  const selectedId = state.pendingSwitchId ?? state.selectedId;
  const selectedOption = revisions.find((option) => option.id === state.selectedId) ?? null;
  const snapshot = selectedSnapshot(state);
  const pendingSwitchOption = state.pendingSwitchId
    ? revisions.find((option) => option.id === state.pendingSwitchId)
    : undefined;
  return {
    currentId: state.selectedId,
    selectedId,
    latestId: state.latestId,
    selectedKind: selectedOption?.kind ?? null,
    selectedLabel: selectedOption?.label ?? null,
    revisions,
    transcript: snapshot ? makeWorkingTranscript(state, snapshot) : null,
    selectedSnapshotTranscript: snapshot?.transcript ?? null,
    isOriginal: state.selectedId === ORIGINAL_REVISION_ID,
    isLatest: state.selectedId === state.latestId,
    isDirty: isReviewDirty(state),
    isSaving: state.commitState.kind === "saving",
    activeEdit: state.activeEdit,
    stagedCount: dirtySegmentCount(state),
    commitState: state.commitState,
    originalState: state.originalState,
    pendingSwitch: state.pendingSwitchId && pendingSwitchOption
      ? { id: pendingSwitchOption.id, label: pendingSwitchOption.label }
      : null,
    draftSaveCount: state.nextDraftNumber - 1,
  };
}

function selectRevision(state: ReviewState, id: string): ReviewState {
  if (!isKnownRevision(state, id) || state.commitState.kind === "saving") return state;
  if (id === state.selectedId) return { ...state, pendingSwitchId: null };
  if (isReviewDirty(state)) return { ...state, pendingSwitchId: id };
  return {
    ...state,
    selectedId: id,
    pendingEdits: {},
    activeEdit: null,
    pendingSwitchId: null,
    commitState: { kind: "idle" },
  };
}

function applyEdits(transcript: Transcript, edits: Readonly<Record<number, string>>): Transcript {
  const segments = transcript.segments.map((segment) => ({
    ...segment,
    text: edits[segment.id] ?? segment.text,
  }));
  return { durationSeconds: transcript.durationSeconds, segments, text: segments.map(({ text }) => text).join("\n") };
}

function saveDraft(state: ReviewState, nextSelection?: string): ReviewState {
  const base = selectedSnapshot(state);
  if (!base || state.commitState.kind === "saving" || !isReviewDirty(state)) return state;

  const edits: Record<number, string> = { ...state.pendingEdits };
  if (state.activeEdit) {
    const baseText = base.transcript.segments.find((segment) => segment.id === state.activeEdit?.segmentId)?.text;
    if (baseText !== undefined) {
      if (state.activeEdit.text === baseText) delete edits[state.activeEdit.segmentId];
      else edits[state.activeEdit.segmentId] = state.activeEdit.text;
    }
  }
  const transcript = applyEdits(copyTranscript(base.transcript), edits);
  const id = `draft-${state.nextDraftNumber}`;
  const draft = makeSnapshot(id, "draft", state.nextDraftNumber, transcript);
  return {
    ...state,
    snapshots: [...state.snapshots, draft],
    selectedId: nextSelection ?? id,
    pendingEdits: {},
    activeEdit: null,
    pendingSwitchId: null,
    commitState: { kind: "idle" },
    nextDraftNumber: state.nextDraftNumber + 1,
  };
}

function discardAndSwitch(state: ReviewState, targetId: string): ReviewState {
  return {
    ...state,
    selectedId: targetId,
    pendingEdits: {},
    activeEdit: null,
    pendingSwitchId: null,
    commitState: { kind: "idle" },
  };
}

export function reviewReducer(state: ReviewState | null, action: ReviewAction): ReviewState | null {
  if (!state) return state;

  switch (action.type) {
    case "begin-edit": {
      if (state.commitState.kind === "saving" || state.pendingSwitchId || state.activeEdit) return state;
      const snapshot = selectedSnapshot(state);
      const segment = snapshot?.transcript.segments.find((item) => item.id === action.segmentId);
      if (!segment) return state;
      return {
        ...state,
        activeEdit: { segmentId: segment.id, text: state.pendingEdits[segment.id] ?? segment.text },
      };
    }
    case "update-active-text":
      if (!state.activeEdit || state.commitState.kind === "saving" || state.pendingSwitchId) return state;
      return { ...state, activeEdit: { ...state.activeEdit, text: action.text } };
    case "stage-active-edit": {
      if (!state.activeEdit || state.commitState.kind === "saving" || state.pendingSwitchId) return state;
      const snapshot = selectedSnapshot(state);
      const baseText = snapshot?.transcript.segments.find((segment) => segment.id === state.activeEdit?.segmentId)?.text;
      if (baseText === undefined) return { ...state, activeEdit: null };
      const pendingEdits = { ...state.pendingEdits };
      if (state.activeEdit.text === baseText) delete pendingEdits[state.activeEdit.segmentId];
      else pendingEdits[state.activeEdit.segmentId] = state.activeEdit.text;
      return { ...state, pendingEdits, activeEdit: null };
    }
    case "cancel-active-edit":
      return state.activeEdit && state.commitState.kind !== "saving"
        ? { ...state, activeEdit: null }
        : state;
    case "discard-changes":
      return state.commitState.kind === "saving"
        ? state
        : { ...state, pendingEdits: {}, activeEdit: null, pendingSwitchId: null };
    case "save-draft":
      return saveDraft(state);
    case "select-revision":
      return selectRevision(state, action.id);
    case "resolve-switch": {
      const targetId = state.pendingSwitchId;
      if (!targetId || state.commitState.kind === "saving") return state;
      if (action.decision === "stay") return { ...state, pendingSwitchId: null };
      if (action.decision === "save") return saveDraft(state, targetId);
      return discardAndSwitch(state, targetId);
    }
    case "retry-original":
      return state.originalState.kind === "failed" && state.selectedId === ORIGINAL_REVISION_ID
        ? { ...state, originalState: { kind: "unloaded" } }
        : state;
    case "original-load-start":
      return state.selectedId === ORIGINAL_REVISION_ID && state.originalState.kind === "unloaded"
        ? { ...state, originalState: { kind: "loading", requestId: action.requestId } }
        : state;
    case "original-load-success": {
      if (state.originalState.kind !== "loading" || state.originalState.requestId !== action.requestId) return state;
      const original = findSnapshot(state, ORIGINAL_REVISION_ID);
      return {
        ...state,
        snapshots: original ? state.snapshots : [...state.snapshots, makeSnapshot(ORIGINAL_REVISION_ID, "original", 0, action.transcript)],
        originalState: { kind: "loaded", id: ORIGINAL_REVISION_ID },
      };
    }
    case "original-load-failure":
      return state.originalState.kind === "loading" && state.originalState.requestId === action.requestId
        ? { ...state, originalState: { kind: "failed", message: action.message } }
        : state;
    case "commit-start": {
      const snapshot = selectedSnapshot(state);
      if (!snapshot || state.selectedId === state.latestId || isReviewDirty(state) || state.commitState.kind === "saving") return state;
      return { ...state, commitState: { kind: "saving", requestId: action.requestId, targetId: snapshot.id } };
    }
    case "commit-success": {
      if (state.commitState.kind !== "saving" || state.commitState.requestId !== action.requestId) return state;
      const target = findSnapshot(state, state.commitState.targetId);
      if (!target) return { ...state, commitState: { kind: "idle" } };
      const id = `latest-${state.nextLatestNumber}`;
      const latest = makeSnapshot(id, "latest", state.nextLatestNumber, copyTranscript(target.transcript));
      return {
        ...state,
        snapshots: [...state.snapshots, latest],
        selectedId: id,
        latestId: id,
        commitState: { kind: "saved", targetId: id },
        nextLatestNumber: state.nextLatestNumber + 1,
      };
    }
    case "commit-failure":
      return state.commitState.kind === "saving" && state.commitState.requestId === action.requestId
        ? { ...state, commitState: { kind: "failed", targetId: state.commitState.targetId, message: action.message } }
        : state;
  }
}
