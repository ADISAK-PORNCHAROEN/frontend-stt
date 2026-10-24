import { proxyHealth } from "@/lib/stt-service/proxy";

export async function GET(): Promise<Response> {
  return proxyHealth();
}
