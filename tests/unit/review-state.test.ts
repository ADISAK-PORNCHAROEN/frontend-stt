import { describe, expect, it } from "vitest";
import {
  initialReviewState,
  isReviewDirty,
  ORIGINAL_REVISION_ID,
  reviewReducer,
  reviewView,
  type ReviewState,
} from "@/features/transcription/review-state";
import type { Transcript } from "@/features/transcription/types";

const latest: Transcript = {
  durationSeconds: 4,
  text: "first\nsecond",
  segments: [
    { id: 1, start: 0, end: 2, text: "first" },
    { id: 2, start: 2, end: 4, text: "second" },
  ],
};
const original: Transcript = { ...latest, text: "asr first\nasr second", segments: latest.segments.map((segment) => ({ ...segment, text: `asr ${segment.text}` })) };

function reduce(state: ReviewState | null, action: Parameters<typeof reviewReducer>[1]): ReviewState | null {
  return reviewReducer(state, action);
}

describe("review state transitions", () => {
  it("returns an empty view and ignores actions until a transcript exists", () => {
    expect(reviewView(null)).toMatchObject({ transcript: null, revisions: [], isDirty: false, isSaving: false });
    expect(reduce(null, { type: "save-draft" })).toBeNull();
  });

  it("keeps editing, staging, and revision switches bounded to known snapshots", () => {
    let state = initialReviewState(latest);
    expect(reduce(state, { type: "stage-active-edit" })).toBe(state);
    expect(reduce(state, { type: "begin-edit", segmentId: 999 })).toBe(state);
    expect(reduce(state, { type: "select-revision", id: "missing" })).toBe(state);

    state = reduce(state, { type: "begin-edit", segmentId: 1 }) as ReviewState;
    state = reduce(state, { type: "update-active-text", text: "first" }) as ReviewState;
    state = reduce(state, { type: "stage-active-edit" }) as ReviewState;
    expect(isReviewDirty(state)).toBe(false);
    expect(state.pendingEdits).toEqual({});

    state = reduce(state, { type: "select-revision", id: ORIGINAL_REVISION_ID }) as ReviewState;
    const sameRevision = reduce(state, { type: "select-revision", id: ORIGINAL_REVISION_ID }) as ReviewState;
    expect(sameRevision.pendingSwitchId).toBeNull();
    state = reduce(state, { type: "select-revision", id: "latest-0" }) as ReviewState;
    state = reduce(state, { type: "begin-edit", segmentId: 1 }) as ReviewState;
    state = reduce(state, { type: "update-active-text", text: "changed" }) as ReviewState;
    state = reduce(state, { type: "stage-active-edit" }) as ReviewState;
    expect(isReviewDirty(state)).toBe(true);
    state = reduce(state, { type: "select-revision", id: ORIGINAL_REVISION_ID }) as ReviewState;
    expect(state.pendingSwitchId).toBe(ORIGINAL_REVISION_ID);
    state = reduce(state, { type: "resolve-switch", decision: "stay" }) as ReviewState;
    expect(state.pendingSwitchId).toBeNull();
    state = reduce(state, { type: "select-revision", id: ORIGINAL_REVISION_ID }) as ReviewState;
    state = reduce(state, { type: "resolve-switch", decision: "discard" }) as ReviewState;
    expect(state.selectedId).toBe(ORIGINAL_REVISION_ID);
    expect(state.pendingEdits).toEqual({});
  });

  it("retains exact snapshots and gates edits during a commit", () => {
    let state = initialReviewState(latest);
    state = reduce(state, { type: "begin-edit", segmentId: 1 }) as ReviewState;
    state = reduce(state, { type: "update-active-text", text: "draft text" }) as ReviewState;
    state = reduce(state, { type: "save-draft" }) as ReviewState;
    const draftId = state.selectedId;
    state = reduce(state, { type: "commit-start", requestId: 4 }) as ReviewState;
    expect(reduce(state, { type: "begin-edit", segmentId: 2 })).toBe(state);
    expect(reduce(state, { type: "update-active-text", text: "blocked" })).toBe(state);
    expect(reduce(state, { type: "stage-active-edit" })).toBe(state);
    expect(reduce(state, { type: "cancel-active-edit" })).toBe(state);
    expect(reduce(state, { type: "discard-changes" })).toBe(state);
    expect(reduce(state, { type: "save-draft" })).toBe(state);
    expect(reduce(state, { type: "select-revision", id: "latest-0" })).toBe(state);
    expect(reduce(state, { type: "commit-start", requestId: 5 })).toBe(state);
    expect(reduce(state, { type: "commit-failure", requestId: 5, message: "stale" })).toBe(state);
    expect(reduce(state, { type: "commit-success", requestId: 5 })).toBe(state);

    state = reduce(state, { type: "commit-failure", requestId: 4, message: "retry" }) as ReviewState;
    expect(state.commitState.kind).toBe("failed");
    state = reduce(state, { type: "commit-start", requestId: 6 }) as ReviewState;
    expect(reduce(state, { type: "commit-success", requestId: 7 })).toBe(state);
    state = reduce(state, { type: "commit-success", requestId: 6 }) as ReviewState;
    expect(state.latestId).toBe("latest-1");
    expect(state.selectedId).toBe("latest-1");
    expect(state.snapshots.find(({ id }) => id === draftId)?.transcript.segments[0]?.text).toBe("draft text");
    expect(state.snapshots.find(({ id }) => id === "latest-0")?.transcript.segments[0]?.text).toBe("first");

    const missingTarget = { ...state, commitState: { kind: "saving", requestId: 8, targetId: "deleted" } } as ReviewState;
    const recovered = reduce(missingTarget, { type: "commit-success", requestId: 8 }) as ReviewState;
    expect(recovered.commitState).toEqual({ kind: "idle" });
  });

  it("ignores stale original loads, retries failure, and avoids duplicate snapshots", () => {
    let state = initialReviewState(latest);
    expect(reduce(state, { type: "original-load-start", requestId: 1 })).toBe(state);
    state = reduce(state, { type: "select-revision", id: ORIGINAL_REVISION_ID }) as ReviewState;
    state = reduce(state, { type: "original-load-start", requestId: 1 }) as ReviewState;
    expect(reduce(state, { type: "original-load-success", requestId: 2, transcript: original })).toBe(state);
    expect(reduce(state, { type: "original-load-failure", requestId: 2, message: "stale" })).toBe(state);
    state = reduce(state, { type: "original-load-failure", requestId: 1, message: "offline" }) as ReviewState;
    expect(state.originalState.kind).toBe("failed");
    state = reduce(state, { type: "retry-original" }) as ReviewState;
    expect(state.originalState.kind).toBe("unloaded");
    expect(reduce(state, { type: "retry-original" })).toBe(state);
    state = reduce(state, { type: "original-load-start", requestId: 3 }) as ReviewState;
    state = reduce(state, { type: "original-load-success", requestId: 3, transcript: original }) as ReviewState;
    expect(state.originalState.kind).toBe("loaded");
    expect(state.snapshots.filter(({ id }) => id === ORIGINAL_REVISION_ID)).toHaveLength(1);

    const retryingExisting = { ...state, originalState: { kind: "loading", requestId: 4 } } as ReviewState;
    const duplicateSuccess = reduce(retryingExisting, { type: "original-load-success", requestId: 4, transcript: latest }) as ReviewState;
    expect(duplicateSuccess.snapshots.filter(({ id }) => id === ORIGINAL_REVISION_ID)).toHaveLength(1);
    expect(reduce(duplicateSuccess, { type: "original-load-failure", requestId: 4, message: "stale" })).toBe(duplicateSuccess);
  });

  it("handles missing selected snapshots without fabricating transcript data", () => {
    const state = { ...initialReviewState(latest), selectedId: "unknown" } as ReviewState;
    const view = reviewView(state);
    expect(view.transcript).toBeNull();
    expect(view.selectedKind).toBeNull();
    expect(view.selectedLabel).toBeNull();
    expect(reduce(state, { type: "stage-active-edit" })).toBe(state);

    const invalidActiveEdit = { ...state, activeEdit: { segmentId: 999, text: "stale" } } as ReviewState;
    const staged = reduce(invalidActiveEdit, { type: "stage-active-edit" }) as ReviewState;
    expect(staged.activeEdit).toBeNull();
  });
});
