import { createServer, type Server, type ServerResponse } from "node:http";

export type WhisperModel = "turbo" | "large-v3";

export type FixtureScenario =
  | { kind: "ready"; defaultModel?: WhisperModel }
  | { kind: "unavailable" }
  | { kind: "reject"; code: "queue_full" | "invalid_input" | "unsupported_format" }
  | { kind: "job"; outcome: "success" | "processing_failure" | "expired" | "result_unavailable" | "model_load_failure"; holdSubmission?: boolean; defaultModel?: WhisperModel; failTranscriptSaveOnce?: boolean; progressSequence?: readonly number[] };

export type UploadObservation = Readonly<{
  bytesReceived: number;
  complete: boolean;
  fieldNames: readonly string[];
  model: string | null;
  fileName: string | null;
}>;

export type TranscriptSaveObservation = Readonly<{
  contentType: string | null;
  payload: unknown;
}>;

const JOB_ID = "0123456789abcdef0123456789abcdef";

const transcriptSegments = Array.from({ length: 14 }, (_, index) => {
  const start = index * 2;
  const text = index === 1
    ? "ประโยคทดสอบภาษาไทยที่ยาวเป็นพิเศษเพื่อยืนยันว่าข้อความหลายบรรทัดยังอ่านได้ชัดเจนบนหน้าจอขนาดเล็ก และ <script>ไม่ควรถูกแสดงเป็น HTML</script>"
    : `ช่วงเสียงภาษาไทยลำดับที่ ${index + 1} มีเวลาเริ่มและเวลาจบที่กำหนดไว้แน่นอน`;
  return { id: index + 1, start, end: start + 2, text };
});

function transcriptText(segments: readonly (typeof transcriptSegments)[number][]): string {
  return segments.map(({ text }) => text).join("\n");
}
const srtTimestamp = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const wholeSeconds = Math.floor(seconds % 60);
  const millis = Math.round((seconds % 1) * 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(wholeSeconds).padStart(2, "0")},${String(millis).padStart(3, "0")}`;
};
function srtText(segments: readonly (typeof transcriptSegments)[number][]): string {
  return segments.map(({ start, end, text }, index) => `${index + 1}\n${srtTimestamp(start)} --> ${srtTimestamp(end)}\n${text}`).join("\n\n");
}

function json(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "public, max-age=60",
    "X-Internal-Test": "must-not-cross-proxy",
    "Set-Cookie": "fixture=private",
  });
  response.end(JSON.stringify(body));
}

function jsonAttachment(response: ServerResponse, filename: string, body: unknown): void {
  response.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "public, max-age=60",
    "X-Internal-Test": "must-not-cross-proxy",
  });
  response.end(JSON.stringify(body));
}

export type SttFixture = {
  origin: string;
  reset(scenario: FixtureScenario): void;
  advance(): void;
  releaseSubmission(): void;
  uploads(): readonly UploadObservation[];
  saves(): readonly TranscriptSaveObservation[];
  waitForUploadBytes(): Promise<void>;
  close(): Promise<void>;
};

function finalStage(scenario: FixtureScenario): number {
  return scenario.kind === "job" && scenario.progressSequence
    ? scenario.progressSequence.length + 1
    : 2;
}

export async function startSttFixture(): Promise<SttFixture> {
  let scenario: FixtureScenario = { kind: "ready" };
  let stage = 0;
  let accepted = false;
  let submittedModel: string | null = null;
  let savedSegments = transcriptSegments.map((segment) => ({ ...segment }));
  let failNextTranscriptSave = false;
  const observations: UploadObservation[] = [];
  const transcriptSaveObservations: TranscriptSaveObservation[] = [];
  const uploadWaiters: Array<() => void> = [];
  let pendingSubmission: (() => void) | null = null;
  const respondUnavailable = (response: ServerResponse) => json(response, 503, { error: { code: "service_unavailable", message: "Fixture unavailable" } });

  const server: Server = createServer(async (request, response) => {
    const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;

    if (pathname === "/health" && request.method === "GET") {
      if (scenario.kind === "unavailable") return respondUnavailable(response);
      const defaultModel = scenario.kind === "ready" || scenario.kind === "job" ? scenario.defaultModel ?? "turbo" : "turbo";
      return json(response, 200, { ready: true, default_model: defaultModel });
    }

    if (pathname === "/jobs" && request.method === "POST") {
      const observation = { bytesReceived: 0, complete: false, fieldNames: [] as string[], model: null as string | null, fileName: null as string | null };
      observations.push(observation);
      const chunks: Buffer[] = [];
      request.on("data", (rawChunk: Buffer | string) => {
        const chunk = Buffer.from(rawChunk);
        chunks.push(chunk);
        observation.bytesReceived += chunk.byteLength;
        if (observation.bytesReceived > 0) {
          for (const resolve of uploadWaiters.splice(0)) resolve();
        }
      });
      request.on("end", () => {
        observation.complete = true;
        const body = Buffer.concat(chunks).toString("latin1");
        observation.fieldNames = [...body.matchAll(/Content-Disposition:\s*form-data;\s*name="([^"]+)"/gi)].map((match) => match[1]);
        observation.model = body.match(/Content-Disposition:\s*form-data;\s*name="model"\r\n\r\n([^\r\n]*)/i)?.[1] ?? null;
        submittedModel = observation.model;
        observation.fileName = body.match(/filename="([^"]+)"/i)?.[1] ?? null;

        if (scenario.kind === "unavailable") return respondUnavailable(response);
        if (scenario.kind === "reject") {
          const status = scenario.code === "queue_full" ? 429 : 422;
          return json(response, status, { error: { code: scenario.code, message: "Fixture rejected the upload" } });
        }
        accepted = true;
        stage = 0;
        if (scenario.kind === "job" && scenario.holdSubmission) {
          pendingSubmission = () => json(response, 202, { job_id: JOB_ID });
          return;
        }
        json(response, 202, { job_id: JOB_ID });
      });
      return;
    }

    const transcriptMatch = pathname.match(/^\/jobs\/([a-f0-9]+)\/transcript$/);
    if (transcriptMatch && request.method === "PUT") {
      const chunks: Buffer[] = [];
      request.on("data", (chunk: Buffer | string) => chunks.push(Buffer.from(chunk)));
      request.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf8");
        let payload: unknown = null;
        try { payload = JSON.parse(body); } catch { /* The fixture reports malformed requests as rejected. */ }
        transcriptSaveObservations.push({ contentType: request.headers["content-type"] ?? null, payload });

        if (scenario.kind === "unavailable") return respondUnavailable(response);
        if (!accepted || transcriptMatch[1] !== JOB_ID) return json(response, 404, { error: { code: "not_found", message: "Job not found" } });
        if (scenario.kind !== "job" || stage < finalStage(scenario) || scenario.outcome === "expired") {
          return json(response, 409, { error: { code: "result_unavailable", message: "Result not ready" } });
        }
        if (failNextTranscriptSave) {
          failNextTranscriptSave = false;
          return json(response, 503, { error: { code: "internal_error", message: "Fixture save failed" } });
        }
        if (!payload || typeof payload !== "object" || !Array.isArray((payload as { segments?: unknown }).segments)) {
          return json(response, 422, { error: { code: "invalid_request", message: "Invalid transcript update" } });
        }
        const updates = (payload as { segments: unknown[] }).segments;
        if (updates.length !== transcriptSegments.length || updates.some((item, index) =>
          !item || typeof item !== "object" ||
          (item as { id?: unknown }).id !== transcriptSegments[index].id ||
          typeof (item as { text?: unknown }).text !== "string" ||
          Object.keys(item).some((key) => key !== "id" && key !== "text")
        )) {
          return json(response, 422, { error: { code: "invalid_request", message: "Transcript segments must preserve their original shape" } });
        }
        savedSegments = transcriptSegments.map((segment, index) => ({ ...segment, text: (updates[index] as { text: string }).text }));
        json(response, 200, { status: "saved" });
      });
      return;
    }

    const statusMatch = pathname.match(/^\/jobs\/([a-f0-9]+)$/);
    if (statusMatch && request.method === "GET") {
      if (scenario.kind === "unavailable") return respondUnavailable(response);
      if (!accepted || statusMatch[1] !== JOB_ID) return json(response, 404, { error: { code: "not_found", message: "Job not found" } });
      if (scenario.kind !== "job") return json(response, 404, { error: { code: "not_found", message: "Job not found" } });
      if (scenario.outcome === "expired" && stage > 0) return json(response, 404, { error: { code: "not_found", message: "Job expired" } });
      if (stage === 0) return json(response, 200, { id: JOB_ID, status: "queued", progress_percent: 0 });
      if (scenario.progressSequence && stage <= scenario.progressSequence.length) {
        return json(response, 200, { id: JOB_ID, status: "running", progress_percent: scenario.progressSequence[stage - 1] });
      }
      if (!scenario.progressSequence && stage === 1) return json(response, 200, { id: JOB_ID, status: "running", progress_percent: 47 });
        if (scenario.outcome === "model_load_failure" && submittedModel === "large-v3") {
          return json(response, 200, { id: JOB_ID, status: "failed", progress_percent: 100, error: "model_load_failed", error_message: "The requested Whisper model could not be loaded." });
        }
        if (scenario.outcome === "processing_failure") {
        return json(response, 200, { id: JOB_ID, status: "failed", progress_percent: 100, error: "internal_error", error_message: "Fixture processing failed" });
      }
      if (scenario.outcome === "expired") return json(response, 404, { error: { code: "not_found", message: "Job expired" } });
      return json(response, 200, { id: JOB_ID, status: "succeeded", progress_percent: 100 });
    }

    const resultMatch = pathname.match(/^\/jobs\/([a-f0-9]+)\/result$/);
    if (resultMatch && request.method === "GET") {
      if (scenario.kind === "unavailable") return respondUnavailable(response);
      if (!accepted || resultMatch[1] !== JOB_ID || (scenario.kind === "job" && scenario.outcome === "expired")) {
        return json(response, 404, { error: { code: "not_found", message: "Result expired" } });
      }
      if (scenario.kind !== "job" || scenario.outcome === "result_unavailable" || stage < finalStage(scenario)) {
        return json(response, 409, { error: { code: "result_unavailable", message: "Result not ready" } });
      }
      if (scenario.outcome === "processing_failure") {
        return json(response, 409, { error: { code: "result_unavailable", message: "Failed job has no result" } });
      }

      const format = new URL(request.url ?? "/", "http://127.0.0.1").searchParams.get("format");
      if (format === "txt") {
        response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8", "Content-Disposition": 'attachment; filename="transcript.txt"', "Cache-Control": "public, max-age=60", "X-Internal-Test": "must-not-cross-proxy" });
        return response.end(transcriptText(savedSegments));
      }
      if (format === "srt") {
        response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8", "Content-Disposition": 'attachment; filename="transcript.srt"', "Cache-Control": "public, max-age=60", "X-Internal-Test": "must-not-cross-proxy" });
        return response.end(srtText(savedSegments));
      }
      if (format === "original-json") {
        return jsonAttachment(response, "transcript-original.json", { duration_seconds: 28, segments: transcriptSegments, text: transcriptText(transcriptSegments) });
      }
      return jsonAttachment(response, "transcript.json", { duration_seconds: 28, segments: savedSegments, text: transcriptText(savedSegments) });
    }

    json(response, 404, { error: { code: "not_found", message: "Not found" } });
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("STT fixture did not bind to a TCP port");
  const origin = `http://127.0.0.1:${address.port}`;

  return {
    origin,
    reset(nextScenario) {
      scenario = nextScenario;
      stage = 0;
      accepted = false;
      submittedModel = null;
      savedSegments = transcriptSegments.map((segment) => ({ ...segment }));
      failNextTranscriptSave = nextScenario.kind === "job" && nextScenario.failTranscriptSaveOnce === true;
      pendingSubmission = null;
      observations.length = 0;
      transcriptSaveObservations.length = 0;
      uploadWaiters.length = 0;
    },
    advance() {
      stage = Math.min(stage + 1, finalStage(scenario));
    },
    releaseSubmission() {
      pendingSubmission?.();
      pendingSubmission = null;
    },
    uploads() {
      return observations.map((item) => ({ ...item, fieldNames: [...item.fieldNames] }));
    },
    saves() {
      return transcriptSaveObservations.map((item) => ({ ...item }));
    },
    async waitForUploadBytes() {
      if (observations.some(({ bytesReceived }) => bytesReceived > 0)) return;
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Timed out waiting for upload bytes at the STT fixture")), 5_000);
        uploadWaiters.push(() => {
          clearTimeout(timeout);
          resolve();
        });
      });
    },
    async close() {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    },
  };
}
