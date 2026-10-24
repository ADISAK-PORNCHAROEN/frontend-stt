import { proxyUpload } from "@/lib/stt-service/proxy";

export async function POST(request: Request): Promise<Response> {
  return proxyUpload(request);
}
