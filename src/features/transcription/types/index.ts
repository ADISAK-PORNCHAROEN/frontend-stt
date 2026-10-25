declare const jobIdBrand: unique symbol;

export type JobId = string & { readonly [jobIdBrand]: true };

export type WhisperModel = "turbo" | "large-v3";

export type ServiceHealth = {
  ready: boolean;
  defaultModel: WhisperModel | null;
};

export type TranscriptSegment = {
  id: number;
  start: number;
  end: number;
  text: string;
};

export type Transcript = {
  durationSeconds: number;
  segments: TranscriptSegment[];
  text: string;
};

export type RemoteJob =
  | { status: "queued"; progressPercent: number }
  | { status: "running"; progressPercent: number }
  | { status: "succeeded"; progressPercent: 100 }
  | { status: "failed"; progressPercent: number; message: string };

export type MediaFile = {
  file: File;
  url: string;
  durationSeconds: number | null;
};

export type WorkspaceSession =
  | { kind: "empty" }
  | ({ kind: "selected" } & MediaFile)
  | ({ kind: "submitting"; uploadPercent: number } & MediaFile)
  | ({ kind: "queued"; jobId: JobId; progressPercent: number } & MediaFile)
  | ({ kind: "running"; jobId: JobId; progressPercent: number } & MediaFile)
  | ({ kind: "succeeded"; jobId: JobId; transcript: Transcript } & MediaFile)
  | ({ kind: "failed"; jobId: JobId | null; message: string } & MediaFile);

export type ServiceState = "checking" | "ready" | "unavailable";

export function isJobId(value: unknown): value is JobId {
  return typeof value === "string" && /^[a-f0-9]{32}$/.test(value);
}
