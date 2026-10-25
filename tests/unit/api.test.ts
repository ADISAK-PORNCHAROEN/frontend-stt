import { beforeEach, describe, expect, it, vi } from "vitest";
import { getOriginalTranscript, getRemoteJob, getServiceHealth, getTranscript, saveTranscript, submitFile } from "@/features/transcription/api";
import { isJobId, type JobId } from "@/features/transcription/types";

const JOB_ID_VALUE = "0123456789abcdef0123456789abcdef";
const JOB_ID: JobId = (() => {
  if (!isJobId(JOB_ID_VALUE)) throw new Error("Invalid test job ID");
  return JOB_ID_VALUE;
})();

function response(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });
}

class FakeXhr extends EventTarget {
  readonly upload = new EventTarget();
  readonly open = vi.fn<(method: string, url: string) => void>();
  readonly send = vi.fn<(body: FormData) => void>();
  status = 0;
  response: unknown = null;
  responseType: XMLHttpRequestResponseType = "";

  complete(status: number, payload: unknown): void {
    this.status = status;
    this.response = payload;
    this.dispatchEvent(new Event("load"));
  }

  failNetwork(): void {
    this.dispatchEvent(new Event("error"));
  }

  abort(): void {
    this.dispatchEvent(new Event("abort"));
  }

  reportProgress(loaded: number, total: number, lengthComputable: boolean): void {
    const event = Object.assign(new Event("progress"), { loaded, total, lengthComputable });
    this.upload.dispatchEvent(event);
  }
}

describe("transcription API adapter", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("submits the local file and model, reports bounded progress, and parses the job ID", async () => {
    const xhrRef: { current?: FakeXhr } = {};
    vi.stubGlobal("XMLHttpRequest", class extends FakeXhr {
      constructor() {
        super();
        xhrRef.current = this;
      }
    });
    const file = new File(["audio"], "sample.wav", { type: "audio/wav" });
    const progress = vi.fn();
    const pending = submitFile(file, "large-v3", progress, new AbortController().signal);
    expect(xhrRef.current?.open).toHaveBeenCalledWith("POST", "/api/stt/jobs");
    expect(xhrRef.current?.responseType).toBe("json");
    const body = xhrRef.current?.send.mock.calls[0]?.[0];
    expect(body).toBeInstanceOf(FormData);
    if (!(body instanceof FormData)) throw new Error("Expected multipart form data");
    expect(body.get("file")).toBeInstanceOf(File);
    expect(body.get("model")).toBe("large-v3");
    xhrRef.current?.reportProgress(2, 3, true);
    xhrRef.current?.reportProgress(1, 0, false);
    xhrRef.current?.reportProgress(4, 3, true);
    expect(progress.mock.calls).toEqual([[67], [100]]);
    xhrRef.current?.complete(202, { job_id: JOB_ID_VALUE });
    await expect(pending).resolves.toBe(JOB_ID_VALUE);
  });

  it("rejects malformed upload responses and maps upload errors", async () => {
    const xhrRef: { current?: FakeXhr } = {};
    vi.stubGlobal("XMLHttpRequest", class extends FakeXhr {
      constructor() { super(); xhrRef.current = this; }
    });
    const first = submitFile(new File(["a"], "a.wav"), "turbo", vi.fn(), new AbortController().signal);
    xhrRef.current?.complete(200, { job_id: "bad-id" });
    await expect(first).rejects.toThrow("เซิร์ฟเวอร์ส่งรหัสงานกลับมาไม่ถูกต้อง");

    const second = submitFile(new File(["a"], "a.wav"), "turbo", vi.fn(), new AbortController().signal);
    xhrRef.current?.complete(422, { error: { code: "unsupported_format" } });
    await expect(second).rejects.toMatchObject({ name: "ApiError", code: "unsupported_format", message: "รูปแบบไฟล์นี้ยังไม่รองรับ" });

    const third = submitFile(new File(["a"], "a.wav"), "turbo", vi.fn(), new AbortController().signal);
    xhrRef.current?.complete(500, { error: { code: "unrecognized" } });
    await expect(third).rejects.toMatchObject({ code: "unrecognized", message: "ส่งไฟล์ไม่สำเร็จ กรุณาลองใหม่" });
  });

  it("reports upload network failures and aborts when its signal is cancelled", async () => {
    const xhrRef: { current?: FakeXhr } = {};
    vi.stubGlobal("XMLHttpRequest", class extends FakeXhr {
      constructor() { super(); xhrRef.current = this; }
    });
    const failed = submitFile(new File(["a"], "a.wav"), "turbo", vi.fn(), new AbortController().signal);
    xhrRef.current?.failNetwork();
    await expect(failed).rejects.toThrow("การเชื่อมต่อขาดหาย");

    const controller = new AbortController();
    const cancelled = submitFile(new File(["a"], "a.wav"), "turbo", vi.fn(), controller.signal);
    controller.abort();
    await expect(cancelled).rejects.toMatchObject({ name: "AbortError" });
  });

  it("normalizes readiness and treats malformed service payloads as unavailable", async () => {
    fetchMock.mockResolvedValueOnce(response({ ready: true, default_model: "large-v3" }));
    await expect(getServiceHealth()).resolves.toEqual({ ready: true, defaultModel: "large-v3" });
    expect(fetchMock).toHaveBeenLastCalledWith("/api/stt/health", { cache: "no-store" });

    fetchMock.mockResolvedValueOnce(response({ ready: true, default_model: "unknown" }));
    await expect(getServiceHealth()).resolves.toEqual({ ready: false, defaultModel: null });

    fetchMock.mockResolvedValueOnce(response({ ready: true, default_model: "turbo" }, 503));
    await expect(getServiceHealth()).resolves.toEqual({ ready: false, defaultModel: "turbo" });

    fetchMock.mockResolvedValueOnce(new Response("invalid json"));
    await expect(getServiceHealth()).resolves.toEqual({ ready: false, defaultModel: null });
  });

  it("validates job IDs, progress, and each supported job status", async () => {
    for (const [payload, expected] of [
      [{ id: JOB_ID_VALUE, status: "queued", progress_percent: 5 }, { status: "queued", progressPercent: 5 }],
      [{ id: JOB_ID_VALUE, status: "running", progress_percent: 47 }, { status: "running", progressPercent: 47 }],
      [{ id: JOB_ID_VALUE, status: "succeeded", progress_percent: 65 }, { status: "succeeded", progressPercent: 100 }],
      [{ id: JOB_ID_VALUE, status: "failed", progress_percent: 100, error: "model_load_failed" }, { status: "failed", progressPercent: 100, message: "โมเดลที่เลือกโหลดไม่สำเร็จ กรุณาเลือกอีกโมเดลแล้วลองส่งไฟล์นี้อีกครั้ง" }],
      [{ id: JOB_ID_VALUE, status: "failed", progress_percent: 100, error: "unknown", error_message: "secret" }, { status: "failed", progressPercent: 100, message: "การถอดเสียงไม่สำเร็จ กรุณาส่งไฟล์ใหม่" }],
      [{ id: JOB_ID_VALUE, status: "failed", progress_percent: 100 }, { status: "failed", progressPercent: 100, message: "เกิดข้อผิดพลาดระหว่างถอดเสียง กรุณาส่งไฟล์ใหม่" }],
    ] as const) {
      fetchMock.mockResolvedValueOnce(response(payload));
      await expect(getRemoteJob(JOB_ID)).resolves.toEqual(expected);
    }

    for (const payload of [
      null,
      { id: "different0123456789abcdef0123456", status: "queued", progress_percent: 0 },
      { id: JOB_ID_VALUE, status: "queued", progress_percent: Number.NaN },
      { id: JOB_ID_VALUE, status: "queued", progress_percent: 101 },
      { id: JOB_ID_VALUE, status: "unknown", progress_percent: 0 },
    ]) {
      fetchMock.mockResolvedValueOnce(response(payload));
      await expect(getRemoteJob(JOB_ID)).rejects.toThrow();
    }
  });

  it("parses transcript data, preserves original-view selection, and rejects invalid structures", async () => {
    const valid = { duration_seconds: 4, segments: [{ id: 1, start: 0, end: 2, text: "first" }, { id: 2, start: 2, end: 4, text: "second" }] };
    fetchMock.mockResolvedValueOnce(response(valid));
    await expect(getTranscript(JOB_ID)).resolves.toEqual({ durationSeconds: 4, segments: valid.segments, text: "first\nsecond" });
    expect(fetchMock).toHaveBeenLastCalledWith(`/api/stt/jobs/${JOB_ID}/result?format=json`, { cache: "no-store" });

    fetchMock.mockResolvedValueOnce(response({ ...valid, text: "authoritative" }));
    await expect(getOriginalTranscript(JOB_ID)).resolves.toMatchObject({ text: "authoritative" });
    expect(fetchMock).toHaveBeenLastCalledWith(`/api/stt/jobs/${JOB_ID}/result?format=original-json`, { cache: "no-store" });

    for (const payload of [
      null,
      { duration_seconds: "4", segments: [] },
      { duration_seconds: 4, segments: {} },
      { duration_seconds: 4, segments: [{ id: 0, start: 0, end: 1, text: "x" }] },
      { duration_seconds: 4, segments: [{ id: 1.5, start: 0, end: 1, text: "x" }] },
      { duration_seconds: 4, segments: [{ id: 1, start: Number.POSITIVE_INFINITY, end: 1, text: "x" }] },
      { duration_seconds: 4, segments: [{ id: 1, start: 2, end: 1, text: "x" }] },
      { duration_seconds: 4, segments: [{ id: 1, start: 0, end: 1, text: "x" }, { id: 1, start: 1, end: 2, text: "x" }] },
    ]) {
      fetchMock.mockResolvedValueOnce(response(payload));
      await expect(getTranscript(JOB_ID)).rejects.toThrow();
    }
  });

  it("saves text-only segments and rejects error or malformed save responses", async () => {
    const segments = [{ id: 1, text: "first" }, { id: 2, text: "second" }];
    fetchMock.mockResolvedValueOnce(response({ status: "saved" }));
    await expect(saveTranscript(JOB_ID, segments)).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenLastCalledWith(`/api/stt/jobs/${JOB_ID}/transcript`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ segments }),
      cache: "no-store",
    });

    fetchMock.mockResolvedValueOnce(response({ status: "error" }));
    await expect(saveTranscript(JOB_ID, segments)).rejects.toThrow("บันทึกการแก้ไขไม่สำเร็จ");
    fetchMock.mockResolvedValueOnce(response({ error: { code: "queue_full" } }, 429));
    await expect(saveTranscript(JOB_ID, segments)).rejects.toMatchObject({ code: "queue_full", message: "คิวถอดเสียงเต็มแล้ว กรุณารอสักครู่แล้วส่งใหม่" });
  });
});
