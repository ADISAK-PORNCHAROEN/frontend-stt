import { test, expect } from "./support/test";
import { silentWav } from "./support/media";

const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "desktop-minimum", width: 1280, height: 720 },
  { name: "mobile", width: 390, height: 844 },
] as const;

async function expectViewportContract(page: import("@playwright/test").Page): Promise<void> {
  const geometry = await page.evaluate(() => {
    const header = document.querySelector(".topbar");
    const footer = document.querySelector(".page-footer");
    const shell = document.querySelector(".site-shell");
    const intro = document.querySelector(".page-intro");
    const homeContent = document.querySelector(".home-screen") ?? document.querySelector(".workspace-content");
    return {
      documentWidth: document.documentElement.scrollWidth,
      documentHeight: document.documentElement.scrollHeight,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      shellLeft: shell?.getBoundingClientRect().left ?? -1,
      shellRight: shell?.getBoundingClientRect().right ?? -1,
      shellWidth: shell?.getBoundingClientRect().width ?? -1,
      headerTop: header?.getBoundingClientRect().top ?? -1,
      headerBottom: header?.getBoundingClientRect().bottom ?? -1,
      introTop: intro?.getBoundingClientRect().top ?? null,
      introBottom: intro?.getBoundingClientRect().bottom ?? null,
      homeContentBottom: homeContent?.getBoundingClientRect().bottom ?? null,
      footerTop: footer?.getBoundingClientRect().top ?? -1,
      footerBottom: footer?.getBoundingClientRect().bottom ?? -1,
      headerPosition: header ? getComputedStyle(header).position : "missing",
      footerPosition: footer ? getComputedStyle(footer).position : "missing",
    };
  });
  expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewportWidth + 1);
  expect(geometry.documentHeight).toBeLessThanOrEqual(geometry.viewportHeight + 1);
  expect(geometry.shellLeft).toBe(0);
  expect(Math.abs(geometry.shellRight - geometry.viewportWidth)).toBeLessThanOrEqual(1);
  expect(Math.abs(geometry.shellWidth - geometry.viewportWidth)).toBeLessThanOrEqual(1);
  expect(geometry.headerTop).toBe(0);
  expect(Math.abs(geometry.footerBottom - geometry.viewportHeight)).toBeLessThanOrEqual(1);
  if (geometry.introTop !== null) {
    expect(geometry.introTop).toBeGreaterThanOrEqual(geometry.headerBottom);
    expect(geometry.introBottom).toBeLessThan(geometry.footerTop);
    expect(geometry.homeContentBottom).not.toBeNull();
    expect(geometry.homeContentBottom).toBeLessThan(geometry.footerTop);
  }

  expect(geometry.headerPosition).toBe("sticky");
  expect(geometry.footerPosition).toBe("sticky");
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
  test(`captures the five passing workspace states at ${viewport.name} size`, async ({ page, app, stt }, testInfo) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    stt.reset({ kind: "ready" });
    await page.goto(app.origin);
    await expect(page.getByRole("heading", { name: /ฟังทุกช่วงเวลา.*อ่านทุกถ้อยคำ/ })).toBeVisible();
    await expectViewportContract(page);
    await attachStateScreenshot(page, testInfo, "start", viewport.name);

    stt.reset({ kind: "job", outcome: "success" });
    await page.locator('input[type="file"]').setInputFiles(silentWav({ durationSeconds: 1 }));
    const toolbar = page.locator(".selected-toolbar");
    await expect(toolbar).toBeVisible();
    await expect(toolbar.locator("#whisper-model")).toBeVisible();
    await expect(toolbar.getByRole("button", { name: "เริ่มถอดเสียง" })).toBeVisible();
    await expect(toolbar.locator("#file-help, .drop-footnote, .drop-size")).toHaveCount(0);
    const modelBox = await toolbar.locator(".model-field").boundingBox();
    const startBox = await toolbar.getByRole("button", { name: "เริ่มถอดเสียง" }).boundingBox();
    expect(modelBox).not.toBeNull();
    expect(startBox).not.toBeNull();
    expect(Math.abs(((modelBox?.y ?? 0) + (modelBox?.height ?? 0) / 2) - ((startBox?.y ?? 0) + (startBox?.height ?? 0) / 2))).toBeLessThan(12);
    if (viewport.name !== "mobile") {
      const controls = await Promise.all([
        toolbar.locator(".source-summary"),
        toolbar.locator(".file-drop"),
        toolbar.locator(".model-field"),
        toolbar.getByRole("button", { name: "เริ่มถอดเสียง" }),
      ].map(async (locator) => locator.boundingBox()));
      const centerYs = controls.map((box) => (box?.y ?? 0) + (box?.height ?? 0) / 2);
      expect(Math.max(...centerYs) - Math.min(...centerYs)).toBeLessThan(12);
    }
    await attachStateScreenshot(page, testInfo, "selected", viewport.name);
    await page.getByRole("button", { name: "เริ่มถอดเสียง" }).click();
    await expect(page.getByText("อยู่ในคิวถอดเสียง", { exact: true })).toBeVisible();
    stt.advance();
    await expect(page.getByText("กำลังถอดเสียง", { exact: true })).toBeVisible();
    await expectViewportContract(page);
    await attachStateScreenshot(page, testInfo, "processing", viewport.name);

    stt.advance();
    const transcript = page.locator(".transcript-panel");
    await expect(transcript).toBeVisible();
    const successStatus = transcript.getByText(/ฉบับล่าสุด · \d+ ช่วง/);
    await expect(successStatus).toBeVisible();
    const media = page.locator(".media-panel");
    const transcriptBox = await transcript.boundingBox();
    const mediaBox = await media.boundingBox();
    expect(transcriptBox).not.toBeNull();
    expect(mediaBox).not.toBeNull();
    if (viewport.name === "mobile") {
      expect((mediaBox?.y ?? 0) + (mediaBox?.height ?? 0)).toBeLessThanOrEqual(transcriptBox?.y ?? 0);
    } else {
      expect(Math.abs((transcriptBox?.y ?? 0) - (mediaBox?.y ?? 0))).toBeLessThan(2);
      expect((mediaBox?.x ?? 0) + (mediaBox?.width ?? 0)).toBeLessThanOrEqual(transcriptBox?.x ?? 0);
      expect(transcriptBox?.width ?? 0).toBeGreaterThan((mediaBox?.width ?? 0) * 1.3);
    }
    const transcriptList = transcript.locator(".transcript-list");
    expect(await transcriptList.evaluate((element) => getComputedStyle(element).overflowY)).toBe("auto");
    await transcriptList.evaluate((element) => { element.scrollTop = 180; });
    expect(await transcriptList.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    if (viewport.name === "desktop-minimum") {
      await transcriptList.evaluate((element) => { element.scrollTop = 180; });
      expect(await transcriptList.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
    }
    await expectViewportContract(page);
    await attachStateScreenshot(page, testInfo, "completed", viewport.name);

    let editor = page.getByRole("textbox", { name: /แก้ไขข้อความช่วงเวลา/ }).first();
    if (await editor.count() === 0) {
      await page.getByRole("button", { name: /แก้ไขข้อความช่วงเวลา/ }).first().click();
      editor = page.getByRole("textbox", { name: /แก้ไขข้อความช่วงเวลา/ }).first();
    }
    await editor.fill("ข้อความที่แก้ไขสำหรับภาพตรวจสอบ");
    await expect(transcript.locator(".unsaved-note")).toContainText("ยังไม่ได้บันทึก");
    await expectViewportContract(page);
    await attachStateScreenshot(page, testInfo, "editing", viewport.name);

    await page.locator(".media-panel label[for='media-file']").click();
    await page.locator('input[type="file"]').setInputFiles({
      name: "synthetic-video.mp4",
      mimeType: "video/mp4",
      buffer: Buffer.from([0, 0, 0, 0]),
    });
    await page.getByRole("dialog", { name: "ยืนยันการแทนที่ไฟล์" }).getByRole("button", { name: "แทนที่ไฟล์" }).click();
    const video = page.locator("video");
    await expect(video).toBeVisible();
    await expect(video).toHaveAttribute("controls", "");
    const videoBox = await video.boundingBox();
    expect(videoBox).not.toBeNull();
    expect(Math.abs((videoBox?.width ?? 0) / (videoBox?.height ?? 1) - 16 / 9)).toBeLessThan(0.02);
    await attachStateScreenshot(page, testInfo, "native-video-frame", viewport.name);
  });
}
