import { readFile } from "node:fs/promises";
import { test, expect } from "./support/test";
import { silentWav } from "./support/media";

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
  await page.getByRole("button", { name: "เริ่มถอดเสียง" }).click();
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
  await expect(page.getByRole("heading", { name: "บทถอดเสียง" })).toBeVisible();
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
  await expect(page.getByRole("heading", { name: "บทถอดเสียง" })).toBeVisible();
  await expect(page.getByText("ถอดเสียงเสร็จแล้ว", { exact: false })).toBeVisible();
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
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
    if (await removeButton.count()) await removeButton.click();
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
  await expect(page.getByRole("button", { name: "เลือกไฟล์ใหม่" })).toBeVisible();
  await clear();

  stt.reset({ kind: "job", outcome: "processing_failure" });
  await choose();
  await page.getByRole("button", { name: "เริ่มถอดเสียง" }).click();
  await expect(page.getByText("อยู่ในคิวถอดเสียง", { exact: true })).toBeVisible();
  stt.advance();
  await expect(page.getByText("กำลังถอดเสียง", { exact: true })).toBeVisible();
  stt.advance();
  await expect(page.locator(".failed-panel")).toContainText("เกิดข้อผิดพลาดระหว่างถอดเสียง");
  await expect(page.getByRole("button", { name: "เลือกไฟล์ใหม่" })).toBeVisible();
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

  const txtDownloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "ดาวน์โหลด TXT" }).click();
  const txtDownload = await txtDownloadPromise;
  expect(txtDownload.suggestedFilename()).toBe("transcript.txt");
  const txtPath = await txtDownload.path();
  if (!txtPath) throw new Error("TXT download did not create a file");
  expect(await readFile(txtPath, "utf8")).toContain("ประโยคทดสอบภาษาไทยที่ยาวเป็นพิเศษ");

  const srtDownloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "ดาวน์โหลด SRT" }).click();
  const srtDownload = await srtDownloadPromise;
  expect(srtDownload.suggestedFilename()).toBe("transcript.srt");
  const srtPath = await srtDownload.path();
  if (!srtPath) throw new Error("SRT download did not create a file");
  expect(await readFile(srtPath, "utf8")).toContain("00:00:00,000 --> 00:00:02,000");

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
  await expect(page.getByRole("button", { name: "ดาวน์โหลด JSON" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "ดาวน์โหลด TXT" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "ดาวน์โหลด SRT" })).toBeDisabled();
  await page.screenshot({ path: testInfo.outputPath("issue-10-review-unsaved-desktop.png"), fullPage: true });

  const originalView = page.getByRole("button", { name: "ดูต้นฉบับ" });
  await originalView.focus();
  await page.keyboard.press("Enter");
  await expect(transcript.getByRole("heading", { name: "บทถอดเสียงต้นฉบับ" })).toBeVisible();
  await expect(transcript.locator(".segment-copy").nth(0)).toContainText("ช่วงเสียงภาษาไทยลำดับที่ 1");
  await page.getByRole("button", { name: "กลับไปฉบับแก้ไข" }).click();
  await expect(transcript.locator(".segment-copy").nth(0)).toContainText("ประโยคแรกที่แก้ด้วยคีย์บอร์ด");
  await expect(transcript.locator(".segment-copy").nth(1)).toContainText("ประโยคที่สองที่แก้ไข");

  const saveButton = page.getByRole("button", { name: "บันทึกทั้งหมด" });
  await saveButton.focus();
  await page.keyboard.press("Enter");
  await expect(transcript.getByRole("alert")).toContainText("บันทึกการแก้ไขไม่สำเร็จ");
  await expect(transcript.locator(".segment-copy").nth(0)).toContainText("ประโยคแรกที่แก้ด้วยคีย์บอร์ด");
  await expect(transcript.locator(".segment-copy").nth(1)).toContainText("ประโยคที่สองที่แก้ไข");
  await expect(page.getByRole("button", { name: "ดาวน์โหลด TXT" })).toBeDisabled();
  expect(stt.saves()).toHaveLength(1);

  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight + 1)).toBe(true);
  await expect(page.getByRole("button", { name: "ลองบันทึกอีกครั้ง" })).toBeVisible();
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

  await page.getByRole("button", { name: /บันทึกทั้งหมด|ลองบันทึกอีกครั้ง/ }).click();
  await expect(page.getByRole("status").filter({ hasText: "บันทึกแล้ว" })).toBeVisible();
  await expect(page.getByRole("link", { name: "ดาวน์โหลด JSON" })).toBeEnabled();
  await expect.poll(() => stt.saves().length).toBe(2);
  const savePayload = stt.saves()[1].payload as { segments: Array<{ id: number; text: string }> };
  expect(savePayload.segments).toHaveLength(14);
  expect(savePayload.segments.slice(0, 2)).toEqual([
    { id: 1, text: "ประโยคแรกที่แก้ด้วยคีย์บอร์ด" },
    { id: 2, text: "ประโยคที่สองที่แก้ไข" },
  ]);
  expect(await transcript.locator(".segment-time").allTextContents()).toEqual(timestampsBefore);
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);

  await page.getByRole("button", { name: "ดูต้นฉบับ" }).click();
  await expect(transcript.locator(".segment-copy").nth(0)).toContainText("ช่วงเสียงภาษาไทยลำดับที่ 1");
  await page.getByRole("button", { name: "กลับไปฉบับแก้ไข" }).click();
  await expect(transcript.locator(".segment-copy").nth(0)).toContainText("ประโยคแรกที่แก้ด้วยคีย์บอร์ด");

  const jsonDownloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "ดาวน์โหลด JSON" }).click();
  const jsonDownload = await jsonDownloadPromise;
  expect(jsonDownload.suggestedFilename()).toBe("transcript.json");
  const jsonPath = await jsonDownload.path();
  if (!jsonPath) throw new Error("JSON download did not create a file");
  const downloadedJson = JSON.parse(await readFile(jsonPath, "utf8")) as { segments: Array<{ id: number; text: string }> };
  expect(downloadedJson.segments.slice(0, 2).map(({ id, text }) => ({ id, text }))).toEqual(savePayload.segments.slice(0, 2));

  const txtDownloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "ดาวน์โหลด TXT" }).click();
  const txtDownload = await txtDownloadPromise;
  const txtPath = await txtDownload.path();
  if (!txtPath) throw new Error("TXT download did not create a file");
  expect(await readFile(txtPath, "utf8")).toContain("ประโยคแรกที่แก้ด้วยคีย์บอร์ด\nประโยคที่สองที่แก้ไข");

  const srtDownloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "ดาวน์โหลด SRT" }).click();
  const srtDownload = await srtDownloadPromise;
  const srtPath = await srtDownload.path();
  if (!srtPath) throw new Error("SRT download did not create a file");
  const srt = await readFile(srtPath, "utf8");
  expect(srt).toContain("00:00:00,000 --> 00:00:02,000\nประโยคแรกที่แก้ด้วยคีย์บอร์ด");
  expect(srt).toContain("00:00:02,000 --> 00:00:04,000\nประโยคที่สองที่แก้ไข");
});
