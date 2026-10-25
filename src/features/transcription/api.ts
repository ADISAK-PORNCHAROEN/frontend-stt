import { isJobId, type JobId, type RemoteJob, type ServiceHealth, type Transcript, type TranscriptSegment, type WhisperModel } from "./types";

const ERROR_MESSAGES: Record<string, string> = {
  file_too_large: "ไฟล์มีขนาดเกิน 1 GiB กรุณาเลือกไฟล์ที่เล็กกว่านี้",
  unsupported_format: "รูปแบบไฟล์นี้ยังไม่รองรับ",
  invalid_input: "ไฟล์นี้ไม่มีเสียงที่ใช้งานได้ หรือยาวเกิน 2 ชั่วโมง",
  queue_full: "คิวถอดเสียงเต็มแล้ว กรุณารอสักครู่แล้วส่งใหม่",
  service_unavailable: "เชื่อมต่อ STT service ไม่ได้ ตรวจสอบว่า service กำลังทำงานอยู่",
  forbidden_origin: "คำขอนี้ไม่ผ่านการตรวจสอบแหล่งที่มา กรุณารีเฟรชหน้าแล้วลองใหม่",
  result_unavailable: "ผลลัพธ์ยังไม่พร้อม กรุณารอสักครู่แล้วลองอีกครั้ง",
  not_found: "ไม่พบงานนี้หรือข้อมูลหมดอายุแล้ว กรุณาส่งไฟล์ใหม่",
  internal_error: "เกิดข้อผิดพลาดระหว่างถอดเสียง กรุณาส่งไฟล์ใหม่",
  model_load_failed: "โมเดลที่เลือกโหลดไม่สำเร็จ กรุณาเลือกอีกโมเดลแล้วลองส่งไฟล์นี้อีกครั้ง",
};

export class ApiError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readApiError(payload: unknown, fallback: string): ApiError {
  if (!isRecord(payload)) return new ApiError("unknown", fallback);
  const error = payload.error;
  if (isRecord(error) && typeof error.code === "string") {
    return new ApiError(error.code, ERROR_MESSAGES[error.code] ?? fallback);
  }
  return new ApiError("unknown", fallback);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isWhisperModel(value: unknown): value is WhisperModel {
  return value === "turbo" || value === "large-v3";
}

function parseJobId(payload: unknown): JobId {
  if (isRecord(payload) && isJobId(payload.job_id)) return payload.job_id;
  throw new Error("เซิร์ฟเวอร์ส่งรหัสงานกลับมาไม่ถูกต้อง");
}

export function submitFile(
  file: File,
  model: WhisperModel,
  onProgress: (percent: number) => void,
  signal: AbortSignal,
): Promise<JobId> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const body = new FormData();
    body.append("file", file, file.name);
    body.append("model", model);
    xhr.open("POST", "/api/stt/jobs");
    xhr.responseType = "json";

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
      }
    });

    xhr.addEventListener("load", () => {
      const payload: unknown = xhr.response;
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(readApiError(payload, "ส่งไฟล์ไม่สำเร็จ กรุณาลองใหม่"));
        return;
      }
      try {
        resolve(parseJobId(payload));
      } catch (error) {
        reject(error);
      }
    });

    xhr.addEventListener("error", () => reject(new Error("การเชื่อมต่อขาดหาย กรุณาตรวจสอบ service แล้วส่งไฟล์ใหม่")));
    xhr.addEventListener("abort", () => reject(new DOMException("Upload cancelled", "AbortError")));
    signal.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(body);
  });
}

async function readJson(path: string, init: RequestInit = {}): Promise<unknown> {
  const response = await fetch(path, { ...init, cache: "no-store" });
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw readApiError(payload, "เชื่อมต่อ STT service ไม่ได้");
  }
  return payload;
}

export async function getServiceHealth(): Promise<ServiceHealth> {
  const response = await fetch("/api/stt/health", { cache: "no-store" });
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  const defaultModel = isRecord(payload) && isWhisperModel(payload.default_model) ? payload.default_model : null;
  return { ready: response.ok && isRecord(payload) && payload.ready === true && defaultModel !== null, defaultModel };
}

export async function getRemoteJob(jobId: JobId): Promise<RemoteJob> {
  const payload = await readJson(`/api/stt/jobs/${jobId}`);
  if (!isRecord(payload) || !isJobId(payload.id) || payload.id !== jobId) {
    throw new Error("เซิร์ฟเวอร์ส่งสถานะงานกลับมาไม่ถูกต้อง");
  }

  const progress = payload.progress_percent;
  if (!isFiniteNumber(progress) || progress < 0 || progress > 100) {
    throw new Error("เซิร์ฟเวอร์ส่งความคืบหน้ากลับมาไม่ถูกต้อง");
  }

  switch (payload.status) {
    case "queued":
      return { status: "queued", progressPercent: progress };
    case "running":
      return { status: "running", progressPercent: progress };
    case "succeeded":
      return { status: "succeeded", progressPercent: 100 };
    case "failed": {
      const errorCode = typeof payload.error === "string" ? payload.error : "internal_error";
      const serverMessage = typeof payload.error_message === "string" ? payload.error_message : "";
      const message = ERROR_MESSAGES[errorCode] ?? (serverMessage ? "การถอดเสียงไม่สำเร็จ กรุณาส่งไฟล์ใหม่" : ERROR_MESSAGES.internal_error);
      return { status: "failed", progressPercent: progress, message };
    }
    default:
      throw new Error("สถานะงานจาก STT service ไม่รองรับ");
  }
}

function parseTranscript(payload: unknown): Transcript {
  if (!isRecord(payload) || !isFiniteNumber(payload.duration_seconds) || !Array.isArray(payload.segments)) {
    throw new Error("รูปแบบ transcript จาก STT service ไม่ถูกต้อง");
  }

  const segmentIds = new Set<number>();
  const segments = payload.segments.map((item) => {
    if (
      !isRecord(item) ||
      typeof item.id !== "number" ||
      !Number.isSafeInteger(item.id) ||
      item.id < 1 ||
      !isFiniteNumber(item.start) ||
      !isFiniteNumber(item.end) ||
      typeof item.text !== "string" ||
      item.start < 0 ||
      item.end < item.start
    ) {
      throw new Error("มีช่วงเวลาใน transcript ที่ไม่ถูกต้อง");
    }
    const id = item.id;
    if (segmentIds.has(id)) throw new Error("มีรหัสช่วงใน transcript ซ้ำกัน");
    segmentIds.add(id);
    return { id, start: item.start, end: item.end, text: item.text };
  });

  const text = typeof payload.text === "string" ? payload.text : segments.map((segment) => segment.text).join("\n");
  return { durationSeconds: payload.duration_seconds, segments, text };
}

export async function getTranscript(jobId: JobId, format: "json" | "original-json" = "json"): Promise<Transcript> {
  const payload = await readJson(`/api/stt/jobs/${jobId}/result?format=${format}`);
  return parseTranscript(payload);
}

export function getOriginalTranscript(jobId: JobId): Promise<Transcript> {
  return getTranscript(jobId, "original-json");
}

export async function saveTranscript(
  jobId: JobId,
  segments: readonly Pick<TranscriptSegment, "id" | "text">[],
): Promise<void> {
  const payload = await readJson(`/api/stt/jobs/${jobId}/transcript`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ segments }),
  });
  if (!isRecord(payload) || payload.status !== "saved") {
    throw new Error("บันทึกการแก้ไขไม่สำเร็จ กรุณาลองอีกครั้ง");
  }
}
