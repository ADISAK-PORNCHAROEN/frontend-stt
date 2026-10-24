import { isValidJobId, proxyJobResult } from "@/lib/stt-service/proxy";

type RouteContext = { params: Promise<{ jobId: string }> };

export async function GET(request: Request, { params }: RouteContext): Promise<Response> {
  const { jobId } = await params;
  if (!isValidJobId(jobId)) {
    return Response.json(
      { error: { code: "not_found", message: "Job not found" } },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  const format = new URL(request.url).searchParams.get("format");
  if (format !== "json" && format !== "txt" && format !== "srt") {
    return Response.json(
      { error: { code: "invalid_request", message: "Unsupported result format" } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  return proxyJobResult(jobId, format);
}
