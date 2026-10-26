import { describe, expect, it } from "vitest";
import { estimateRemainingSeconds, formatEstimatedTime, type ProgressObservation } from "@/features/transcription/progress-estimate";

const observations = (values: readonly [number, number][]): ProgressObservation[] =>
  values.map(([progressPercent, observedAtMs]) => ({ progressPercent, observedAtMs }));

describe("progress estimate", () => {
  it("estimates remaining seconds from recent increasing progress observations", () => {
    expect(estimateRemainingSeconds(observations([[20, 1_000], [40, 3_000]]), 40, 3_500, 5_000)).toBe(6);
  });

  it("hides estimates without enough advancing data or with stale, invalid, or regressing samples", () => {
    expect(estimateRemainingSeconds(observations([[40, 1_000]]), 40, 1_100, 5_000)).toBeNull();
    expect(estimateRemainingSeconds(observations([[40, 1_000], [40, 3_000]]), 40, 3_100, 5_000)).toBeNull();
    expect(estimateRemainingSeconds(observations([[20, 1_000], [40, 3_000]]), 40, 8_001, 5_000)).toBeNull();
    expect(estimateRemainingSeconds(observations([[20, 3_000], [40, 1_000]]), 40, 3_500, 5_000)).toBeNull();
    expect(estimateRemainingSeconds(observations([[20, 1_000], [40, 3_000]]), 100, 3_500, 5_000)).toBeNull();
  });

  it("rounds short estimates to five-second steps and longer estimates to minutes", () => {
    expect(formatEstimatedTime(6)).toBe("5 วินาที");
    expect(formatEstimatedTime(78)).toBe("1 นาที");
    expect(formatEstimatedTime(3_720)).toBe("1 ชม. 2 นาที");
    expect(formatEstimatedTime(Number.NaN)).toBeNull();
  });
});
