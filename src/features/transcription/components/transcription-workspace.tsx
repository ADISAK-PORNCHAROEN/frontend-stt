"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import { Button, buttonClassName } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { MAX_FILE_DURATION_SECONDS } from "../constants";
import { formatFileSize, formatMediaType } from "../format";
import type { ServiceState, TranscriptSegment, WorkspaceSession } from "../types";
import { useTranscriptionSession } from "../hooks/use-transcription-session";
import { useTranscriptReview } from "../hooks/use-transcript-review";
import { FileDrop } from "./file-drop";
import { MediaPlayer } from "./media-player";
import { TranscriptPanel } from "./transcript-panel";

const HOME_STEPS = [
  { marker: "A", title: "เลือกไฟล์", description: "เสียงหรือวิดีโอ" },
  { marker: "B", title: "เริ่มถอดเสียง", description: "ติดตามสถานะที่นี่" },
  { marker: "C", title: "ฟังตามช่วง", description: "กดเวลาเพื่อเล่นซ้ำ" },
] as const;

function ServiceNotice({ serviceState, onRetry, showChecking = true }: { serviceState: ServiceState; onRetry: () => void; showChecking?: boolean }) {
  if (serviceState === "ready" || (serviceState === "checking" && !showChecking)) return null;

  return (
    <div className="service-notice mt-3 flex items-start gap-2.5 rounded-lg border border-line bg-surface-soft px-3 py-2.5 text-sm" data-state={serviceState} role="status">
      <span className={"status-dot mt-2 size-2 shrink-0 rounded-full " + (serviceState === "unavailable" ? "bg-danger" : "bg-accent")} aria-hidden="true" />
      <p className={"m-0 min-w-0 flex-1 text-xs leading-relaxed " + (serviceState === "unavailable" ? "text-danger" : "text-ink-muted")}>
        {serviceState === "checking"
          ? "กำลังตรวจการเชื่อมต่อ STT service"
          : "STT service ยังไม่พร้อม ตรวจว่า service ในเครื่องกำลังทำงาน แล้วลองอีกครั้ง"}
      </p>
      {serviceState === "unavailable" ? (
        <Button variant="text" className="min-h-9 shrink-0 px-2 text-xs" type="button" onClick={onRetry}>
          ตรวจอีกครั้ง
        </Button>
      ) : null}
    </div>
  );
}

type SucceededSession = Extract<WorkspaceSession, { kind: "succeeded" }>;

function DownloadActions({ jobId, disabled }: { jobId: SucceededSession["jobId"]; disabled: boolean }) {
  return (
    <div className="download-actions flex flex-wrap gap-1.5" aria-label="ดาวน์โหลดบทถอดเสียง">
      {(["json", "txt", "srt"] as const).map((format) => {
        const label = "ดาวน์โหลด " + format.toUpperCase();
        const href = "/api/stt/jobs/" + jobId + "/result?format=" + format;
        return disabled
          ? <Button className="min-h-9 px-2.5 text-[11px]" variant="secondary" type="button" key={format} disabled>{label}</Button>
          : <a className={buttonClassName("secondary", "min-h-9 px-2.5 text-[11px] no-underline")} href={href} key={format}>{label}</a>;
      })}
    </div>
  );
}

function RetentionNote({ className = "" }: { className?: string }) {
  return (
    <div className={"retention-note border-t border-line pt-3 " + className}>
      <h3 className="m-0 text-xs font-semibold text-accent">การจัดเก็บชั่วคราว</h3>
      <p className="m-0 mt-1 text-xs leading-relaxed text-ink-muted">งานสำเร็จ: service ลบไฟล์ต้นฉบับหลัง 24 ชั่วโมง และเก็บผล 7 วัน งานล้มเหลว: ลบข้อมูลหลัง 24 ชั่วโมง</p>
    </div>
  );
}

function SucceededWorkspace({
  session,
  currentTime,
  playerRef,
  onTimeChange,
  onSeeking,
  onDuration,
  onReplay,
}: {
  session: SucceededSession;
  currentTime: number;
  playerRef: RefObject<HTMLMediaElement | null>;
  onTimeChange: (seconds: number) => void;
  onSeeking: () => void;
  onDuration: (mediaUrl: string, seconds: number) => void;
  onReplay: (segment: TranscriptSegment) => void;
}) {
  const review = useTranscriptReview(session.jobId, session.transcript);

  useEffect(() => {
    if (!review.isDirty && !review.isSaving) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [review.isDirty, review.isSaving]);

  return (
    <>
      <div className="workspace-main flex min-h-0 min-w-0 flex-col gap-3">
        <MediaPlayer
          media={session}
          playerRef={playerRef}
          currentTime={currentTime}
          onTimeChange={onTimeChange}
          onSeeking={onSeeking}
          onDuration={(seconds) => onDuration(session.url, seconds)}
        />
        <p className="m-0 text-xs text-success" role="status">ถอดเสียงเสร็จแล้ว · {session.transcript.segments.length} ช่วง{review.isDirty ? " · มีการแก้ไขที่ยังไม่ได้บันทึก" : ""}</p>
      </div>
      <aside className="workspace-side flex min-h-0 min-w-0 flex-col">
        <TranscriptPanel
          transcript={review.transcript ?? session.transcript}
          currentTime={currentTime}
          isOriginal={review.isOriginal}
          isDirty={review.isDirty}
          isSaving={review.isSaving}
          saveState={review.saveState}
          originalState={review.originalState}
          activeEdit={review.activeEdit}
          downloadActions={<DownloadActions jobId={session.jobId} disabled={review.isDirty || review.isSaving} />}
          onReplay={onReplay}
          onBeginEdit={review.beginEdit}
          onEdit={review.updateActiveText}
          onStageEdit={review.stageActiveEdit}
          onCancelEdit={review.cancelActiveEdit}
          onViewOriginal={() => void review.viewOriginal()}
          onViewLatest={review.viewLatest}
          onSave={() => void review.saveChanges()}
        />
      </aside>
    </>
  );
}

function GuidePanel() {
  return (
    <section className="panel guide-panel flex min-h-0 flex-col overflow-hidden rounded-2xl bg-surface shadow-[0_8px_26px_rgb(32_60_90_/_7%)]" aria-labelledby="guide-title">
      <div className="panel-heading flex min-h-14 items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <h2 id="guide-title" className="m-0 text-sm font-semibold text-ink sm:text-base">แผนที่การฟัง</h2>
        <span className="panel-meta text-xs text-ink-muted">วิธีใช้งาน</span>
      </div>
      <ol className="guide-list m-0 grid list-none gap-2 px-4 py-3 sm:px-5">
        <li className="relative grid min-h-12 grid-cols-[30px_minmax(0,1fr)] items-center gap-3">
          <span className="guide-point grid size-7 place-items-center rounded-full border border-coordinate-soft bg-white font-mono text-xs text-accent">A</span>
          <p className="m-0 flex flex-col"><strong className="text-sm font-semibold text-ink">เลือกไฟล์</strong><span className="text-xs text-ink-muted">MP3, M4A, WAV, FLAC หรือ MP4</span></p>
        </li>
        <li className="relative grid min-h-12 grid-cols-[30px_minmax(0,1fr)] items-center gap-3">
          <span className="guide-point grid size-7 place-items-center rounded-full border border-coordinate-soft bg-white font-mono text-xs text-accent">B</span>
          <p className="m-0 flex flex-col"><strong className="text-sm font-semibold text-ink">เริ่มถอดเสียง</strong><span className="text-xs text-ink-muted">รอคิวและติดตามสถานะได้ที่นี่</span></p>
        </li>
        <li className="relative grid min-h-12 grid-cols-[30px_minmax(0,1fr)] items-center gap-3">
          <span className="guide-point grid size-7 place-items-center rounded-full border border-coordinate-soft bg-white font-mono text-xs text-accent">C</span>
          <p className="m-0 flex flex-col"><strong className="text-sm font-semibold text-ink">กลับไปฟังตามช่วง</strong><span className="text-xs text-ink-muted">กดเวลาในบทถอดเสียงเพื่อ seek</span></p>
        </li>
      </ol>
      <RetentionNote className="mx-4 mt-auto px-0 py-3 sm:mx-5" />
    </section>
  );
}

function ProgressPanel({ session, jobMessage }: { session: WorkspaceSession; jobMessage: string | null }) {
  const isUploading = session.kind === "submitting";
  const progress = isUploading ? session.uploadPercent : session.kind === "queued" || session.kind === "running" ? session.progressPercent : 0;
  const label = isUploading
    ? "กำลังส่งไฟล์ไปยัง service"
    : session.kind === "queued"
      ? "อยู่ในคิวถอดเสียง"
      : "กำลังถอดเสียง";

  return (
    <section className="progress-panel flex flex-1 flex-col justify-center rounded-xl border border-coordinate-soft bg-white p-4 sm:p-5" aria-live="polite">
      <p className="m-0 mt-1 text-sm text-ink-muted">{isUploading ? "ส่งไฟล์แล้ว service จะเริ่มเข้าคิวถอดเสียง" : "โปรดรอสักครู่ ระบบกำลังถอดเสียงจากไฟล์ของคุณ"}</p>
      <div className="progress-label mt-6 flex items-center justify-between gap-3 text-sm text-ink">
        <h2 className="m-0 text-lg font-semibold text-ink">{label}</h2>
        <span className="font-mono tabular-nums text-accent">{progress}%</span>
      </div>
      <div
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-accent-soft"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        aria-label={isUploading ? "ความคืบหน้าการส่งไฟล์" : "ความคืบหน้าการถอดเสียง"}
      >
        <span className="block h-full rounded-full bg-accent transition-[width] duration-300 motion-reduce:transition-none" style={{ width: progress + "%" }} />
      </div>
      <p className="m-0 mt-2 text-xs leading-relaxed text-ink-muted">{isUploading ? "อัปโหลดไฟล์ผ่านการเชื่อมต่อในเครื่อง" : jobMessage ?? "หน้านี้ติดตามงานหนึ่งรายการ หากปิดแท็บจะไม่สามารถกลับมาติดตามจากเว็บได้"}</p>
      <ol className="mt-5 grid gap-3 border-t border-line pt-4 text-xs text-ink-muted">
        <li className="flex items-center gap-3"><span className="grid size-6 place-items-center rounded-full bg-accent text-white">✓</span><span>ตรวจสอบและเตรียมไฟล์</span></li>
        <li className="flex items-center gap-3 text-accent"><span className="grid size-6 place-items-center rounded-full border-2 border-accent bg-accent-soft">●</span><span>ประมวลผลเสียง</span></li>
        <li className="flex items-center gap-3"><span className="size-6 rounded-full border border-coordinate-soft bg-white" /><span>จัดรูปแบบผลลัพธ์</span></li>
      </ol>
      <RetentionNote className="mt-5" />
    </section>
  );
}

export function TranscriptionWorkspace() {
  const [currentTime, setCurrentTime] = useState(0);
  const playerRef = useRef<HTMLMediaElement>(null);
  const replayWindowRef = useRef<{ start: number; end: number } | null>(null);
  const sourceTitleRef = useRef<HTMLHeadingElement>(null);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const {
    session,
    media,
    serviceState,
    selectedModel,
    chooseModel,
    selectionError,
    setSelectionError,
    jobMessage,
    checkService,
    selectFile,
    clearSession,
    retryFailedJob,
    updateDuration,
    startTranscription,
  } = useTranscriptionSession();
  const selectedMediaUrl = session.kind === "selected" ? session.url : null;
  const isHome = media === null;
  const isActive = session.kind === "submitting" || session.kind === "queued" || session.kind === "running";

  useEffect(() => {
    if (!selectedMediaUrl) return;
    const nextFocusTarget = serviceState === "ready" ? startButtonRef.current : sourceTitleRef.current;
    nextFocusTarget?.focus();
  }, [selectedMediaUrl, serviceState]);

  function replaySegment(segment: TranscriptSegment) {
    const player = playerRef.current;
    if (!player) return;
    const duration = Number.isFinite(player.duration) ? player.duration : segment.end + 0.5;
    const start = Math.max(0, segment.start - 0.5);
    const end = Math.min(duration, segment.end + 0.5);
    replayWindowRef.current = { start, end };
    player.currentTime = start;
    void player.play().catch(() => undefined);
    setCurrentTime(start);
  }

  function handleTimeChange(seconds: number) {
    const replayWindow = replayWindowRef.current;
    if (replayWindow !== null && seconds >= replayWindow.end) {
      replayWindowRef.current = null;
      if (playerRef.current) {
        playerRef.current.currentTime = replayWindow.end;
        playerRef.current.pause();
      }
      setCurrentTime(replayWindow.end);
      return;
    }
    setCurrentTime(seconds);
  }

  function handleSeeking() {
    const player = playerRef.current;
    const replayWindow = replayWindowRef.current;
    if (player && replayWindow && (player.currentTime < replayWindow.start || player.currentTime > replayWindow.end)) {
      replayWindowRef.current = null;
    }
  }

  function handleSelectFile(file: File) {
    replayWindowRef.current = null;
    selectFile(file);
    setCurrentTime(0);
  }

  return (
    <main className="site-shell mx-auto flex min-h-dvh w-full max-w-[1380px] flex-col px-4 md:px-8 desktop-fit:h-dvh desktop-fit:min-h-0 desktop-fit:overflow-hidden">
      <header className="topbar flex min-h-16 shrink-0 items-center justify-between border-b border-line sm:min-h-[76px]">
        <Link className="wordmark inline-flex items-center gap-2.5 text-xs font-bold tracking-[0.13em] text-ink no-underline sm:gap-3 sm:text-[13px]" href="/" aria-label="Time Atlas หน้าแรก">
          <span className="wordmark-mark relative grid size-7 place-items-center rounded-lg bg-blue-100" aria-hidden="true">
            <i className="absolute size-[3px] -translate-y-[7px] rounded-full bg-accent" />
            <i className="absolute size-[3px] -translate-x-[7px] rounded-full bg-accent" />
            <i className="absolute size-[3px] translate-x-[7px] rounded-full bg-accent" />
          </span>
          <span>TIME ATLAS</span>
        </Link>
      </header>

      {isHome ? (
        <div className="workspace-content flex flex-1 flex-col gap-5 py-5 desktop-fit:min-h-0 desktop-fit:justify-center desktop-fit:gap-8 desktop-fit:py-6">
          <section className="page-intro grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center desktop-fit:gap-8" aria-labelledby="page-title">
            <div className="intro-copy">
              <h1 id="page-title" className="m-0 max-w-[620px] text-[clamp(2rem,3.5vw,3rem)] font-semibold leading-[1.16] tracking-[-0.025em] text-ink">ฟังทุกช่วงเวลา<br /><span className="text-accent">อ่านทุกถ้อยคำ</span></h1>
              <p className="m-0 mt-3 max-w-[60ch] text-sm leading-relaxed text-ink-muted sm:text-base">ถอดเสียงจากคลิปเสียงหรือวิดีโอ แล้วกลับไปฟังแต่ละช่วงได้ทันที</p>
            </div>
            <div className="home-uploader min-w-0">
              <FileDrop disabled={false} error={selectionError} onSelect={handleSelectFile} onInvalid={setSelectionError} />
              <ServiceNotice serviceState={serviceState} onRetry={() => void checkService()} />
            </div>
          </section>

          <section className="home-details grid gap-5 rounded-2xl bg-white p-5 shadow-[0_8px_26px_rgb(32_60_90_/_7%)] sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] sm:gap-6 sm:p-6" aria-label="วิธีใช้งานและการจัดเก็บ">
            <div className="home-process min-w-0">
              <h2 className="m-0 border-b border-line pb-3 text-base font-semibold text-ink">แผนที่การฟัง</h2>
              <ol className="home-steps relative m-0 grid list-none gap-4 pt-4 sm:grid-cols-3 sm:gap-3">
                {HOME_STEPS.map(({ marker, title, description }) => (
                  <li key={marker} className="relative flex min-w-0 items-start gap-3 after:absolute after:bottom-[-16px] after:left-4 after:top-8 after:w-px after:bg-line after:content-[''] sm:flex-col sm:gap-2.5 sm:after:bottom-auto sm:after:left-8 sm:after:right-[-12px] sm:after:top-4 sm:after:h-px sm:after:w-auto last:after:hidden">
                    <span className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full border border-coordinate-soft bg-white font-mono text-xs text-accent">{marker}</span>
                    <p className="m-0 flex flex-col"><strong className="text-sm font-semibold text-ink">{title}</strong><small className="text-xs leading-relaxed text-ink-muted">{description}</small></p>
                  </li>
                ))}
              </ol>
            </div>
            <aside className="home-retention border-t border-line pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0" aria-labelledby="retention-title">
              <h2 id="retention-title" className="m-0 text-sm font-semibold text-ink">การจัดเก็บชั่วคราว</h2>
              <dl className="m-0 mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
                <div><dt className="text-xs text-ink-muted">ไฟล์ต้นฉบับ</dt><dd className="m-0 mt-0.5 text-sm font-semibold text-ink">24 ชั่วโมง</dd></div>
                <div><dt className="text-xs text-ink-muted">ผลถอดเสียงเมื่อสำเร็จ</dt><dd className="m-0 mt-0.5 text-sm font-semibold text-ink">7 วัน</dd></div>
              </dl>
              <p className="m-0 mt-3 text-xs leading-relaxed text-ink-muted">งานล้มเหลวจะลบข้อมูลภายใน 24 ชั่วโมง เว็บไม่เก็บประวัติถาวร และปิดแท็บระหว่างถอดเสียงแล้วกลับมาติดตามงานเดิมไม่ได้</p>
            </aside>
          </section>
        </div>
      ) : (
        <div className="workspace-content flex min-h-0 flex-1 flex-col gap-3 py-3 sm:gap-4 sm:py-4 desktop-fit:overflow-hidden">
          <section className="panel source-panel flex shrink-0 flex-col overflow-hidden rounded-2xl bg-surface shadow-[0_8px_26px_rgb(32_60_90_/_7%)]" aria-labelledby="source-title">
            <div className="panel-heading flex min-h-14 items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent" aria-hidden="true">
                  <svg className="size-5" viewBox="0 0 24 24" fill="none"><path d="M7 3.75h7l4.25 4.5v12H7zM14 3.75v4.5h4.25" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
                </span>
                <div className="min-w-0">
                  <h2 id="source-title" ref={sourceTitleRef} tabIndex={-1} className="m-0 truncate text-sm font-semibold text-ink">{media.file.name}</h2>
                  <p className="panel-meta m-0 text-xs text-ink-muted">{formatMediaType(media.file)} · {formatFileSize(media.file.size)} · {media.durationSeconds === null ? "กำลังอ่านความยาว" : "ความยาว " + Math.floor(media.durationSeconds / 60) + ":" + String(Math.floor(media.durationSeconds % 60)).padStart(2, "0")}</p>
                </div>
              </div>
              {(session.kind === "selected" || session.kind === "failed" || session.kind === "succeeded") ? (
                <Button className="min-h-9 shrink-0 px-2 text-xs" variant="text" type="button" onClick={() => { replayWindowRef.current = null; clearSession(); setCurrentTime(0); }}>เลือกไฟล์ใหม่</Button>
              ) : null}
            </div>
            <div className="px-3 pt-2 sm:px-4">
              <FileDrop compact disabled={session.kind !== "selected"} error={selectionError} onSelect={handleSelectFile} onInvalid={setSelectionError} />
            </div>
            {session.kind === "selected" ? (
              <div className="grid gap-x-4 gap-y-2 px-3 pb-3 pt-2 sm:grid-cols-[minmax(0,1fr)_minmax(160px,220px)_auto] sm:items-center sm:px-4">
                <div className="model-field grid gap-1.5 sm:col-start-2 sm:row-start-1">
                  <label className="text-xs font-semibold text-ink" htmlFor="whisper-model">โมเดลถอดเสียง</label>
                  <Select
                    id="whisper-model"
                    name="model"
                    className="min-h-10 rounded-lg border-coordinate-soft px-3 py-2 text-xs sm:text-sm"
                    value={selectedModel ?? ""}
                    disabled={selectedModel === null}
                    onChange={(event) => {
                      const model = event.currentTarget.value;
                      if (model === "turbo" || model === "large-v3") chooseModel(model);
                    }}
                  >
                    <option value="turbo">Turbo</option>
                    <option value="large-v3">large-v3</option>
                  </Select>
                </div>
                <Button ref={startButtonRef} className="start-button sm:col-start-3 sm:row-start-1 sm:self-end" variant="primary" type="button" onClick={() => void startTranscription()} disabled={serviceState !== "ready" || selectedModel === null || (media.durationSeconds !== null && media.durationSeconds > MAX_FILE_DURATION_SECONDS)}>
                  เริ่มถอดเสียง <span aria-hidden="true">→</span>
                </Button>
              </div>
            ) : null}
            <ServiceNotice serviceState={serviceState} onRetry={() => void checkService()} />
          </section>

          <div className="workspace-grid grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] sm:gap-4 desktop-fit:overflow-hidden">
            {session.kind === "succeeded" ? (
              <SucceededWorkspace
                key={session.jobId}
                session={session}
                currentTime={currentTime}
                playerRef={playerRef}
                onTimeChange={handleTimeChange}
                onSeeking={handleSeeking}
                onDuration={updateDuration}
                onReplay={replaySegment}
              />
            ) : (
              <>
                <div className="workspace-main flex min-h-0 min-w-0 flex-col gap-3">
                  <MediaPlayer key={media.url} media={media} playerRef={playerRef} currentTime={currentTime} onTimeChange={handleTimeChange} onSeeking={handleSeeking} onDuration={(seconds) => updateDuration(media.url, seconds)} />
                  {session.kind === "failed" || jobMessage ? (
                    <div className="error-panel rounded-xl border border-red-200 bg-danger-soft p-4 text-danger" role="alert">
                      <strong className="text-sm">{session.kind === "failed" ? "ถอดเสียงไม่สำเร็จ" : "เกิดปัญหา"}</strong>
                      <p className="mb-2 mt-1 text-sm text-ink">{session.kind === "failed" ? session.message : jobMessage}</p>
                      {session.kind === "failed" ? <Button variant="secondary" type="button" onClick={retryFailedJob}>ลองส่งไฟล์นี้อีกครั้ง</Button> : <span className="text-xs">เลือกไฟล์ใหม่เพื่อส่งงานอีกครั้ง</span>}
                    </div>
                  ) : null}
                </div>
                <aside className="workspace-side flex min-h-0 min-w-0 flex-col">
                  {isActive ? <ProgressPanel session={session} jobMessage={jobMessage} /> : <GuidePanel />}
                </aside>
              </>
            )}
          </div>
        </div>
      )}

      <footer className="page-footer flex shrink-0 items-center justify-between gap-3 border-t border-line py-3 text-[11px] text-ink-muted sm:min-h-[58px] sm:text-xs">
        <p className="m-0">ไฟล์ไม่เกิน 1 GiB · ยาวไม่เกิน 2 ชั่วโมง · คิวรอได้สูงสุด 10 งาน</p>
        <p className="m-0 shrink-0 font-mono tracking-[0.08em] text-accent">TIME ATLAS</p>
      </footer>
    </main>
  );
}
