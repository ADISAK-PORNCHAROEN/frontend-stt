import { readFile } from "node:fs/promises";
import type { Page } from "@playwright/test";
import { test, expect } from "./support/test";
import { silentWav } from "./support/media";

type ExportFormat = "json" | "txt" | "srt";

async function downloadSelectedTranscript(page: Page, format: ExportFormat) {
  await page.getByRole("button", { name: "ตัวอย่างและส่งออก" }).click();
  await page.getByRole("combobox", { name: "รูปแบบตัวอย่าง" }).selectOption(format);
  const preview = await page.getByTestId("transcript-export-preview").textContent() ?? "";
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: `ดาวน์โหลด ${format.toUpperCase()}` }).click();
  const download = await downloadPromise;
  const filePath = await download.path();
  if (!filePath) throw new Error(`${format.toUpperCase()} download did not create a file`);
  const fileText = await readFile(filePath, "utf8");
  await page.getByRole("button", { name: "ปิดตัวอย่าง" }).click();
  return { download, preview, fileText };
}

async function downloadOpenPreview(page: Page, format: ExportFormat) {
  const preview = await page.getByTestId("transcript-export-preview").textContent() ?? "";
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: `ดาวน์โหลด ${format.toUpperCase()}` }).click();
  const download = await downloadPromise;
  const filePath = await download.path();
  if (!filePath) throw new Error(`${format.toUpperCase()} download did not create a file`);
  return { download, preview, fileText: await readFile(filePath, "utf8") };
}

test("#2 accepts a local WAV through keyboard browsing, focuses the start action, and keeps file details usable on desktop and mobile", async ({ page, app, stt }, testInfo) => {
  stt.reset({ kind: "ready" });
  const media = silentWav();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(app.origin);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Time Atlas หน้าแรก" })).toBeFocused();
  await page.keyboard.press("Tab");
  const input = page.locator('input[type="file"]');
  await expect(input).toBeFocused();
  expect(await page.locator(".file-drop").evaluate((element) => getComputedStyle(element).outlineStyle)).toBe("solid");
  const chooserPromise = page.waitForEvent("filechooser");
  await page.keyboard.press("Enter");
  await (await chooserPromise).setFiles(media);

  const sourcePanel = page.locator(".source-panel");
  await expect(sourcePanel).toContainText("sample.wav");
  await expect(sourcePanel).toContainText("audio/wav");
  await expect(page.locator("audio")).toBeVisible();
  await expect(page.locator(".player-meta")).toContainText("ความยาว 00:28");
  const startButton = page.getByRole("button", { name: "เริ่มถอดเสียง" });
  await expect(startButton).toBeEnabled();
  await expect(startButton).toBeFocused();

  await page.screenshot({ path: testInfo.outputPath("issue-2-selected-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await expect(page.getByRole("button", { name: "เริ่มถอดเสียง" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("issue-2-selected-mobile.png"), fullPage: true });
});

test("#2 accepts a local WAV dropped into the file area", async ({ page, app, stt }) => {
  stt.reset({ kind: "ready" });
  await page.goto(app.origin);
  const media = silentWav({ durationSeconds: 1 });
  const data = media.buffer.toString("base64");
  await page.locator(".file-drop").evaluate((target, encoded) => {
    const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
    const transfer = new DataTransfer();
    transfer.items.add(new File([bytes], "dropped.wav", { type: "audio/wav" }));
    target.dispatchEvent(new DragEvent("dragenter", { bubbles: true, cancelable: true, dataTransfer: transfer }));
    target.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
  }, data);

  await expect(page.locator(".source-panel")).toContainText("dropped.wav");
  await expect(page.locator(".source-panel")).toContainText("audio/wav");
  await expect(page.locator("audio")).toBeVisible();
});

test("#2 shows a clear unavailable state, keeps start disabled, and enables it after readiness is rechecked", async ({ page, app, stt }) => {
  stt.reset({ kind: "unavailable" });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(app.origin);
  await expect(page.getByRole("status").filter({ hasText: "STT service ยังไม่พร้อม" })).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles(silentWav());
  await expect(page.getByRole("button", { name: "เริ่มถอดเสียง" })).toBeDisabled();
  await expect(page.locator(".page-footer").getByText(/คิวรอ 10 งาน/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);

  stt.reset({ kind: "ready" });
  await page.getByRole("button", { name: "ตรวจอีกครั้ง" }).click();
  await expect(page.getByRole("button", { name: "เริ่มถอดเสียง" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "เริ่มถอดเสียง" })).toBeEnabled();
});

test("#9 selects the configured Whisper model, supports keyboard changes, and recovers from a model-load failure", async ({ page, app, stt }, testInfo) => {
  stt.reset({ kind: "job", outcome: "model_load_failure", defaultModel: "large-v3" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(app.origin);
  await page.locator('input[type="file"]').setInputFiles(silentWav({ durationSeconds: 1 }));

  const model = page.getByRole("combobox", { name: "โมเดลถอดเสียง" });
  await expect(model).toHaveValue("large-v3");
  await expect(model.locator("option")).toHaveText(["Turbo", "large-v3"]);
  await expect(page.getByRole("button", { name: "เริ่มถอดเสียง" })).toBeFocused();
  await page.screenshot({ path: testInfo.outputPath("issue-9-model-desktop.png"), fullPage: true });

  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await expect(model).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("issue-9-model-mobile.png"), fullPage: true });

  await page.keyboard.press("Shift+Tab");
  await expect(model).toBeFocused();
  await page.keyboard.press("Home");
  await expect(model).toHaveValue("turbo");
  await page.keyboard.press("End");
  await expect(model).toHaveValue("large-v3");
  const startButton = page.getByRole("button", { name: "เริ่มถอดเสียง" });
  await page.keyboard.press("Tab");
  await expect(startButton).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByText("อยู่ในคิวถอดเสียง", { exact: true })).toBeVisible();
  stt.advance();
  await expect(page.getByText("กำลังถอดเสียง", { exact: true })).toBeVisible();
  stt.advance();
  await expect(page.locator(".failed-panel")).toContainText("โมเดลที่เลือกโหลดไม่สำเร็จ");

  await page.getByRole("button", { name: "ลองส่งไฟล์นี้อีกครั้ง" }).click();
  await expect(model).toBeVisible();
  await model.selectOption("turbo");
  await expect(model).toHaveValue("turbo");
  await page.getByRole("button", { name: "เริ่มถอดเสียง" }).click();
  await expect(page.getByText("อยู่ในคิวถอดเสียง", { exact: true })).toBeVisible();
  await expect.poll(() => stt.uploads().map((upload) => upload.model)).toEqual(["large-v3", "turbo"]);
  stt.advance();
  await expect(page.getByText("กำลังถอดเสียง", { exact: true })).toBeVisible();
  stt.advance();
  await expect(page.getByRole("heading", { name: "ฉบับล่าสุดที่ตรวจแล้ว" })).toBeVisible();
});

test("#2 rejects unsupported, oversized, and overlong media with Thai guidance", async ({ page, app, stt }) => {
  stt.reset({ kind: "ready" });
  await page.goto(app.origin);
  const input = page.locator('input[type="file"]');
  await input.setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("not media") });
  await expect(page.getByRole("status").filter({ hasText: "รูปแบบไฟล์นี้ยังไม่รองรับ" })).toBeVisible();

  await input.evaluate((element) => {
    const file = new File(["small"], "large.wav", { type: "audio/wav" });
    Object.defineProperty(file, "size", { configurable: true, value: 1024 ** 3 + 1 });
    const transfer = new DataTransfer();
    transfer.items.add(file);
    if (!(element instanceof HTMLInputElement)) throw new Error("Media input was not found");
    const picker = element;
    picker.files = transfer.files;
    picker.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(page.getByRole("status").filter({ hasText: "เกิน 1 GiB" })).toBeVisible();

  await input.setInputFiles(silentWav());
  const audio = page.locator("audio");
  await expect(audio).toBeVisible();
  await audio.evaluate((element) => {
    Object.defineProperty(element, "duration", { configurable: true, value: 7_201 });
    element.dispatchEvent(new Event("loadedmetadata", { bubbles: true }));
  });
  await expect(page.getByRole("status").filter({ hasText: "ยาวเกิน 2 ชั่วโมง" })).toBeVisible();
  await expect(page.getByRole("button", { name: "เริ่มถอดเสียง" })).toBeDisabled();
});

test("#3 shows upload and job progress, discloses retention, and renders a result only after reported success", async ({ page, app, stt }, testInfo) => {
  stt.reset({ kind: "job", outcome: "success", holdSubmission: true });
  await page.goto(app.origin);
  await page.locator('input[type="file"]').setInputFiles(silentWav());
  await page.getByRole("button", { name: "เริ่มถอดเสียง" }).click();
  await expect(page.getByText("กำลังส่งไฟล์", { exact: true })).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "ความคืบหน้าการส่งไฟล์" })).toBeVisible();
  await expect(page.locator(".retention-note")).toContainText("งานสำเร็จ");
  await expect(page.locator(".retention-note")).toContainText("24 ชั่วโมง");
  await expect(page.locator(".retention-note")).toContainText("7 วัน");
  await expect(page.locator(".retention-note")).toContainText("งานล้มเหลว");
  await expect(page.getByRole("heading", { name: "บทถอดเสียง" })).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("issue-3-uploading-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("issue-3-uploading-mobile.png"), fullPage: true });
  await stt.waitForUploadBytes();
  expect(stt.uploads()[0].complete).toBe(true);

  stt.releaseSubmission();
  await expect(page.getByText("อยู่ในคิวถอดเสียง", { exact: true })).toBeVisible();
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "บทถอดเสียง" })).toHaveCount(0);
  stt.advance();
  await expect(page.getByText("กำลังถอดเสียง", { exact: true })).toBeVisible();
  await expect(page.getByText("47%", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "บทถอดเสียง" })).toHaveCount(0);
  stt.advance();
  await expect(page.getByRole("heading", { name: "ฉบับล่าสุดที่ตรวจแล้ว" })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: /ฉบับล่าสุด ·/ })).toBeVisible();
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
});

test("#20 estimates remaining time only from advancing progress for the active job, then hides it when progress stalls", async ({ page, app, stt }, testInfo) => {
  stt.reset({ kind: "job", outcome: "success", progressSequence: [20, 40, 60] });
  await page.goto(app.origin);
  await page.locator('input[type="file"]').setInputFiles(silentWav({ durationSeconds: 1 }));
  await page.getByRole("button", { name: "เริ่มถอดเสียง" }).click();

  const estimate = page.getByTestId("remaining-time-estimate");
  await expect(page.getByText("อยู่ในคิวถอดเสียง", { exact: true })).toBeVisible();
  await expect(estimate).toHaveCount(0);

  stt.advance();
  await expect(page.getByText("20%", { exact: true })).toBeVisible();
  await expect(estimate).toHaveCount(0);

  stt.advance();
  await expect(page.getByText("40%", { exact: true })).toBeVisible();
  await expect(estimate).toBeVisible();
  await expect(estimate).toContainText("เวลาที่เหลือโดยประมาณ");
  await expect(estimate).toContainText("คำนวณจากความคืบหน้าของงานนี้");
  await expect(page.getByRole("status", { name: /เวลาที่เหลือโดยประมาณ.*คำนวณจากความคืบหน้าของงานนี้/ })).toBeVisible();
  await estimate.focus();
  await expect(estimate).toBeFocused();
  await page.screenshot({ path: testInfo.outputPath("issue-20-eta-desktop.png"), fullPage: true });

  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await expect(estimate).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("issue-20-eta-mobile.png"), fullPage: true });

  await expect(estimate).toHaveCount(0, { timeout: 7_000 });
});

test("#21 confirms media replacement and clearing without losing the current job when cancelled", async ({ page, app, stt }, testInfo) => {
  for (const viewport of [
    { name: "desktop", width: 1440, height: 1000 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    stt.reset({ kind: "job", outcome: "success" });
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(app.origin);

    const originalName = `original-${viewport.name}.wav`;
    await page.locator('input[type="file"]').setInputFiles({ name: originalName, mimeType: "audio/wav", buffer: silentWav({ durationSeconds: 1 }).buffer });
    await page.getByRole("button", { name: "เริ่มถอดเสียง" }).click();
    await expect(page.getByText("อยู่ในคิวถอดเสียง", { exact: true })).toBeVisible();
    stt.advance();
    await expect(page.getByText("กำลังถอดเสียง", { exact: true })).toBeVisible();
    stt.advance();
    await expect(page.getByRole("heading", { name: "ฉบับล่าสุดที่ตรวจแล้ว" })).toBeVisible();

    const originalMedia = page.locator("audio");
    const originalSource = await originalMedia.getAttribute("src");
    const candidateName = `replacement-${viewport.name}.wav`;
    const candidate = { name: candidateName, mimeType: "audio/wav", buffer: silentWav({ durationSeconds: 1 }).buffer };
    const filePicker = page.locator('input[type="file"]');
    await filePicker.focus();
    await filePicker.setInputFiles(candidate);
    const replacementDialog = page.getByRole("dialog", { name: "ยืนยันการแทนที่ไฟล์" });
    await expect(replacementDialog).toBeVisible();
    await expect(replacementDialog).toContainText(candidateName);
    await expect(replacementDialog.getByRole("button", { name: "ยกเลิก" })).toBeFocused();
    await page.screenshot({ path: testInfo.outputPath(`issue-21-replacement-${viewport.name}.png`), fullPage: true });

    if (viewport.name === "desktop") {
      await page.keyboard.press("Escape");
    } else {
      await replacementDialog.getByRole("button", { name: "ยกเลิก" }).click();
    }
    await expect(replacementDialog).toHaveCount(0);
    await expect(filePicker).toBeFocused();
    await expect(page.getByRole("heading", { name: "ฉบับล่าสุดที่ตรวจแล้ว" })).toBeVisible();
    await expect(originalMedia).toHaveAttribute("src", originalSource ?? "");

    await page.locator('input[type="file"]').setInputFiles(candidate);
    await page.getByRole("dialog", { name: "ยืนยันการแทนที่ไฟล์" }).getByRole("button", { name: "แทนที่ไฟล์" }).click();
    await expect(page.getByRole("heading", { name: "ตรวจไฟล์ก่อนเริ่ม" })).toBeVisible();
    await expect(page.getByRole("button", { name: "เริ่มถอดเสียง" })).toBeFocused();
    await expect(page.locator(".source-panel")).toContainText(candidateName);
    await expect(page.getByRole("heading", { name: "ฉบับล่าสุดที่ตรวจแล้ว" })).toHaveCount(0);

    const clearButton = page.getByRole("button", { name: "ล้างไฟล์" });
    await clearButton.click();
    const clearDialog = page.getByRole("dialog", { name: "ยืนยันการล้างไฟล์" });
    await expect(clearDialog).toBeVisible();
    if (viewport.name === "desktop") {
      await clearDialog.getByRole("button", { name: "ยกเลิก" }).click();
    } else {
      await page.keyboard.press("Escape");
    }
    await expect(clearDialog).toHaveCount(0);
    await expect(clearButton).toBeFocused();
    await expect(page.locator(".source-panel")).toContainText(candidateName);

    await page.getByRole("button", { name: "ล้างไฟล์" }).click();
    await page.getByRole("dialog", { name: "ยืนยันการล้างไฟล์" }).getByRole("button", { name: "ล้างไฟล์" }).click();
    const homeHeading = page.getByRole("heading", { name: /ฟังทุกช่วงเวลา.*อ่านทุกถ้อยคำ/ });
    await expect(homeHeading).toBeVisible();
    await expect(homeHeading).toBeFocused();
    await expect(page.locator("audio")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  }
});

test("#3 warns before leaving an active job and does not restore tracking after reload", async ({ page, app, stt }) => {
  stt.reset({ kind: "job", outcome: "success" });
  await page.goto(app.origin);
  await page.locator('input[type="file"]').setInputFiles(silentWav({ durationSeconds: 1 }));
  await page.getByRole("button", { name: "เริ่มถอดเสียง" }).click();
  await expect(page.getByText("อยู่ในคิวถอดเสียง", { exact: true })).toBeVisible();

  let beforeUnloadSeen = false;
  page.once("dialog", async (dialog) => {
    beforeUnloadSeen = dialog.type() === "beforeunload";
    await dialog.accept();
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  expect(beforeUnloadSeen).toBe(true);
  await expect(page.locator(".file-drop")).toBeVisible();
  await expect(page.locator(".media-panel")).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
});

test("#3 gives Thai recovery for service, queue, invalid-media, expired-job, and processing failures", async ({ page, app, stt }) => {
  stt.reset({ kind: "ready" });
  await page.goto(app.origin);
  const choose = async () => page.locator('input[type="file"]').setInputFiles(silentWav({ durationSeconds: 1 }));
  const clear = async () => {
    const removeButton = page.getByRole("button", { name: "ล้างไฟล์" });
    if (await removeButton.count()) {
      await removeButton.click();
      const confirmDialog = page.getByRole("dialog", { name: "ยืนยันการล้างไฟล์" });
      if (await confirmDialog.count()) await confirmDialog.getByRole("button", { name: "ล้างไฟล์" }).click();
    }
    else await page.getByRole("button", { name: "เลือกไฟล์ใหม่" }).click();
  };

  await choose();
  await expect(page.getByRole("button", { name: "เริ่มถอดเสียง" })).toBeEnabled();
  stt.reset({ kind: "unavailable" });
  await page.getByRole("button", { name: "เริ่มถอดเสียง" }).click();
  await expect(page.locator(".readiness-panel [role=alert]")).toContainText("เชื่อมต่อ STT service ไม่ได้");
  await clear();

  stt.reset({ kind: "ready" });
  await page.getByRole("button", { name: "ตรวจอีกครั้ง" }).click();
  await choose();
  await expect(page.getByRole("button", { name: "เริ่มถอดเสียง" })).toBeEnabled();
  await clear();

  stt.reset({ kind: "reject", code: "queue_full" });
  await choose();
  await page.getByRole("button", { name: "เริ่มถอดเสียง" }).click();
  await expect(page.locator(".readiness-panel [role=alert]")).toContainText("คิวถอดเสียงเต็ม");
  await clear();

  stt.reset({ kind: "reject", code: "invalid_input" });
  await choose();
  await page.getByRole("button", { name: "เริ่มถอดเสียง" }).click();
  await expect(page.locator(".readiness-panel [role=alert]")).toContainText("ไม่มีเสียงที่ใช้งานได้");
  await clear();

  stt.reset({ kind: "job", outcome: "expired" });
  await choose();
  await page.getByRole("button", { name: "เริ่มถอดเสียง" }).click();
  await expect(page.getByText("อยู่ในคิวถอดเสียง", { exact: true })).toBeVisible();
  stt.advance();
  await expect(page.locator(".failed-panel")).toContainText("ไม่พบงานนี้หรือข้อมูลหมดอายุแล้ว");
  await expect(page.getByRole("button", { name: "ลองส่งไฟล์นี้อีกครั้ง" })).toBeVisible();
  await clear();

  stt.reset({ kind: "job", outcome: "processing_failure" });
  await choose();
  await page.getByRole("button", { name: "เริ่มถอดเสียง" }).click();
  await expect(page.getByText("อยู่ในคิวถอดเสียง", { exact: true })).toBeVisible();
  stt.advance();
  await expect(page.getByText("กำลังถอดเสียง", { exact: true })).toBeVisible();
  stt.advance();
  await expect(page.locator(".failed-panel")).toContainText("เกิดข้อผิดพลาดระหว่างถอดเสียง");
  await expect(page.getByRole("button", { name: "ลองส่งไฟล์นี้อีกครั้ง" })).toBeVisible();
});

test("#4 reviews, seeks, follows, and exports the transcript on desktop and mobile", async ({ page, app, stt }, testInfo) => {
  stt.reset({ kind: "job", outcome: "success" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(app.origin);
  await page.locator('input[type="file"]').setInputFiles(silentWav());
  await page.getByRole("button", { name: "เริ่มถอดเสียง" }).click();
  await expect(page.getByText("อยู่ในคิวถอดเสียง", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "บทถอดเสียง" })).toHaveCount(0);
  stt.advance();
  await expect(page.getByText("กำลังถอดเสียง", { exact: true })).toBeVisible();
  stt.advance();

  const transcript = page.locator(".transcript-panel");
  await expect(transcript).toBeVisible();
  await expect(transcript.getByText(/<script>ไม่ควรถูกแสดงเป็น HTML<\/script>/)).toBeVisible();
  await expect(transcript.locator("script, [contenteditable='true']")).toHaveCount(0);
  await expect(transcript.locator("textarea.segment-editor")).toHaveCount(0);
  const segmentButtons = transcript.locator(".segment-button");
  await expect(segmentButtons).toHaveCount(14);
  await expect(segmentButtons.nth(0).locator(".segment-time")).toHaveAttribute("dateTime", "PT0S");
  await expect(segmentButtons.nth(0)).toHaveAttribute("aria-current", "true");

  const mediaBox = await page.locator(".media-panel").boundingBox();
  const transcriptBox = await transcript.boundingBox();
  expect(mediaBox).not.toBeNull();
  expect(transcriptBox).not.toBeNull();
  expect(Math.abs((mediaBox?.y ?? 0) - (transcriptBox?.y ?? 0))).toBeLessThan(2);
  expect((mediaBox?.x ?? 0) + (mediaBox?.width ?? 0)).toBeLessThanOrEqual(transcriptBox?.x ?? 0);
  expect(transcriptBox?.width ?? 0).toBeGreaterThan((mediaBox?.width ?? 0) * 1.3);
  await page.screenshot({ path: testInfo.outputPath("issue-4-completed-desktop.png"), fullPage: true });

  const secondSegment = segmentButtons.nth(1);
  await secondSegment.locator(".segment-copy").click();
  const audio = page.locator("audio");
  const audioTime = () => audio.evaluate((element) => {
    if (!(element instanceof HTMLAudioElement)) throw new Error("Audio player was not found");
    return element.currentTime;
  });
  await expect.poll(audioTime).toBeGreaterThanOrEqual(2);
  await expect.poll(() => audio.evaluate((element) => {
    if (!(element instanceof HTMLAudioElement)) throw new Error("Audio player was not found");
    return !element.paused;
  })).toBe(true);
  await expect(secondSegment).toHaveAttribute("aria-current", "true");

  await audio.evaluate((element) => {
    if (!(element instanceof HTMLAudioElement)) throw new Error("Audio player was not found");
    element.pause();
    element.currentTime = 2;
  });
  await expect(secondSegment).toHaveAttribute("aria-current", "true");
  await expect(segmentButtons.nth(0)).not.toHaveAttribute("aria-current", "true");

  await audio.evaluate(async (element) => {
    if (!(element instanceof HTMLAudioElement)) throw new Error("Audio player was not found");
    const seeked = new Promise<void>((resolve) => element.addEventListener("seeked", () => resolve(), { once: true }));
    element.currentTime = 26.5;
    await seeked;
    element.dispatchEvent(new Event("timeupdate"));
  });
  const lastSegment = segmentButtons.nth(13);
  await expect(lastSegment).toHaveAttribute("aria-current", "true");
  await expect.poll(() => transcript.locator(".transcript-list").evaluate((element) => element.scrollTop)).toBeGreaterThan(120);

  const transcriptList = transcript.locator(".transcript-list");
  const listBox = await transcriptList.boundingBox();
  expect(listBox).not.toBeNull();
  await page.mouse.move((listBox?.x ?? 0) + 100, (listBox?.y ?? 0) + 120);
  await page.mouse.wheel(0, -120);
  await expect(page.getByRole("button", { name: "กลับไปติดตามเสียง" })).toBeVisible();
  const manualScrollTop = await transcriptList.evaluate((element) => element.scrollTop);
  expect(manualScrollTop).toBeGreaterThan(0);
  await audio.evaluate((element) => {
    if (!(element instanceof HTMLAudioElement)) throw new Error("Audio player was not found");
    element.pause();
    element.currentTime = 0.5;
    element.dispatchEvent(new Event("timeupdate"));
  });
  await expect(segmentButtons.nth(0)).toHaveAttribute("aria-current", "true");
  await expect.poll(() => transcriptList.evaluate((element) => element.scrollTop)).toBe(manualScrollTop);
  const pageScrollBeforeReturn = await page.evaluate(() => window.scrollY);
  await page.getByRole("button", { name: "กลับไปติดตามเสียง" }).click();
  await expect.poll(() => transcriptList.evaluate((element) => element.scrollTop)).toBeLessThan(manualScrollTop);
  expect(await page.evaluate(() => window.scrollY)).toBe(pageScrollBeforeReturn);

  const txtExport = await downloadSelectedTranscript(page, "txt");
  expect(txtExport.download.suggestedFilename()).toBe("transcript-latest-0.txt");
  expect(txtExport.fileText).toBe(txtExport.preview);
  expect(txtExport.fileText).toContain("ประโยคทดสอบภาษาไทยที่ยาวเป็นพิเศษ");

  const srtExport = await downloadSelectedTranscript(page, "srt");
  expect(srtExport.download.suggestedFilename()).toBe("transcript-latest-0.srt");
  expect(srtExport.fileText).toBe(srtExport.preview);
  expect(srtExport.fileText).toContain("00:00:00,000 --> 00:00:02,000");

  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  let reachedByKeyboard = false;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    await page.keyboard.press("Tab");
    if (await secondSegment.evaluate((element) => document.activeElement === element)) {
      reachedByKeyboard = true;
      break;
    }
  }
  expect(reachedByKeyboard).toBe(true);
  await expect(secondSegment).toBeFocused();
  expect(await secondSegment.evaluate((element) => element.matches(":focus-visible"))).toBe(true);
  await page.keyboard.press("Enter");
  await expect.poll(audioTime).toBeGreaterThanOrEqual(2);

  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  const mobileMediaBox = await page.locator(".media-panel").boundingBox();
  const mobileTranscriptBox = await transcript.boundingBox();
  expect((mobileMediaBox?.y ?? 0) + (mobileMediaBox?.height ?? 0)).toBeLessThanOrEqual(mobileTranscriptBox?.y ?? 0);
  expect(await transcript.locator(".transcript-list").evaluate((element) => getComputedStyle(element).overflowY)).toBe("auto");
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight + 1)).toBe(true);
  await lastSegment.click();
  await expect(lastSegment).toHaveAttribute("aria-current", "true");
  await expect.poll(() => transcript.locator(".transcript-list").evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await page.screenshot({ path: testInfo.outputPath("issue-4-completed-mobile.png"), fullPage: true });
});

test("#10 replays, edits, views original, saves once per attempt, and exports the latest transcript", async ({ page, app, stt }, testInfo) => {
  stt.reset({ kind: "job", outcome: "success", failTranscriptSaveOnce: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(app.origin);
  await page.locator('input[type="file"]').setInputFiles(silentWav());
  await page.getByRole("button", { name: "เริ่มถอดเสียง" }).click();
  await expect(page.getByText("อยู่ในคิวถอดเสียง", { exact: true })).toBeVisible();
  stt.advance();
  await expect(page.getByText("กำลังถอดเสียง", { exact: true })).toBeVisible();
  stt.advance();

  const transcript = page.locator(".transcript-panel");
  await expect(transcript).toBeVisible();
  const segmentButtons = transcript.locator(".segment-button");
  const timestampsBefore = await transcript.locator(".segment-time").allTextContents();
  await expect(segmentButtons).toHaveCount(14);
  await expect(transcript.locator("textarea.segment-editor")).toHaveCount(0);

  const audio = page.locator("audio");
  const currentTime = () => audio.evaluate((element) => {
    if (!(element instanceof HTMLAudioElement)) throw new Error("Audio player was not found");
    return element.currentTime;
  });
  const isPaused = () => audio.evaluate((element) => {
    if (!(element instanceof HTMLAudioElement)) throw new Error("Audio player was not found");
    return element.paused;
  });
  await segmentButtons.nth(1).click();
  await expect.poll(currentTime).toBeGreaterThanOrEqual(1.45);
  await expect.poll(isPaused, { timeout: 6_000 }).toBe(true);
  expect(await currentTime()).toBeGreaterThanOrEqual(4.4);
  expect(await currentTime()).toBeLessThanOrEqual(4.7);

  const firstEdit = transcript.getByRole("button", { name: "แก้ไขข้อความช่วงเวลา 00:00.0" });
  const secondEdit = transcript.getByRole("button", { name: "แก้ไขข้อความช่วงเวลา 00:02.0" });
  await firstEdit.focus();
  await page.keyboard.press("Enter");
  const firstEditor = transcript.getByRole("textbox", { name: "แก้ไขข้อความช่วงเวลา 00:00.0" });
  await firstEditor.fill("ประโยคแรกที่แก้ด้วยคีย์บอร์ด");
  await expect(secondEdit).toBeDisabled();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "เก็บช่วงนี้" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(firstEdit).toBeVisible();
  await expect(firstEdit).toBeFocused();
  await expect(transcript.locator(".segment-copy").nth(0)).toContainText("ประโยคแรกที่แก้ด้วยคีย์บอร์ด");

  await secondEdit.click();
  const secondEditor = transcript.getByRole("textbox", { name: "แก้ไขข้อความช่วงเวลา 00:02.0" });
  await expect(firstEdit).toBeDisabled();
  await secondEditor.fill("ฉบับชั่วคราวที่ยกเลิก");
  await page.getByRole("button", { name: "ยกเลิกช่วงนี้" }).click();
  await expect(secondEdit).toBeVisible();
  await expect(secondEdit).toBeFocused();
  await expect(firstEdit).toBeEnabled();
  await expect(transcript.locator(".segment-copy").nth(0)).toContainText("ประโยคแรกที่แก้ด้วยคีย์บอร์ด");

  await secondEdit.click();
  await transcript.getByRole("textbox", { name: "แก้ไขข้อความช่วงเวลา 00:02.0" }).fill("ประโยคที่สองที่แก้ไข");
  await page.getByRole("button", { name: "เก็บช่วงนี้" }).click();
  await expect(firstEdit).toBeEnabled();
  await expect(transcript.locator(".unsaved-note")).toContainText("ยังไม่ได้บันทึก");
  const previewButton = page.getByRole("button", { name: "ตัวอย่างและส่งออก" });
  await expect(previewButton).toBeEnabled();
  await previewButton.click();
  const dirtyPreview = page.getByTestId("transcript-export-preview");
  expect(await dirtyPreview.textContent()).toContain('"text": "ช่วงเสียงภาษาไทยลำดับที่ 1 มีเวลาเริ่มและเวลาจบที่กำหนดไว้แน่นอน\\nประโยคทดสอบภาษาไทยที่ยาวเป็นพิเศษ');
  expect(await dirtyPreview.textContent()).not.toContain("ประโยคแรกที่แก้ด้วยคีย์บอร์ด");
  await expect(page.getByRole("button", { name: "ดาวน์โหลด JSON" })).toBeDisabled();
  const dirtyFormat = page.getByRole("combobox", { name: "รูปแบบตัวอย่าง" });
  await dirtyFormat.selectOption("txt");
  await expect(page.getByRole("button", { name: "ดาวน์โหลด TXT" })).toBeDisabled();
  await dirtyFormat.selectOption("srt");
  await expect(page.getByRole("button", { name: "ดาวน์โหลด SRT" })).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(previewButton).toBeFocused();
  await page.screenshot({ path: testInfo.outputPath("issue-10-review-unsaved-desktop.png"), fullPage: true });
  await page.getByRole("button", { name: "บันทึกเป็นฉบับร่าง" }).focus();
  await page.keyboard.press("Enter");
  await expect(transcript.getByRole("heading", { name: "ฉบับร่าง 1" })).toBeVisible();

  const revisionSelector = page.getByRole("combobox", { name: "เลือกฉบับบทถอดเสียง" });
  await revisionSelector.selectOption("original");
  await expect(transcript.getByRole("heading", { name: "บทถอดเสียงต้นฉบับ" })).toBeVisible();
  await expect(transcript.locator(".segment-copy").nth(0)).toContainText("ช่วงเสียงภาษาไทยลำดับที่ 1");
  await revisionSelector.selectOption("draft-1");
  await expect(transcript.getByRole("heading", { name: "ฉบับร่าง 1" })).toBeVisible();
  await expect(transcript.locator(".segment-copy").nth(0)).toContainText("ประโยคแรกที่แก้ด้วยคีย์บอร์ด");
  await expect(transcript.locator(".segment-copy").nth(1)).toContainText("ประโยคที่สองที่แก้ไข");

  const saveButton = page.getByRole("button", { name: "ตั้งเป็นฉบับล่าสุด" });
  await saveButton.focus();
  await page.keyboard.press("Enter");
  await expect(transcript.getByRole("alert")).toContainText("ตั้งฉบับล่าสุดไม่สำเร็จ");
  await expect(transcript.locator(".segment-copy").nth(0)).toContainText("ประโยคแรกที่แก้ด้วยคีย์บอร์ด");
  await expect(transcript.locator(".segment-copy").nth(1)).toContainText("ประโยคที่สองที่แก้ไข");
  await expect(previewButton).toBeEnabled();
  await previewButton.click();
  await page.getByRole("combobox", { name: "รูปแบบตัวอย่าง" }).selectOption("txt");
  await expect(page.getByRole("button", { name: "ดาวน์โหลด TXT" })).toBeEnabled();
  expect(await page.getByTestId("transcript-export-preview").textContent()).toContain("ประโยคแรกที่แก้ด้วยคีย์บอร์ด\nประโยคที่สองที่แก้ไข");
  await page.getByRole("button", { name: "ปิดตัวอย่าง" }).click();
  expect(stt.saves()).toHaveLength(1);

  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight + 1)).toBe(true);
  await expect(page.getByRole("button", { name: "ลองอีกครั้ง" })).toBeVisible();
  const thirdEdit = transcript.getByRole("button", { name: "แก้ไขข้อความช่วงเวลา 00:04.0" });
  await thirdEdit.focus();
  await page.keyboard.press("Enter");
  await transcript.getByRole("textbox", { name: "แก้ไขข้อความช่วงเวลา 00:04.0" }).fill("ยกเลิกด้วยคีย์บอร์ด");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "ยกเลิกช่วงนี้" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(thirdEdit).toBeVisible();
  await expect(thirdEdit).toBeFocused();
  await page.screenshot({ path: testInfo.outputPath("issue-10-review-unsaved-mobile.png"), fullPage: true });

  await page.getByRole("button", { name: "ลองอีกครั้ง" }).click();
  await expect(page.getByRole("status").filter({ hasText: "ตั้งฉบับที่เลือกเป็นฉบับล่าสุดแล้ว" })).toBeVisible();
  await expect(page.getByRole("button", { name: "ตัวอย่างและส่งออก" })).toBeEnabled();
  await expect.poll(() => stt.saves().length).toBe(2);
  const savePayload = stt.saves()[1].payload as { segments: Array<{ id: number; text: string }> };
  expect(savePayload.segments).toHaveLength(14);
  expect(savePayload.segments.slice(0, 2)).toEqual([
    { id: 1, text: "ประโยคแรกที่แก้ด้วยคีย์บอร์ด" },
    { id: 2, text: "ประโยคที่สองที่แก้ไข" },
  ]);
  expect(await transcript.locator(".segment-time").allTextContents()).toEqual(timestampsBefore);
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);

  await revisionSelector.selectOption("original");
  await expect(transcript.locator(".segment-copy").nth(0)).toContainText("ช่วงเสียงภาษาไทยลำดับที่ 1");
  await revisionSelector.selectOption("latest-1");
  await expect(transcript.locator(".segment-copy").nth(0)).toContainText("ประโยคแรกที่แก้ด้วยคีย์บอร์ด");

  const jsonExport = await downloadSelectedTranscript(page, "json");
  expect(jsonExport.download.suggestedFilename()).toBe("transcript-latest-1.json");
  expect(jsonExport.fileText).toBe(jsonExport.preview);
  const downloadedJson = JSON.parse(jsonExport.fileText) as { segments: Array<{ id: number; text: string }> };
  expect(downloadedJson.segments.slice(0, 2).map(({ id, text }) => ({ id, text }))).toEqual(savePayload.segments.slice(0, 2));

  const txtExport = await downloadSelectedTranscript(page, "txt");
  expect(txtExport.download.suggestedFilename()).toBe("transcript-latest-1.txt");
  expect(txtExport.fileText).toBe(txtExport.preview);
  expect(txtExport.fileText).toContain("ประโยคแรกที่แก้ด้วยคีย์บอร์ด\nประโยคที่สองที่แก้ไข");

  const srtExport = await downloadSelectedTranscript(page, "srt");
  expect(srtExport.download.suggestedFilename()).toBe("transcript-latest-1.srt");
  expect(srtExport.fileText).toBe(srtExport.preview);
  const srt = srtExport.fileText;
  expect(srt).toContain("00:00:00,000 --> 00:00:02,000\nประโยคแรกที่แก้ด้วยคีย์บอร์ด");
  expect(srt).toContain("00:00:02,000 --> 00:00:04,000\nประโยคที่สองที่แก้ไข");
});

test("#22 preserves revision snapshots through switches and failed commits in the current session", async ({ page, app, stt }, testInfo) => {
  stt.reset({ kind: "job", outcome: "success", failTranscriptSaveOnce: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(app.origin);
  await page.locator('input[type="file"]').setInputFiles(silentWav({ durationSeconds: 1 }));
  await page.getByRole("button", { name: "เริ่มถอดเสียง" }).click();
  await expect(page.getByText("อยู่ในคิวถอดเสียง", { exact: true })).toBeVisible();
  stt.advance();
  await expect(page.getByText("กำลังถอดเสียง", { exact: true })).toBeVisible();
  stt.advance();

  const transcript = page.locator(".transcript-panel");
  await expect(transcript).toBeVisible();
  const revisionSelector = page.getByRole("combobox", { name: "เลือกฉบับบทถอดเสียง" });
  const firstEdit = transcript.getByRole("button", { name: "แก้ไขข้อความช่วงเวลา 00:00.0" });
  await firstEdit.click();
  await transcript.getByRole("textbox", { name: "แก้ไขข้อความช่วงเวลา 00:00.0" }).fill("draft from latest");
  await revisionSelector.selectOption("original");

  const switchDialog = page.getByRole("dialog", { name: "มีข้อความที่ยังไม่ได้บันทึก" });
  await expect(switchDialog).toBeVisible();
  const stayButton = switchDialog.getByRole("button", { name: "อยู่ต่อ" });
  await expect(stayButton).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(switchDialog.getByRole("button", { name: "ทิ้งข้อความ" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(switchDialog.getByRole("button", { name: "บันทึกร่างแล้วเปลี่ยนฉบับ" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(transcript.getByRole("heading", { name: "บทถอดเสียงต้นฉบับ" })).toBeVisible();
  await expect(transcript.locator(".segment-copy").nth(0)).toContainText("ช่วงเสียงภาษาไทยลำดับที่ 1");
  await expect(revisionSelector.locator("option")).toContainText(["ฉบับล่าสุดที่ตรวจแล้ว", "ต้นฉบับ ASR", "ฉบับร่าง 1"]);

  await revisionSelector.selectOption("draft-1");
  await expect(transcript.locator(".segment-copy").nth(0)).toContainText("draft from latest");
  await revisionSelector.selectOption("original");
  const secondEdit = transcript.getByRole("button", { name: "แก้ไขข้อความช่วงเวลา 00:02.0" });
  await secondEdit.click();
  await transcript.getByRole("textbox", { name: "แก้ไขข้อความช่วงเวลา 00:02.0" }).fill("draft from original");
  await page.getByRole("button", { name: "บันทึกเป็นฉบับร่าง" }).click();
  await expect(transcript.getByRole("heading", { name: "ฉบับร่าง 2" })).toBeVisible();
  await expect(transcript.locator(".segment-copy").nth(1)).toContainText("draft from original");

  await revisionSelector.selectOption("original");
  await expect(transcript.locator(".segment-copy").nth(1)).toContainText("ประโยคทดสอบภาษาไทยที่ยาวเป็นพิเศษ");
  await revisionSelector.selectOption("draft-2");
  const thirdEdit = transcript.getByRole("button", { name: "แก้ไขข้อความช่วงเวลา 00:04.0" });
  await thirdEdit.click();
  const thirdEditor = transcript.getByRole("textbox", { name: "แก้ไขข้อความช่วงเวลา 00:04.0" });
  await thirdEditor.fill("temporary text");
  await revisionSelector.selectOption("latest-0");
  await expect(switchDialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(switchDialog).toHaveCount(0);
  await expect(thirdEditor).toHaveValue("temporary text");

  await revisionSelector.selectOption("latest-0");
  await expect(switchDialog).toBeVisible();
  await switchDialog.getByRole("button", { name: "ทิ้งข้อความ" }).click();
  await expect(transcript.getByRole("heading", { name: "ฉบับล่าสุดที่ตรวจแล้ว" })).toBeVisible();
  await expect(transcript.locator(".segment-copy").nth(0)).toContainText("ช่วงเสียงภาษาไทยลำดับที่ 1");

  await revisionSelector.selectOption("draft-2");
  const candidateName = "replacement-after-revision.wav";
  const filePicker = page.locator('input[type="file"]');
  await filePicker.focus();
  await filePicker.setInputFiles({ name: candidateName, mimeType: "audio/wav", buffer: silentWav({ durationSeconds: 1 }).buffer });
  const mediaDialog = page.getByRole("dialog", { name: "ยืนยันการแทนที่ไฟล์" });
  await expect(mediaDialog).toBeVisible();
  await mediaDialog.getByRole("button", { name: "ยกเลิก" }).click();
  await expect(filePicker).toBeFocused();
  await expect(transcript.getByRole("heading", { name: "ฉบับร่าง 2" })).toBeVisible();
  await expect(transcript.locator(".segment-copy").nth(1)).toContainText("draft from original");

  await page.getByRole("button", { name: "ตั้งเป็นฉบับล่าสุด" }).click();
  await expect(transcript.getByRole("alert")).toContainText("ตั้งฉบับล่าสุดไม่สำเร็จ");
  await expect(transcript.locator(".segment-copy").nth(1)).toContainText("draft from original");
  await expect(page.getByRole("button", { name: "ลองอีกครั้ง" })).toBeVisible();
  expect(stt.saves()).toHaveLength(1);
  await page.screenshot({ path: testInfo.outputPath("issue-22-failed-commit-desktop.png"), fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight + 1)).toBe(true);
  await expect(transcript.locator(".transcript-list")).toHaveCSS("overflow-y", "auto");
  await page.screenshot({ path: testInfo.outputPath("issue-22-failed-commit-mobile.png"), fullPage: true });
  await page.getByRole("button", { name: "ลองอีกครั้ง" }).click();
  await expect(transcript.getByRole("heading", { name: "ฉบับล่าสุดที่ตรวจแล้ว" })).toBeVisible();
  await expect(transcript.locator(".segment-copy").nth(1)).toContainText("draft from original");
  await expect.poll(() => stt.saves().length).toBe(2);
  expect(stt.saves().map(({ payload }) => (payload as { segments: Array<{ id: number; text: string }> }).segments[1]?.text)).toEqual([
    "draft from original",
    "draft from original",
  ]);

  await revisionSelector.selectOption("original");
  await expect(transcript.locator(".segment-copy").nth(0)).toContainText("ช่วงเสียงภาษาไทยลำดับที่ 1");
  await expect(transcript.locator(".segment-copy").nth(1)).toContainText("ประโยคทดสอบภาษาไทยที่ยาวเป็นพิเศษ");
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);

  await page.reload();
  await expect(page.getByRole("heading", { name: /ฟังทุกช่วงเวลา.*อ่านทุกถ้อยคำ/ })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "เลือกฉบับบทถอดเสียง" })).toHaveCount(0);
});

test("#23 previews and downloads only the selected revision and format on desktop and mobile", async ({ page, app, stt }, testInfo) => {
  for (const viewport of [
    { name: "desktop", width: 1440, height: 1000 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    stt.reset({ kind: "job", outcome: "success" });
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(app.origin);
    await page.locator('input[type="file"]').setInputFiles(silentWav({ durationSeconds: 1 }));
    await page.getByRole("button", { name: "เริ่มถอดเสียง" }).click();
    await expect(page.getByText("อยู่ในคิวถอดเสียง", { exact: true })).toBeVisible();
    stt.advance();
    await expect(page.getByText("กำลังถอดเสียง", { exact: true })).toBeVisible();
    stt.advance();

    const transcript = page.locator(".transcript-panel");
    await expect(transcript.getByRole("heading", { name: "ฉบับล่าสุดที่ตรวจแล้ว" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    const requestUrls: string[] = [];
    page.on("request", (request) => requestUrls.push(request.url()));
    const openPreview = page.getByRole("button", { name: "ตัวอย่างและส่งออก" });

    await openPreview.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toHaveAccessibleName(/ตัวอย่าง JSON · ฉบับล่าสุดที่ตรวจแล้ว/);
    const formatSelector = dialog.getByRole("combobox", { name: "รูปแบบตัวอย่าง" });
    await expect(formatSelector).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(formatSelector).toHaveValue("txt");
    const latestTxt = await downloadOpenPreview(page, "txt");
    expect(latestTxt.download.suggestedFilename()).toBe("transcript-latest-0.txt");
    expect(latestTxt.fileText).toBe(latestTxt.preview);
    expect(latestTxt.preview).toContain("ช่วงเสียงภาษาไทยลำดับที่ 1 มีเวลาเริ่มและเวลาจบที่กำหนดไว้แน่นอน");

    await formatSelector.selectOption("srt");
    const latestSrt = await downloadOpenPreview(page, "srt");
    expect(latestSrt.download.suggestedFilename()).toBe("transcript-latest-0.srt");
    expect(latestSrt.fileText).toBe(latestSrt.preview);
    expect(latestSrt.preview).toContain("00:00:00,000 --> 00:00:02,000");
    await page.screenshot({ path: testInfo.outputPath(`issue-23-latest-preview-${viewport.name}.png`), fullPage: true });
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(openPreview).toBeFocused();

    await transcript.getByRole("button", { name: "แก้ไขข้อความช่วงเวลา 00:00.0" }).click();
    await transcript.getByRole("textbox", { name: "แก้ไขข้อความช่วงเวลา 00:00.0" }).fill(`draft ${viewport.name}`);
    await page.getByRole("button", { name: "บันทึกเป็นฉบับร่าง" }).click();
    await expect(transcript.getByRole("heading", { name: "ฉบับร่าง 1" })).toBeVisible();
    await openPreview.click();
    await formatSelector.selectOption("json");
    await expect(dialog).toHaveAccessibleName(/ตัวอย่าง JSON · ฉบับร่าง 1/);
    const draftJson = JSON.parse(await page.getByTestId("transcript-export-preview").textContent() ?? "") as { segments: Array<{ text: string }>; text: string };
    expect(draftJson.segments[0]?.text).toBe(`draft ${viewport.name}`);
    expect(draftJson.text).toContain(`draft ${viewport.name}`);
    expect(draftJson.segments[0]?.text).not.toContain("ช่วงเสียงภาษาไทยลำดับที่ 1");
    await page.screenshot({ path: testInfo.outputPath(`issue-23-draft-preview-${viewport.name}.png`), fullPage: true });
    await formatSelector.selectOption("txt");
    const draftTxt = await downloadOpenPreview(page, "txt");
    expect(draftTxt.download.suggestedFilename()).toBe("transcript-draft-1.txt");
    expect(draftTxt.fileText).toBe(draftTxt.preview);
    expect(draftTxt.preview).toContain(`draft ${viewport.name}`);
    expect(draftTxt.preview).not.toContain("latest first");
    await page.getByRole("button", { name: "ปิดตัวอย่าง" }).click();

    await page.getByRole("button", { name: "ตั้งเป็นฉบับล่าสุด" }).click();
    await expect(transcript.getByRole("heading", { name: "ฉบับล่าสุดที่ตรวจแล้ว" })).toBeVisible();
    await openPreview.click();
    await formatSelector.selectOption("json");
    await expect(dialog).toHaveAccessibleName(/ตัวอย่าง JSON · ฉบับล่าสุดที่ตรวจแล้ว/);
    const reviewedJson = JSON.parse(await page.getByTestId("transcript-export-preview").textContent() ?? "") as { segments: Array<{ text: string }> };
    expect(reviewedJson.segments[0]?.text).toBe(`draft ${viewport.name}`);
    const reviewed = await downloadOpenPreview(page, "json");
    expect(reviewed.download.suggestedFilename()).toBe("transcript-latest-1.json");
    expect(JSON.parse(reviewed.fileText)).toEqual(reviewedJson);
    await page.getByRole("button", { name: "ปิดตัวอย่าง" }).click();

    await page.getByRole("combobox", { name: "เลือกฉบับบทถอดเสียง" }).selectOption("original");
    await expect(transcript.getByRole("heading", { name: "บทถอดเสียงต้นฉบับ" })).toBeVisible();
    await openPreview.click();
    await expect(dialog).toHaveAccessibleName(/ตัวอย่าง JSON · ต้นฉบับ ASR/);
    const originalJson = JSON.parse(await page.getByTestId("transcript-export-preview").textContent() ?? "") as { segments: Array<{ text: string }> };
    expect(originalJson.segments[0]?.text).toBe("ช่วงเสียงภาษาไทยลำดับที่ 1 มีเวลาเริ่มและเวลาจบที่กำหนดไว้แน่นอน");
    expect(originalJson.segments[0]?.text).not.toBe(`draft ${viewport.name}`);
    await formatSelector.selectOption("srt");
    const originalSrt = await downloadOpenPreview(page, "srt");
    expect(originalSrt.download.suggestedFilename()).toBe("transcript-original.srt");
    expect(originalSrt.fileText).toBe(originalSrt.preview);
    expect(originalSrt.preview).toContain("00:00:00,000 --> 00:00:02,000");
    await page.screenshot({ path: testInfo.outputPath(`issue-23-original-preview-${viewport.name}.png`), fullPage: true });
    await page.getByRole("button", { name: "ปิดตัวอย่าง" }).click();

    expect(requestUrls.some((url) => new URL(url).pathname.includes("/revisions"))).toBe(false);
    expect(requestUrls.some((url) => new URL(url).pathname.endsWith("/result") && new URL(url).searchParams.get("format") === "original-json")).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  }
});
