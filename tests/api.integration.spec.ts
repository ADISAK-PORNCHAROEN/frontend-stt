import { request as httpRequest, type IncomingHttpHeaders } from "node:http";
import { test, expect } from "./support/test";
import { silentWav } from "./support/media";

function beginStreamedUpload(origin: string) {
  const target = new URL("/api/stt/jobs", origin);
  const boundary = "frontend-stt-fixture-boundary";
  const file = silentWav({ durationSeconds: 1 });
  const prefix = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${file.name}"\r\nContent-Type: ${file.mimeType}\r\n\r\n`);
  const suffix = Buffer.from(`\r\n--${boundary}--\r\n`);
  type UploadResponse = { status: number; body: string; headers: IncomingHttpHeaders };
  let resolveResponse: (response: UploadResponse) => void = () => undefined;
  let rejectResponse: (error: Error) => void = () => undefined;
  const responsePromise = new Promise<UploadResponse>((resolve, reject) => {
    resolveResponse = resolve;
    rejectResponse = reject;
  });
  const request = httpRequest({
    hostname: target.hostname,
    port: Number(target.port),
    path: target.pathname,
    method: "POST",
    headers: {
      Origin: origin,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      "Transfer-Encoding": "chunked",
    },
  }, (response) => {
    const chunks: Buffer[] = [];
    response.on("data", (chunk: Buffer | string) => chunks.push(Buffer.from(chunk)));
    response.on("end", () => resolveResponse({ status: response.statusCode ?? 0, body: Buffer.concat(chunks).toString("utf8"), headers: response.headers }));
  });
  request.on("error", rejectResponse);
  request.write(prefix);
  request.write(file.buffer.subarray(0, 64));

  return {
    response: responsePromise,
    async finish() {
      request.write(file.buffer.subarray(64));
      request.end(suffix);
      return responsePromise;
    },
  };
}

async function submitFixtureFile(origin: string): Promise<Response> {
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array([0, 0, 0])], { type: "audio/wav" }), "sample.wav");
  return fetch(`${origin}/api/stt/jobs`, {
    method: "POST",
    headers: { Origin: origin },
    body: form,
  });
}

test("#2 health readiness is proxied from the controlled loopback fixture without cache or upstream-only headers", async ({ app, stt }) => {
  stt.reset({ kind: "ready" });
  const ready = await fetch(`${app.origin}/api/stt/health`);
  expect(ready.status).toBe(200);
  expect(await ready.json()).toEqual({ ready: true, default_model: "turbo" });
  expect(ready.headers.get("cache-control")).toBe("no-store");
  expect(ready.headers.get("x-content-type-options")).toBe("nosniff");
  expect(ready.headers.get("x-internal-test")).toBeNull();
  expect(ready.headers.get("set-cookie")).toBeNull();

  stt.reset({ kind: "unavailable" });
  const unavailable = await fetch(`${app.origin}/api/stt/health`);
  expect(unavailable.status).toBe(503);
  expect(unavailable.headers.get("cache-control")).toBe("no-store");
});

test("#9 reports the configured model and forwards the selected model through the same-origin upload route", async ({ app, stt }) => {
  stt.reset({ kind: "ready", defaultModel: "large-v3" });
  const health = await fetch(`${app.origin}/api/stt/health`);
  expect(health.status).toBe(200);
  expect(await health.json()).toEqual({ ready: true, default_model: "large-v3" });

  stt.reset({ kind: "job", outcome: "success" });
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array([0, 0, 0])], { type: "audio/wav" }), "sample.wav");
  form.append("model", "large-v3");
  const submitted = await fetch(`${app.origin}/api/stt/jobs`, {
    method: "POST",
    headers: { Origin: app.origin },
    body: form,
  });

  expect(submitted.status).toBe(202);
  expect(stt.uploads()[0]).toMatchObject({ fieldNames: ["file", "model"], model: "large-v3" });
  expect(submitted.headers.get("cache-control")).toBe("no-store");
});

test("#10 saves a complete text-only transcript once and serves immutable original plus latest JSON, TXT, and SRT", async ({ app, stt }) => {
  stt.reset({ kind: "job", outcome: "success" });
  expect((await submitFixtureFile(app.origin)).status).toBe(202);
  stt.advance();
  stt.advance();
  const jobId = "0123456789abcdef0123456789abcdef";
  const original = await fetch(`${app.origin}/api/stt/jobs/${jobId}/result?format=original-json`);
  expect(original.status).toBe(200);
  const originalPayload = await original.json();
  expect(originalPayload.segments[0]).toMatchObject({ id: 1, start: 0, end: 2 });

  const editedSegments = Array.from({ length: 14 }, (_, index) => ({
    id: index + 1,
    text: index === 0 ? "ประโยคแรกที่แก้ไข" : index === 1 ? "ประโยคที่สองที่แก้ไข" : `ช่วงเสียงภาษาไทยลำดับที่ ${index + 1} มีเวลาเริ่มและเวลาจบที่กำหนดไว้แน่นอน`,
  }));
  const saved = await fetch(`${app.origin}/api/stt/jobs/${jobId}/transcript`, {
    method: "PUT",
    headers: { Origin: app.origin, "Content-Type": "application/json" },
    body: JSON.stringify({ segments: editedSegments }),
  });
  expect(saved.status).toBe(200);
  expect(await saved.json()).toEqual({ status: "saved" });
  expect(saved.headers.get("cache-control")).toBe("no-store");
  expect(stt.saves()).toHaveLength(1);
  expect(stt.saves()[0]).toMatchObject({ contentType: "application/json", payload: { segments: editedSegments } });

  const latest = await fetch(`${app.origin}/api/stt/jobs/${jobId}/result?format=json`);
  const latestPayload = await latest.json();
  expect(latestPayload.segments.slice(0, 2)).toEqual([
    { id: 1, start: 0, end: 2, text: "ประโยคแรกที่แก้ไข" },
    { id: 2, start: 2, end: 4, text: "ประโยคที่สองที่แก้ไข" },
  ]);
  expect(originalPayload.segments[0].text).not.toBe("ประโยคแรกที่แก้ไข");

  const txt = await fetch(`${app.origin}/api/stt/jobs/${jobId}/result?format=txt`);
  expect(await txt.text()).toContain("ประโยคแรกที่แก้ไข\nประโยคที่สองที่แก้ไข");
  const srt = await fetch(`${app.origin}/api/stt/jobs/${jobId}/result?format=srt`);
  const srtText = await srt.text();
  expect(srtText).toContain("00:00:00,000 --> 00:00:02,000\nประโยคแรกที่แก้ไข");
  expect(srtText).toContain("00:00:02,000 --> 00:00:04,000\nประโยคที่สองที่แก้ไข");
});

test("#22 commits successive selected revision snapshots through the existing same-origin PUT and preserves original", async ({ app, stt }) => {
  stt.reset({ kind: "job", outcome: "success" });
  expect((await submitFixtureFile(app.origin)).status).toBe(202);
  stt.advance();
  stt.advance();
  const jobId = "0123456789abcdef0123456789abcdef";
  const resultUrl = `${app.origin}/api/stt/jobs/${jobId}/result?format=`;
  const transcriptUrl = `${app.origin}/api/stt/jobs/${jobId}/transcript`;
  const originalResponse = await fetch(`${resultUrl}original-json`);
  const originalSegments = (await originalResponse.json()).segments;
  const commits = ["ฉบับร่างหนึ่ง", "ฉบับร่างสอง"].map((prefix) => Array.from({ length: 14 }, (_, index) => ({
    id: index + 1,
    text: index === 0 ? prefix : `ช่วงเสียงภาษาไทยลำดับที่ ${index + 1} มีเวลาเริ่มและเวลาจบที่กำหนดไว้แน่นอน`,
  })));

  for (const segments of commits) {
    const response = await fetch(transcriptUrl, {
      method: "PUT",
      headers: { Origin: app.origin, "Content-Type": "application/json" },
      body: JSON.stringify({ segments }),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "saved" });
  }

  const latest = await fetch(`${resultUrl}json`);
  expect((await latest.json()).segments[0]).toMatchObject({ id: 1, text: "ฉบับร่างสอง" });
  const originalAfter = await fetch(`${resultUrl}original-json`);
  expect((await originalAfter.json()).segments).toEqual(originalSegments);
  expect(stt.saves()).toHaveLength(2);
  expect(stt.saves().map(({ payload }) => (payload as { segments: unknown[] }).segments[0])).toEqual([
    { id: 1, text: "ฉบับร่างหนึ่ง" },
    { id: 1, text: "ฉบับร่างสอง" },
  ]);
});

test("#23 keeps the selected-revision preview inputs on the established original and latest API contract", async ({ app, stt }) => {
  stt.reset({ kind: "job", outcome: "success" });
  expect((await submitFixtureFile(app.origin)).status).toBe(202);
  stt.advance();
  stt.advance();
  const jobId = "0123456789abcdef0123456789abcdef";
  const base = `${app.origin}/api/stt/jobs/${jobId}/result?format=`;

  const [originalResponse, latestResponse, txtResponse, srtResponse] = await Promise.all([
    fetch(`${base}original-json`),
    fetch(`${base}json`),
    fetch(`${base}txt`),
    fetch(`${base}srt`),
  ]);
  expect(originalResponse.status).toBe(200);
  expect(latestResponse.status).toBe(200);
  const originalPayload = await originalResponse.json();
  const latestPayload = await latestResponse.json();
  expect(originalPayload.segments[0]).toMatchObject({ id: 1, start: 0, end: 2 });
  expect(latestPayload.segments[0]).toMatchObject({ id: 1, start: 0, end: 2 });
  expect(await txtResponse.text()).toContain("ช่วงเสียงภาษาไทยลำดับที่ 1 มีเวลาเริ่มและเวลาจบที่กำหนดไว้แน่นอน");
  expect(await srtResponse.text()).toContain("00:00:00,000 --> 00:00:02,000");

  const history = await fetch(`${app.origin}/api/stt/jobs/${jobId}/revisions`);
  expect(history.status).toBe(404);
  expect(stt.saves()).toHaveLength(0);
});

test("#10 rejects cross-origin transcript saves and preserves drafts at the API boundary after a failed save", async ({ app, stt }) => {
  stt.reset({ kind: "job", outcome: "success", failTranscriptSaveOnce: true });
  expect((await submitFixtureFile(app.origin)).status).toBe(202);
  stt.advance();
  stt.advance();
  const transcriptUrl = `${app.origin}/api/stt/jobs/0123456789abcdef0123456789abcdef/transcript`;
  const segments = Array.from({ length: 14 }, (_, index) => ({ id: index + 1, text: `ฉบับแก้ ${index + 1}` }));

  const crossOrigin = await fetch(transcriptUrl, {
    method: "PUT",
    headers: { Origin: "http://example.invalid", "Content-Type": "application/json" },
    body: JSON.stringify({ segments }),
  });
  expect(crossOrigin.status).toBe(403);
  expect(stt.saves()).toHaveLength(0);

  const failed = await fetch(transcriptUrl, {
    method: "PUT",
    headers: { Origin: app.origin, "Content-Type": "application/json" },
    body: JSON.stringify({ segments }),
  });
  expect(failed.status).toBe(503);
  expect(stt.saves()).toHaveLength(1);
  const latest = await fetch(`${app.origin}/api/stt/jobs/0123456789abcdef0123456789abcdef/result?format=json`);
  expect((await latest.json()).segments[0]).toMatchObject({ id: 1, text: "ช่วงเสียงภาษาไทยลำดับที่ 1 มีเวลาเริ่มและเวลาจบที่กำหนดไว้แน่นอน" });
});

test("#3 streams the file field to the loopback fixture before the browser request finishes and follows one job", async ({ app, stt }) => {
  stt.reset({ kind: "job", outcome: "success" });
  const upload = beginStreamedUpload(app.origin);
  const firstHop = await Promise.race([
    stt.waitForUploadBytes().then(() => ({ kind: "fixture" as const })),
    upload.response.then((response) => ({ kind: "response" as const, response })),
  ]);
  expect(firstHop.kind, firstHop.kind === "response" ? `${firstHop.response.status}: ${firstHop.response.body}` : undefined).toBe("fixture");
  const inFlight = stt.uploads()[0];
  expect(inFlight.bytesReceived).toBeGreaterThan(0);
  expect(inFlight.complete).toBe(false);

  const submitted = await upload.finish();
  expect(submitted.status).toBe(202);
  expect(JSON.parse(submitted.body)).toEqual({ job_id: "0123456789abcdef0123456789abcdef" });
  expect(submitted.headers["cache-control"]).toBe("no-store");
  expect(submitted.headers["x-content-type-options"]).toBe("nosniff");
  expect(submitted.headers["x-internal-test"]).toBeUndefined();
  const uploaded = stt.uploads()[0];
  expect(uploaded.complete).toBe(true);
  expect(uploaded.fieldNames).toEqual(["file"]);
  expect(uploaded.fileName).toBe("sample.wav");
  const queued = await fetch(`${app.origin}/api/stt/jobs/0123456789abcdef0123456789abcdef`);
  expect(queued.status).toBe(200);
  expect(await queued.json()).toMatchObject({ status: "queued", progress_percent: 0 });
  expect(queued.headers.get("cache-control")).toBe("no-store");

  stt.advance();
  const running = await fetch(`${app.origin}/api/stt/jobs/0123456789abcdef0123456789abcdef`);
  expect(await running.json()).toMatchObject({ status: "running", progress_percent: 47 });
  stt.advance();
  const succeeded = await fetch(`${app.origin}/api/stt/jobs/0123456789abcdef0123456789abcdef`);
  expect(await succeeded.json()).toMatchObject({ status: "succeeded", progress_percent: 100 });
});

test("#3 rejects cross-origin, non-multipart, and invalid job requests without forwarding them", async ({ app, stt }) => {
  stt.reset({ kind: "ready" });
  const crossOrigin = await fetch(`${app.origin}/api/stt/jobs`, {
    method: "POST",
    headers: { Origin: "http://example.invalid", "Content-Type": "multipart/form-data; boundary=x" },
    body: "--x--\r\n",
  });
  expect(crossOrigin.status).toBe(403);
  expect(crossOrigin.headers.get("cache-control")).toBe("no-store");

  const untrustedHost = await fetch(`${app.origin}/api/stt/jobs`, {
    method: "POST",
    headers: { Origin: "http://attacker.invalid", Host: "attacker.invalid", "Content-Type": "multipart/form-data; boundary=x" },
    body: "--x--\r\n",
  });
  expect(untrustedHost.status).toBe(403);

  const wrongType = await fetch(`${app.origin}/api/stt/jobs`, {
    method: "POST",
    headers: { Origin: app.origin, "Content-Type": "application/json" },
    body: "{}",
  });
  expect(wrongType.status, await wrongType.clone().text()).toBe(400);

  const invalidId = await fetch(`${app.origin}/api/stt/jobs/not-a-job-id`);
  expect(invalidId.status).toBe(404);
  expect(invalidId.headers.get("cache-control")).toBe("no-store");
  expect(stt.uploads()).toHaveLength(0);
});

test("#3 preserves controlled service error codes and no-store response policy", async ({ app, stt }) => {
  stt.reset({ kind: "reject", code: "queue_full" });
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array([1, 2, 3])], { type: "audio/wav" }), "sample.wav");
  const queueFull = await fetch(`${app.origin}/api/stt/jobs`, {
    method: "POST",
    headers: { Origin: app.origin },
    body: form,
  });
  expect(queueFull.status).toBe(429);
  expect(queueFull.headers.get("cache-control")).toBe("no-store");
  expect(queueFull.headers.get("x-content-type-options")).toBe("nosniff");
  expect(await queueFull.json()).toMatchObject({ error: { code: "queue_full" } });
  expect(stt.uploads()[0].fieldNames).toEqual(["file"]);
});

test("#4 serves JSON, TXT, and SRT only when ready, with no-store and safe download headers", async ({ app, stt }) => {
  stt.reset({ kind: "job", outcome: "success" });
  const submitted = await submitFixtureFile(app.origin);
  expect(submitted.status).toBe(202);
  const jobId = "0123456789abcdef0123456789abcdef";

  const unavailable = await fetch(`${app.origin}/api/stt/jobs/${jobId}/result?format=json`);
  expect(unavailable.status).toBe(409);
  expect(unavailable.headers.get("cache-control")).toBe("no-store");
  expect(await unavailable.json()).toMatchObject({ error: { code: "result_unavailable" } });

  stt.advance();
  stt.advance();
  const jsonResult = await fetch(`${app.origin}/api/stt/jobs/${jobId}/result?format=json`);
  expect(jsonResult.status).toBe(200);
  expect(jsonResult.headers.get("content-type")).toContain("application/json");
  expect(jsonResult.headers.get("cache-control")).toBe("no-store");
  expect(jsonResult.headers.get("x-internal-test")).toBeNull();
  const resultBody: unknown = await jsonResult.json();
  expect(resultBody).toMatchObject({ duration_seconds: 28 });
  expect(resultBody).toHaveProperty("segments.0.start", 0);
  expect(resultBody).toHaveProperty("segments.0.end", 2);
  expect(resultBody).toHaveProperty("segments.1.start", 2);

  const txt = await fetch(`${app.origin}/api/stt/jobs/${jobId}/result?format=txt`);
  expect(txt.status).toBe(200);
  expect(txt.headers.get("content-disposition")).toContain("transcript.txt");
  expect(txt.headers.get("cache-control")).toBe("no-store");
  expect(await txt.text()).toContain("ประโยคทดสอบภาษาไทยที่ยาวเป็นพิเศษ");

  const srt = await fetch(`${app.origin}/api/stt/jobs/${jobId}/result?format=srt`);
  expect(srt.status).toBe(200);
  expect(srt.headers.get("content-disposition")).toContain("transcript.srt");
  expect(srt.headers.get("cache-control")).toBe("no-store");
  expect(await srt.text()).toContain("00:00:00,000 --> 00:00:02,000");

  const invalidFormat = await fetch(`${app.origin}/api/stt/jobs/${jobId}/result?format=html`);
  expect(invalidFormat.status).toBe(400);
  expect(invalidFormat.headers.get("cache-control")).toBe("no-store");
});

test("#4 maps expired result errors to no-store and does not request other destinations", async ({ app, stt }) => {
  stt.reset({ kind: "job", outcome: "expired" });
  expect((await submitFixtureFile(app.origin)).status).toBe(202);
  const expired = await fetch(`${app.origin}/api/stt/jobs/0123456789abcdef0123456789abcdef/result?format=json`);
  expect(expired.status).toBe(404);
  expect(expired.headers.get("cache-control")).toBe("no-store");
  expect(await expired.json()).toMatchObject({ error: { code: "not_found" } });
});
