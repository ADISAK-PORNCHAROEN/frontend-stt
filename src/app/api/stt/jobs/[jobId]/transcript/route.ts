import { isValidJobId, proxyTranscriptUpdate } from "@/lib/stt-service/proxy";

type RouteContext = { params: Promise<{ jobId: string }> };

export async function PUT(request: Request, { params }: RouteContext): Promise<Response> {
  const { jobId } = await params;
  if (!isValidJobId(jobId)) {
    return Response.json(
      { error: { code: "not_found", message: "Job not found" } },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  return proxyTranscriptUpdate(request, jobId);
}
