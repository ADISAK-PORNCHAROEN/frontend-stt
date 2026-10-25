import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import path from "node:path";

const PROJECT_ROOT = process.cwd();
const NEXT_CLI = path.join(PROJECT_ROOT, "node_modules", "next", "dist", "bin", "next");
const STARTUP_TIMEOUT_MS = 90_000;
const PROCESS_TIMEOUT_MS = 5_000;

export type TestApp = {
  origin: string;
  close(): Promise<void>;
};

async function unusedLoopbackPort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Could not allocate a loopback port");
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return address.port;
}

function attachOutput(child: ChildProcess): () => string {
  let output = "";
  const keepLast = (chunk: Buffer | string) => {
    output = `${output}${chunk.toString()}`.slice(-8_000);
  };
  child.stdout?.on("data", keepLast);
  child.stderr?.on("data", keepLast);
  return () => output;
}

function waitForExit(child: ChildProcess): Promise<{ code: number | null; signal: NodeJS.Signals | null }> {
  return new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => resolve({ code, signal }));
  });
}

async function stop(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const exited = waitForExit(child);
  child.kill();
  await Promise.race([
    exited.then(() => undefined),
    new Promise<void>((resolve) => setTimeout(resolve, PROCESS_TIMEOUT_MS)),
  ]);
}

export async function startTestApp(sttOrigin: string): Promise<TestApp> {
  const serviceUrl = new URL(sttOrigin);
  if (serviceUrl.protocol !== "http:" || serviceUrl.hostname !== "127.0.0.1" || serviceUrl.port === "") {
    throw new Error("Test app must use the owned ephemeral loopback STT fixture");
  }

  const childEnv = {
    ...process.env,
    FRONTEND_STT_TEST_BUILD: "1",
    STT_SERVICE_URL: sttOrigin,
    NEXT_TELEMETRY_DISABLED: "1",
  };
  const build = spawn(process.execPath, [NEXT_CLI, "build"], {
    cwd: PROJECT_ROOT,
    env: childEnv,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const buildOutput = attachOutput(build);
  try {
    const result = await waitForExit(build);
    if (result.code !== 0) throw new Error(`Isolated Next.js build exited ${result.code ?? result.signal}:\n${buildOutput()}`);
  } catch (error) {
    await stop(build);
    throw error;
  }

  const port = await unusedLoopbackPort();
  const origin = `http://127.0.0.1:${port}`;
  const server = spawn(process.execPath, [NEXT_CLI, "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: PROJECT_ROOT,
    env: childEnv,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const serverOutput = attachOutput(server);
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;

  try {
    while (Date.now() < deadline) {
      if (server.exitCode !== null) throw new Error(`Next.js test server exited ${server.exitCode}:\n${serverOutput()}`);
      try {
        const response = await fetch(`${origin}/api/stt/health`, { signal: AbortSignal.timeout(750) });
        if (response.status === 200 || response.status === 503) return { origin, close: () => stop(server) };
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
    throw new Error(`Timed out starting the isolated Next.js server:\n${serverOutput()}`);
  } catch (error) {
    await stop(server);
    throw error;
  }
}
