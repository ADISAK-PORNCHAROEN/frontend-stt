export type ProgressObservation = Readonly<{
  progressPercent: number;
  observedAtMs: number;
}>;

const MAX_SAMPLES = 5;

export function estimateRemainingSeconds(
  observations: readonly ProgressObservation[],
  currentProgressPercent: number,
  nowMs: number,
  maxSampleAgeMs: number,
): number | null {
  if (
    !Number.isFinite(currentProgressPercent) ||
    currentProgressPercent < 0 ||
    currentProgressPercent >= 100 ||
    !Number.isFinite(nowMs) ||
    !Number.isFinite(maxSampleAgeMs) ||
    maxSampleAgeMs <= 0 ||
    observations.length < 2
  ) return null;

  const recent = observations.slice(-MAX_SAMPLES);
  const first = recent[0];
  const last = recent[recent.length - 1];
  if (
    !first || !last ||
    !Number.isFinite(first.progressPercent) ||
    !Number.isFinite(last.progressPercent) ||
    !Number.isFinite(first.observedAtMs) ||
    !Number.isFinite(last.observedAtMs) ||
    last.observedAtMs <= first.observedAtMs ||
    nowMs < last.observedAtMs ||
    nowMs - last.observedAtMs >= maxSampleAgeMs ||
    currentProgressPercent < last.progressPercent
  ) return null;

  for (let index = 1; index < recent.length; index += 1) {
    const previous = recent[index - 1];
    const current = recent[index];
    if (
      !previous || !current ||
      !Number.isFinite(current.progressPercent) ||
      !Number.isFinite(current.observedAtMs) ||
      current.observedAtMs <= previous.observedAtMs ||
      current.progressPercent < previous.progressPercent
    ) return null;
  }

  const progressDelta = last.progressPercent - first.progressPercent;
  const elapsedMs = last.observedAtMs - first.observedAtMs;
  if (progressDelta <= 0 || elapsedMs <= 0) return null;

  const percentPerSecond = progressDelta / (elapsedMs / 1000);
  const estimate = (100 - currentProgressPercent) / percentPerSecond;
  return Number.isFinite(estimate) && estimate > 0 ? estimate : null;
}

export function formatEstimatedTime(seconds: number): string | null {
  if (!Number.isFinite(seconds) || seconds <= 0) return null;

  if (seconds < 60) {
    const roundedSeconds = Math.max(5, Math.round(seconds / 5) * 5);
    return `${roundedSeconds} วินาที`;
  }

  const roundedMinutes = Math.max(1, Math.round(seconds / 60));
  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours} ชม. ${minutes} นาที`;
  if (hours > 0) return `${hours} ชม.`;
  return `${minutes} นาที`;
}
