import { test as base, expect } from "@playwright/test";
import { startTestApp, type TestApp } from "./test-app";
import { startSttFixture, type SttFixture } from "./stt-fixture";

type WorkerFixtures = {
  stt: SttFixture;
  app: TestApp;
};

export const test = base.extend<object, WorkerFixtures>({
  stt: [async ({}, provide) => {
    const stt = await startSttFixture();
    try {
      await provide(stt);
    } finally {
      await stt.close();
    }
  }, { scope: "worker" }],
  app: [async ({ stt }, provide) => {
    const app = await startTestApp(stt.origin);
    try {
      await provide(app);
    } finally {
      await app.close();
    }
  }, { scope: "worker" }],
});

export { expect };
