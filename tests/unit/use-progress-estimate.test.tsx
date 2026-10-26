import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PROGRESS_ESTIMATE_STALE_MS, useProgressEstimate } from "@/features/transcription/hooks/use-progress-estimate";

type Props = {
  jobId: string | null;
  status: "running" | "inactive";
  progressPercent: number;
};

describe("useProgressEstimate", () => {
  afterEach(() => vi.useRealTimers());

  it("keeps observations inside one active job and expires a stalled estimate", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000);
    const initialProps: Props = { jobId: "job-a", status: "running", progressPercent: 20 };
    const { result, rerender } = renderHook(
      (props: Props) => useProgressEstimate(props.jobId, props.status, props.progressPercent),
      { initialProps },
    );
    expect(result.current).toBeNull();

    act(() => vi.advanceTimersByTime(2_000));
    rerender({ jobId: "job-a", status: "running", progressPercent: 40 });
    expect(result.current).toBe(6);

    rerender({ jobId: "job-b", status: "running", progressPercent: 40 });
    expect(result.current).toBeNull();
    act(() => vi.advanceTimersByTime(1_000));
    rerender({ jobId: "job-b", status: "running", progressPercent: 60 });
    expect(result.current).toBe(2);

    act(() => vi.advanceTimersByTime(PROGRESS_ESTIMATE_STALE_MS));
    expect(result.current).toBeNull();
  });

  it("clears samples while the current job waits in queue", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000);
    const initialProps: Props = { jobId: "job-a", status: "running", progressPercent: 20 };
    const { result, rerender } = renderHook(
      (props: Props) => useProgressEstimate(props.jobId, props.status, props.progressPercent),
      { initialProps },
    );
    act(() => vi.advanceTimersByTime(2_000));
    rerender({ jobId: "job-a", status: "running", progressPercent: 40 });
    expect(result.current).not.toBeNull();

    rerender({ jobId: "job-a", status: "inactive", progressPercent: 0 });
    expect(result.current).toBeNull();
    rerender({ jobId: "job-a", status: "running", progressPercent: 40 });
    expect(result.current).toBeNull();
  });
});
