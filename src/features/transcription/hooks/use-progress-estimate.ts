"use client";

import { useEffect, useState } from "react";
import { estimateRemainingSeconds, type ProgressObservation } from "../progress-estimate";

export const PROGRESS_ESTIMATE_STALE_MS = 5_000;
const MAX_PROGRESS_OBSERVATIONS = 5;

type ProgressTrackingState = Readonly<{
  jobId: string | null;
  status: "running" | "inactive";
  progressPercent: number;
  samples: readonly ProgressObservation[];
}>;

export function useProgressEstimate(
  jobId: string | null,
  status: "running" | "inactive",
  progressPercent: number,
): number | null {
  const [tracking, setTracking] = useState<ProgressTrackingState>({
    jobId: null,
    status: "inactive",
    progressPercent: -1,
    samples: [],
  });
  const [clock, setClock] = useState(() => Date.now());

  if (tracking.jobId !== jobId || tracking.status !== status || tracking.progressPercent !== progressPercent) {
    const canObserve = status === "running" && Boolean(jobId) && Number.isFinite(progressPercent) && progressPercent >= 0 && progressPercent < 100;
    const sameJob = tracking.jobId === jobId && tracking.status === "running" && status === "running";
    const currentSamples = canObserve && sameJob ? [...tracking.samples] : [];
    const last = currentSamples[currentSamples.length - 1];

    if (last && progressPercent < last.progressPercent) currentSamples.length = 0;
    const currentLast = currentSamples[currentSamples.length - 1];
    if (!currentLast || progressPercent > currentLast.progressPercent) {
      currentSamples.push({ progressPercent, observedAtMs: clock });
      if (currentSamples.length > MAX_PROGRESS_OBSERVATIONS) currentSamples.shift();
    }

    setTracking({
      jobId,
      status,
      progressPercent,
      samples: currentSamples,
    });
  }

  useEffect(() => {
    if (status !== "running" || !jobId) return;
    const timer = setInterval(() => setClock(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, [jobId, status]);

  return status === "running" && jobId && tracking.jobId === jobId
    ? estimateRemainingSeconds(tracking.samples, progressPercent, clock, PROGRESS_ESTIMATE_STALE_MS)
    : null;
}
