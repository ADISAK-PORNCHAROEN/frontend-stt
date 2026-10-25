import { test, expect } from "./support/test";
import { silentWav } from "./support/media";

const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "desktop-minimum", width: 1280, height: 720 },
  { name: "mobile", width: 390, height: 844 },
] as const;

async function expectViewportContract(page: import("@playwright/test").Page, viewport: typeof viewports[number]): Promise<void> {
  const geometry = await page.evaluate(() => {
    const header = document.querySelector(".topbar");
    const footer = document.querySelector(".page-footer");
    const intro = document.querySelector(".page-intro");
    return {
      documentWidth: document.documentElement.scrollWidth,
      documentHeight: document.documentElement.scrollHeight,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      headerTop: header?.getBoundingClientRect().top ?? -1,
      headerBottom: header?.getBoundingClientRect().bottom ?? -1,
      introTop: intro?.getBoundingClientRect().top ?? null,
      footerBottom: footer?.getBoundingClientRect().bottom ?? -1,
      headerPosition: header ? getComputedStyle(header).position : "missing",
      footerPosition: footer ? getComputedStyle(footer).position : "missing",
    };
  });
  expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewportWidth + 1);
  if (geometry.introTop !== null) {
    expect(geometry.introTop).toBeGreaterThanOrEqual(geometry.headerBottom);
    expect(geometry.introTop - geometry.headerBottom).toBeLessThanOrEqual(viewport.name === "mobile" ? 24 : 36);
  }

  if (viewport.name === "mobile") {
    expect(geometry.headerPosition).toBe("static");
    expect(geometry.footerPosition).toBe("static");
  } else {
    expect(geometry.documentHeight).toBeLessThanOrEqual(geometry.viewportHeight + 1);
    expect(geometry.headerTop).toBe(0);
    expect(Math.abs(geometry.footerBottom - geometry.viewportHeight)).toBeLessThanOrEqual(1);
  }
}

async function attachStateScreenshot(
  page: import("@playwright/test").Page,
  testInfo: import("@playwright/test").TestInfo,
  state: string,
  viewport: string,
): Promise<void> {
  await testInfo.attach(`${state}-${viewport}`, {
    body: await page.screenshot({ fullPage: true, animations: "disabled" }),
    contentType: "image/png",
  });
}

for (const viewport of viewports) {
  test(`captures the four passing workspace states at ${viewport.name} size`, async ({ page, app, stt }, testInfo) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    stt.reset({ kind: "ready" });
    await page.goto(app.origin);
    await expect(page.getByRole("heading", { name: /ฟังทุกช่วงเวลา/ })).toBeVisible();
    await expectViewportContract(page, viewport);
    await attachStateScreenshot(page, testInfo, "start", viewport.name);

    stt.reset({ kind: "job", outcome: "success" });
    await page.locator('input[type="file"]').setInputFiles(silentWav({ durationSeconds: 1 }));
    await page.getByRole("button", { name: "เริ่มถอดเสียง" }).click();
    await expect(page.getByText("อยู่ในคิวถอดเสียง", { exact: true })).toBeVisible();
    stt.advance();
    await expect(page.getByText("กำลังถอดเสียง", { exact: true })).toBeVisible();
    await expectViewportContract(page, viewport);
    await attachStateScreenshot(page, testInfo, "processing", viewport.name);

    stt.advance();
    const transcript = page.getByRole("region", { name: "บทถอดเสียง" });
    await expect(transcript).toBeVisible();
    const transcriptList = transcript.locator(".transcript-list");
    if (viewport.name === "mobile") {
      expect(await transcriptList.evaluate((element) => getComputedStyle(element).overflowY)).toBe("visible");
      expect(await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight)).toBe(true);
    } else {
      expect(await transcriptList.evaluate((element) => getComputedStyle(element).overflowY)).toBe("auto");
    }
    if (viewport.name === "desktop-minimum") {
      await transcriptList.evaluate((element) => { element.scrollTop = 180; });
      expect(await transcriptList.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
    }
    await expectViewportContract(page, viewport);
    await attachStateScreenshot(page, testInfo, "completed", viewport.name);

    let editor = page.getByRole("textbox", { name: /แก้ไขข้อความช่วงเวลา/ }).first();
    if (await editor.count() === 0) {
      await page.getByRole("button", { name: /แก้ไขข้อความช่วงเวลา/ }).first().click();
      editor = page.getByRole("textbox", { name: /แก้ไขข้อความช่วงเวลา/ }).first();
    }
    await editor.fill("ข้อความที่แก้ไขสำหรับภาพตรวจสอบ");
    await expect(transcript.getByRole("status")).toContainText("ยังไม่ได้บันทึก");
    await expectViewportContract(page, viewport);
    await attachStateScreenshot(page, testInfo, "editing", viewport.name);

    await page.getByRole("button", { name: "เลือกไฟล์ใหม่" }).click();
    await page.locator('input[type="file"]').setInputFiles({
      name: "synthetic-video.mp4",
      mimeType: "video/mp4",
      buffer: Buffer.from([0, 0, 0, 0]),
    });
    const video = page.locator("video");
    await expect(video).toBeVisible();
    await expect(video).toHaveAttribute("controls", "");
    const videoBox = await video.boundingBox();
    expect(videoBox).not.toBeNull();
    expect(Math.abs((videoBox?.width ?? 0) / (videoBox?.height ?? 1) - 16 / 9)).toBeLessThan(0.02);
    await attachStateScreenshot(page, testInfo, "native-video-frame", viewport.name);
  });
}
