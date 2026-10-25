import { test, expect } from "./support/test";
import { silentWav } from "./support/media";

const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
] as const;

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
    await attachStateScreenshot(page, testInfo, "start", viewport.name);

    stt.reset({ kind: "job", outcome: "success" });
    await page.locator('input[type="file"]').setInputFiles(silentWav({ durationSeconds: 1 }));
    await page.getByRole("button", { name: "เริ่มถอดเสียง" }).click();
    await expect(page.getByText("อยู่ในคิวถอดเสียง", { exact: true })).toBeVisible();
    stt.advance();
    await expect(page.getByText("กำลังถอดเสียง", { exact: true })).toBeVisible();
    await attachStateScreenshot(page, testInfo, "processing", viewport.name);

    stt.advance();
    const transcript = page.getByRole("region", { name: "บทถอดเสียง" });
    await expect(transcript).toBeVisible();
    await attachStateScreenshot(page, testInfo, "completed", viewport.name);

    let editor = page.getByRole("textbox", { name: /แก้ไขข้อความช่วงเวลา/ }).first();
    if (await editor.count() === 0) {
      await page.getByRole("button", { name: /แก้ไขข้อความช่วงเวลา/ }).first().click();
      editor = page.getByRole("textbox", { name: /แก้ไขข้อความช่วงเวลา/ }).first();
    }
    await editor.fill("ข้อความที่แก้ไขสำหรับภาพตรวจสอบ");
    await expect(transcript.getByRole("status")).toContainText("ยังไม่ได้บันทึก");
    await attachStateScreenshot(page, testInfo, "editing", viewport.name);
  });
}
