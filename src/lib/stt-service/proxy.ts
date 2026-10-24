import "server-only";

const MAX_UPLOAD_BYTES = 1024 ** 3;
const MULTIPART_OVERHEAD_BYTES = 64 * 1024;

type ProxyOptions = {
  method: "GET" | "POST";
  body?: ReadableStream<Uint8Array>;
  headers?: HeadersInit;
  didExceedLimit?: () => boolean;
};

function errorResponse(status: number, code: string, message: string): Response {
  return Response.json(
    { error: { code, message }, detail: message },
    {
      status,
      headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
    },
  );
}

function getServiceBaseUrl(): URL {
  const configuredUrl = process.env.STT_SERVICE_URL ?? "http://127.0.0.1:8000";
  let url: URL;

  try {
    url = new URL(configuredUrl);
  } catch {
    throw new Error("STT_SERVICE_URL must be a valid local HTTP URL");
  }

  if (
    url.protocol !== "http:" ||
    !["127.0.0.1", "localhost"].includes(url.hostname) ||
    url.username !== "" ||
    url.password !== "" ||
    url.pathname !== "/" ||
    url.search !== "" ||
    url.hash !== ""
  ) {
    throw new Error("STT_SERVICE_URL must point to localhost over HTTP");
  }

  return url;
}

function boundedBody(
  body: ReadableStream<Uint8Array>,
  maxBytes: number,
  onLimit: () => void,
): ReadableStream<Uint8Array> {
  let receivedBytes = 0;

  return body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        receivedBytes += chunk.byteLength;
        if (receivedBytes > maxBytes) {
          onLimit();
          controller.error(new RangeError("The uploaded request is too large"));
          return;
        }
        controller.enqueue(chunk);
      },
    }),
  );
}

function safeResponse(upstream: Response): Response {
  const headers = new Headers({
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  const contentType = upstream.headers.get("content-type");
  const contentDisposition = upstream.headers.get("content-disposition");

  if (contentType) headers.set("Content-Type", contentType);
  if (contentDisposition) headers.set("Content-Disposition", contentDisposition);

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}

export async function proxyToService(path: string, options: ProxyOptions): Promise<Response> {
  try {
    const baseUrl = getServiceBaseUrl();
    const targetUrl = new URL(path, baseUrl);
    if (targetUrl.origin !== baseUrl.origin) {
      return errorResponse(400, "invalid_upstream_path", "Invalid service path");
    }

    const init: RequestInit & { duplex?: "half" } = {
      method: options.method,
      headers: options.headers,
      body: options.body,
      cache: "no-store",
      redirect: "error",
    };
    if (options.body) init.duplex = "half";

    return safeResponse(await fetch(targetUrl, init));
  } catch (error) {
    if (error instanceof RangeError || options.didExceedLimit?.()) {
      return errorResponse(413, "file_too_large", "Upload exceeds the 1 GiB limit");
    }
    if (error instanceof TypeError || error instanceof Error) {
      return errorResponse(503, "service_unavailable", "The local transcription service is unavailable");
    }
    return errorResponse(503, "service_unavailable", "The local transcription service is unavailable");
  }
}

export async function proxyUpload(request: Request): Promise<Response> {
  const requestOrigin = request.headers.get("origin");
  const expectedOrigin = new URL(request.url).origin;
  if (!requestOrigin || requestOrigin !== expectedOrigin) {
    return errorResponse(403, "forbidden_origin", "Cross-origin requests are not allowed");
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data;")) {
    return errorResponse(400, "invalid_request", "A multipart file upload is required");
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    const length = Number(contentLength);
    if (!Number.isSafeInteger(length) || length < 0) {
      return errorResponse(400, "invalid_request", "Invalid upload length");
    }
    if (length > MAX_UPLOAD_BYTES + MULTIPART_OVERHEAD_BYTES) {
      return errorResponse(413, "file_too_large", "Upload exceeds the 1 GiB limit");
    }
  }

  if (!request.body) {
    return errorResponse(400, "invalid_request", "The uploaded file is missing");
  }

  const headers = new Headers({ "Content-Type": contentType });
  if (contentLength !== null) headers.set("Content-Length", contentLength);

  let exceededLimit = false;
  return proxyToService("/jobs", {
    method: "POST",
    body: boundedBody(request.body, MAX_UPLOAD_BYTES + MULTIPART_OVERHEAD_BYTES, () => { exceededLimit = true; }),
    headers,
    didExceedLimit: () => exceededLimit,
  });
}

export function proxyHealth(): Promise<Response> {
  return proxyToService("/health", { method: "GET" });
}

export function proxyJobStatus(jobId: string): Promise<Response> {
  return proxyToService(`/jobs/${jobId}`, { method: "GET" });
}

export function proxyJobResult(jobId: string, format: "json" | "txt" | "srt"): Promise<Response> {
  return proxyToService(`/jobs/${jobId}/result?format=${format}`, { method: "GET" });
}

export function isValidJobId(value: string): boolean {
  return /^[a-f0-9]{32}$/.test(value);
}
