"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { MAX_FILE_DURATION_SECONDS } from "../constants";
import { formatFileSize, formatMediaType } from "../format";
import { formatEstimatedTime } from "../progress-estimate";
import type { ServiceState, TranscriptSegment, WorkspaceSession } from "../types";
import { useTranscriptionSession } from "../hooks/use-transcription-session";
import { useProgressEstimate } from "../hooks/use-progress-estimate";
import { useTranscriptReview } from "../hooks/use-transcript-review";
import { FileDrop } from "./file-drop";
import { MediaPlayer } from "./media-player";
import { TranscriptPanel } from "./transcript-panel";
import { SessionDialog } from "./session-dialog";

const HOME_STEPS = [
  { marker: "1", title: "เลือกไฟล์", description: "เสียงหรือวิดีโอที่ต้องการถอดเสียง" },
  { marker: "2", title: "เลือกโมเดลแล้วเริ่ม", description: "ติดตามสถานะงานในหน้านี้" },
  { marker: "3", title: "ตรวจทานผล", description: "ฟังตามเวลา แก้ไข แล้วบันทึก" },
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
type ActiveSession = Extract<WorkspaceSession, { kind: "submitting" | "queued" | "running" }>;

type WorkspaceLayout = "work" | "review";
type PendingMediaAction = { kind: "replace"; file: File } | { kind: "clear" };

function WorkspaceBody({ primary, reference, layout = "work" }: { primary: ReactNode; reference: ReactNode; layout?: WorkspaceLayout }) {
  const gridLayout = layout === "review"
    ? "grid-rows-[minmax(0,0.7fr)_minmax(0,1.3fr)] items-stretch lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:grid-rows-1"
    : "grid-rows-[minmax(0,1fr)_auto] items-stretch lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:grid-rows-1";

  return (
    <div className="workspace-body flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
      <div className={"workspace-grid grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden sm:gap-4 " + gridLayout}>
        {primary}
        {reference}
      </div>
    </div>
  );
}

function RetentionNote({ className = "" }: { className?: string }) {
  return (
    <div className={"retention-note border-t border-line pt-3 " + className}>
      <h3 className="m-0 text-xs font-semibold text-accent">การจัดเก็บชั่วคราว</h3>
      <p className="m-0 mt-1 text-xs leading-relaxed text-ink-muted">งานสำเร็จเก็บไฟล์ต้นฉบับ 24 ชั่วโมงและเก็บผล 7 วัน · งานล้มเหลวลบข้อมูลหลัง 24 ชั่วโมง</p>
    </div>
  );
}

function SucceededWorkspace({
  session,
  currentTime,
  onReplay,
}: {
  session: SucceededSession;
  currentTime: number;
  onReplay: (segment: TranscriptSegment) => void;
}) {
  const review = useTranscriptReview(session.jobId, session.transcript);

  useEffect(() => {
    if (!review.view.isDirty && !review.view.isSaving) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [review.view.isDirty, review.view.isSaving]);

  return (
    <aside className="workspace-side flex min-h-0 min-w-0 flex-col">
      <TranscriptPanel
        view={review.view}
        currentTime={currentTime}
        onReplay={onReplay}
        onBeginEdit={review.beginEdit}
        onEdit={review.updateActiveText}
        onStageEdit={review.stageActiveEdit}
        onCancelEdit={review.cancelActiveEdit}
        onDiscardChanges={review.discardChanges}
        onSaveDraft={review.saveDraft}
        onSelectRevision={review.selectRevision}
        onResolveSwitch={review.resolveSwitch}
        onRetryOriginal={review.retryOriginal}
        onCommit={() => void review.commitSelected()}
      />
    </aside>
  );
}

function CheckMark() {
  return (
    <svg className="size-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="m4.5 10.25 3.4 3.4 7.6-7.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ReadinessPanel({ jobMessage }: { jobMessage: string | null }) {
  return (
    <section className="panel readiness-panel flex h-fit min-w-0 flex-col gap-4 self-start rounded-2xl bg-surface p-4 shadow-[0_8px_26px_rgb(32_60_90_/_7%)] sm:gap-5 sm:p-5" aria-labelledby="readiness-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="readiness-title" className="m-0 text-base font-semibold text-ink sm:text-lg">พร้อมเริ่มถอดเสียง</h2>
          <p className="m-0 mt-1 text-xs leading-relaxed text-ink-muted">ตรวจไฟล์และเลือกโมเดลก่อนเริ่ม</p>
        </div>
        <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-accent-soft px-3 text-xs font-semibold text-accent"><CheckMark />ไฟล์พร้อม</span>
      </div>
      <ul className="m-0 grid list-none gap-3 border-y border-line py-3">
        <li className="flex min-w-0 items-start gap-3">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><CheckMark /></span>
          <p className="m-0 min-w-0"><strong className="block text-sm font-semibold text-ink">รูปแบบไฟล์รองรับ</strong><span className="text-xs leading-relaxed text-ink-muted">MP3, M4A, WAV, FLAC หรือ MP4 ที่มีเสียง</span></p>
        </li>
        <li className="flex min-w-0 items-start gap-3">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><CheckMark /></span>
          <p className="m-0 min-w-0"><strong className="block text-sm font-semibold text-ink">ฟังไฟล์ต้นฉบับได้</strong><span className="text-xs leading-relaxed text-ink-muted">คลิกเวลาในบทถอดเสียงเพื่อกลับไปฟังช่วงนั้น</span></p>
        </li>
      </ul>
      {jobMessage ? <p className="m-0 rounded-lg bg-danger-soft px-3 py-2 text-xs leading-relaxed text-danger" role="alert">เกิดปัญหาในการติดตามงาน: {jobMessage} เลือกไฟล์ใหม่เพื่อส่งงานอีกครั้ง</p> : null}
      <RetentionNote className="px-0 pt-0" />
    </section>
  );
}

function ProgressPanel({ session, jobMessage }: { session: ActiveSession; jobMessage: string | null }) {
  const isUploading = session.kind === "submitting";
  const progress = isUploading ? session.uploadPercent : session.progressPercent;
  const jobId = session.kind === "queued" || session.kind === "running" ? session.jobId : null;
  const remainingSeconds = useProgressEstimate(jobId, session.kind === "running" && jobMessage === null ? "running" : "inactive", progress);
  const remainingTime = remainingSeconds === null ? null : formatEstimatedTime(remainingSeconds);
  const label = isUploading
    ? "กำลังส่งไฟล์"
    : session.kind === "queued"
      ? "อยู่ในคิวถอดเสียง"
      : "กำลังถอดเสียง";
  const steps = [
    { label: "ส่งไฟล์", description: "นำสื่อเข้าสู่คิวงาน", active: isUploading, complete: !isUploading },
    { label: "รอคิว", description: "รอ service เริ่มประมวลผล", active: session.kind === "queued", complete: session.kind === "running" },
    { label: "ถอดเสียง", description: "สร้างผลลัพธ์ตามช่วงเวลา", active: session.kind === "running", complete: false },
  ];

  return (
    <section className="panel progress-panel flex h-fit min-w-0 flex-col gap-3 self-start rounded-2xl bg-surface p-4 shadow-[0_8px_26px_rgb(32_60_90_/_7%)] sm:gap-4 sm:p-5" aria-live="polite" aria-labelledby="progress-title">
      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id="progress-title" className="m-0 text-base font-semibold text-ink sm:text-lg">{label}</h2>
          <p className="m-0 mt-1 text-xs leading-relaxed text-ink-muted">{isUploading ? "ส่งไฟล์แล้ว service จะเริ่มเข้าคิวถอดเสียง" : jobMessage ?? "ระบบกำลังประมวลผลไฟล์นี้"}</p>
        </div>
        <span className="shrink-0 font-mono text-lg font-semibold tabular-nums text-accent">{progress}%</span>
      </div>
      <progress
        className="h-2.5 w-full accent-accent"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        aria-label={isUploading ? "ความคืบหน้าการส่งไฟล์" : "ความคืบหน้าการถอดเสียง"}
        value={progress}
        max={100}
      />
      {remainingTime ? (
        <div className="rounded-lg border border-accent-soft bg-accent-soft/50 px-3 py-2" aria-label={`เวลาที่เหลือโดยประมาณ ${remainingTime} คำนวณจากความคืบหน้าของงานนี้`} data-testid="remaining-time-estimate" role="status" tabIndex={0}>
          <p className="m-0 text-sm font-semibold text-ink">เวลาที่เหลือโดยประมาณ: {remainingTime}</p>
          <p className="m-0 mt-0.5 text-xs leading-relaxed text-ink-muted">คำนวณจากความคืบหน้าของงานนี้</p>
        </div>
      ) : null}
      {jobMessage ? <p className="m-0 rounded-lg bg-danger-soft px-3 py-2 text-xs leading-relaxed text-danger" role="alert">เกิดปัญหาในการติดตามงาน: {jobMessage}</p> : null}
      <ol className="m-0 grid list-none gap-2 border-t border-line pt-3 sm:gap-3">
        {steps.map(({ label: stepLabel, description, active, complete }) => (
          <li className="flex min-w-0 items-center gap-3" key={stepLabel}>
            <span className={"grid size-7 shrink-0 place-items-center rounded-full border " + (active ? "border-accent bg-accent text-white" : complete ? "border-accent-soft bg-accent-soft text-accent" : "border-coordinate-soft bg-white text-ink-muted")} aria-hidden="true">
              {complete ? <CheckMark /> : <span className="size-1.5 rounded-full bg-current" />}
            </span>
            <span className="min-w-0"><strong className={"block text-sm font-semibold " + (active ? "text-accent" : "text-ink")}>{stepLabel}</strong><span className="text-xs leading-relaxed text-ink-muted">{description}</span></span>
          </li>
        ))}
      </ol>
      <RetentionNote className="px-0 pt-3" />
    </section>
  );
}

function FailedPanel({ session, onRetry }: { session: Extract<WorkspaceSession, { kind: "failed" }>; onRetry: () => void }) {
  return (
    <section className="panel failed-panel flex min-w-0 flex-col items-start gap-3 rounded-2xl bg-surface p-4 shadow-[0_8px_26px_rgb(32_60_90_/_7%)] sm:p-5" aria-labelledby="failed-title" role="alert">
      <h2 id="failed-title" className="m-0 text-base font-semibold text-danger sm:text-lg">ถอดเสียงไม่สำเร็จ</h2>
      <p className="m-0 text-sm leading-relaxed text-ink">{session.message}</p>
      <Button variant="secondary" type="button" onClick={onRetry}>ลองส่งไฟล์นี้อีกครั้ง</Button>
      <RetentionNote className="mt-1 w-full px-0 pt-3" />
    </section>
  );
}

export function TranscriptionWorkspace() {
  const [currentTime, setCurrentTime] = useState(0);
  const [pendingMediaAction, setPendingMediaAction] = useState<PendingMediaAction | null>(null);
  const playerRef = useRef<HTMLMediaElement>(null);
  const replayWindowRef = useRef<{ start: number; end: number } | null>(null);
  const sourceTitleRef = useRef<HTMLHeadingElement>(null);
  const homeTitleRef = useRef<HTMLHeadingElement>(null);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const focusHomeAfterClear = useRef(false);
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
  const canReplaceFile = session.kind === "selected" || session.kind === "failed" || session.kind === "succeeded";
  const cancelPendingMediaAction = useCallback(() => setPendingMediaAction(null), []);

  useEffect(() => {
    if (!selectedMediaUrl) return;
    const nextFocusTarget = serviceState === "ready" ? startButtonRef.current : sourceTitleRef.current;
    nextFocusTarget?.focus();
  }, [selectedMediaUrl, serviceState]);

  useEffect(() => {
    if (!isHome || !focusHomeAfterClear.current) return;
    focusHomeAfterClear.current = false;
    homeTitleRef.current?.focus({ preventScroll: true });
  }, [isHome]);

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
    if (media !== null) {
      setPendingMediaAction({ kind: "replace", file });
      return;
    }
    replayWindowRef.current = null;
    selectFile(file);
    setCurrentTime(0);
  }

  function handleConfirmMediaAction() {
    if (!pendingMediaAction) return;
    replayWindowRef.current = null;
    if (pendingMediaAction.kind === "replace") selectFile(pendingMediaAction.file);
    else {
      focusHomeAfterClear.current = true;
      clearSession();
    }
    setCurrentTime(0);
    setPendingMediaAction(null);
  }

  return (
    <main className="site-shell flex h-dvh min-h-0 w-full flex-col overflow-hidden px-4 md:px-8">
      <header className="topbar sticky top-0 z-20 flex min-h-14 shrink-0 items-center justify-between border-b border-line bg-canvas sm:min-h-[68px]">
        <Link className="wordmark inline-flex items-center gap-2.5 rounded-sm text-xs font-bold tracking-[0.13em] text-ink no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:gap-3 sm:text-sm" href="/" aria-label="Time Atlas หน้าแรก">
          <span className="wordmark-mark relative grid size-7 place-items-center rounded-lg bg-blue-100" aria-hidden="true">
            <i className="absolute size-[3px] -translate-y-[7px] rounded-full bg-accent" />
            <i className="absolute size-[3px] -translate-x-[7px] rounded-full bg-accent" />
            <i className="absolute size-[3px] translate-x-[7px] rounded-full bg-accent" />
          </span>
          <span>TIME ATLAS</span>
        </Link>
      </header>

      {isHome ? (
        <div className="workspace-content home-content flex min-h-0 flex-1 items-center py-4 sm:py-5">
          <section className="home-screen grid min-h-0 w-full items-center gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(330px,0.8fr)] lg:gap-6" aria-label="เริ่มต้น">
            <div className="home-main grid min-w-0 gap-4 sm:gap-5">
              <div className="home-copy page-intro">
                <h1 id="page-title" ref={homeTitleRef} tabIndex={-1} className="m-0 text-[clamp(2rem,3.6vw,3rem)] font-semibold leading-[1.16] tracking-[-0.025em] text-ink">ฟังทุกช่วงเวลา<span className="block text-accent">อ่านทุกถ้อยคำ</span></h1>
                <p className="m-0 mt-3 max-w-[60ch] text-sm leading-relaxed text-ink-muted sm:text-base">เลือกไฟล์เสียงหรือวิดีโอ แล้วกลับไปฟังทุกช่วงจากบทถอดเสียงได้ทันที</p>
              </div>

              <section className="home-uploader flex min-w-0 flex-col gap-3" aria-label="เลือกไฟล์เพื่อถอดเสียง">
                <FileDrop disabled={false} error={selectionError} onSelect={handleSelectFile} onInvalid={setSelectionError} />
                <ServiceNotice serviceState={serviceState} onRetry={() => void checkService()} />
              </section>
            </div>

            <aside className="panel home-aside flex min-w-0 flex-col gap-4 rounded-2xl bg-surface p-4 shadow-[0_8px_26px_rgb(32_60_90_/_7%)] sm:gap-5 sm:p-6" aria-label="วิธีใช้งานและการจัดเก็บ">
              <h2 className="m-0 text-base font-semibold text-ink sm:text-lg">เริ่มจากไฟล์ แล้วฟังกลับตามเวลา</h2>
              <ol className="home-steps m-0 grid list-none gap-3">
                {HOME_STEPS.map(({ marker, title, description }) => (
                  <li key={marker} className="flex min-w-0 items-start gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full border border-coordinate-soft bg-white font-mono text-xs tabular-nums text-accent">{marker}</span>
                    <p className="m-0 min-w-0"><strong className="block text-sm font-semibold text-ink">{title}</strong><span className="text-xs leading-relaxed text-ink-muted">{description}</span></p>
                  </li>
                ))}
              </ol>
              <div className="home-retention border-t border-line pt-3">
                <h3 className="m-0 text-xs font-semibold text-accent">การจัดเก็บชั่วคราว</h3>
                <p className="m-0 mt-1 text-xs leading-relaxed text-ink-muted">เว็บไม่มีประวัติถาวร · งานสำเร็จเก็บไฟล์ต้นฉบับ 24 ชั่วโมงและผล 7 วัน · งานล้มเหลวเก็บข้อมูล 24 ชั่วโมง</p>
              </div>
            </aside>
          </section>
        </div>
      ) : (
        <div className="workspace-content flex min-h-0 flex-1 flex-col gap-2 overflow-hidden py-2 sm:gap-3 sm:py-3">
          {session.kind === "selected" ? (
            <section className="page-intro selected-intro shrink-0" aria-labelledby="selected-page-title">
              <h1 id="selected-page-title" className="m-0 text-xl font-semibold leading-tight text-ink sm:text-2xl">ตรวจไฟล์ก่อนเริ่ม</h1>
              <p className="m-0 mt-1 text-xs leading-relaxed text-ink-muted sm:text-sm">เลือกโมเดลแล้วเริ่มถอดเสียงเมื่อพร้อม</p>
            </section>
          ) : null}

          {session.kind !== "succeeded" ? <section className="panel source-panel shrink-0 overflow-hidden rounded-2xl bg-surface shadow-[0_8px_26px_rgb(32_60_90_/_7%)]" aria-labelledby="source-title">
            <div className="selected-toolbar grid min-w-0 grid-cols-2 items-center gap-x-3 gap-y-2.5 border-b border-line px-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:px-4 lg:grid-cols-[minmax(0,1fr)_auto_180px_auto] lg:items-center lg:gap-x-4">
              <div className="source-summary col-span-2 row-start-1 flex min-w-0 items-center gap-3 sm:col-span-1 sm:col-start-1 sm:row-start-1 lg:col-span-1 lg:col-start-1">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent" aria-hidden="true">
                  <svg className="size-5" viewBox="0 0 24 24" fill="none"><path d="M7 3.75h7l4.25 4.5v12H7zM14 3.75v4.5h4.25" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
                </span>
                <div className="min-w-0 flex-1">
                  <h2 id="source-title" ref={sourceTitleRef} tabIndex={-1} className="m-0 truncate text-sm font-semibold text-ink">{media.file.name}</h2>
                  <p className="panel-meta m-0 truncate text-xs text-ink-muted">{formatMediaType(media.file)} · {formatFileSize(media.file.size)} · {media.durationSeconds === null ? "กำลังอ่านความยาว" : "ความยาว " + Math.floor(media.durationSeconds / 60) + ":" + String(Math.floor(media.durationSeconds % 60)).padStart(2, "0")}</p>
                </div>
              </div>
              {canReplaceFile ? (
                <div className="source-actions col-span-2 row-start-2 flex items-center justify-end gap-2 sm:col-span-1 sm:col-start-2 sm:row-start-1 lg:col-start-2 lg:row-start-1">
                  <Button className="min-h-10 shrink-0 px-2 text-xs" variant="text" type="button" onClick={() => setPendingMediaAction({ kind: "clear" })}>ล้างไฟล์</Button>
                  <FileDrop compact disabled={false} error={selectionError} onSelect={handleSelectFile} onInvalid={setSelectionError} />
                </div>
              ) : null}
              {session.kind === "selected" ? (
                <>
                <div className="model-field col-start-1 row-start-3 grid min-w-0 gap-1.5 sm:row-start-2 lg:col-start-3 lg:row-start-1">
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
                <Button ref={startButtonRef} className="start-button col-start-2 row-start-3 min-h-10 w-full min-w-0 self-end sm:row-start-2 lg:col-start-4 lg:row-start-1 lg:min-w-36" variant="primary" type="button" onClick={() => void startTranscription()} disabled={serviceState !== "ready" || selectedModel === null || (media.durationSeconds !== null && media.durationSeconds > MAX_FILE_DURATION_SECONDS)}>
                  เริ่มถอดเสียง <svg className="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </Button>
                </>
              ) : null}
              {session.kind === "submitting" || session.kind === "queued" || session.kind === "running" ? (
                <span className="col-start-2 row-start-2 justify-self-end rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-success sm:col-start-2 sm:row-start-1 lg:col-start-4 lg:row-start-1">กำลังดำเนินการ</span>
              ) : null}
            </div>
            <ServiceNotice serviceState={serviceState} onRetry={() => void checkService()} />
          </section> : null}

          <WorkspaceBody
            layout={session.kind === "succeeded" ? "review" : "work"}
            primary={
              <div className="workspace-main flex min-h-0 min-w-0 flex-col">
                <MediaPlayer
                  key={media.url}
                  media={media}
                  playerRef={playerRef}
                  currentTime={currentTime}
                  onTimeChange={handleTimeChange}
                  onSeeking={handleSeeking}
                  onDuration={(seconds) => updateDuration(media.url, seconds)}
                  heading={session.kind === "selected" ? "ตัวอย่างไฟล์" : "เล่นสื่อต้นฉบับ"}
                  hint={session.kind === "selected" ? "เล่นเพื่อตรวจไฟล์ได้" : session.kind === "succeeded" ? "กดแถวเวลาเพื่อย้อนฟัง" : "ไฟล์อยู่ในเซสชันนี้"}
                  compactPreview={session.kind === "selected" || session.kind === "succeeded"}
                  headerActions={session.kind === "succeeded" ? (
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                      <Button className="min-h-9 px-2 text-xs" variant="text" type="button" onClick={() => setPendingMediaAction({ kind: "clear" })}>ล้างไฟล์</Button>
                      <FileDrop compact compactLabel="เลือกไฟล์ใหม่" disabled={false} error={selectionError} onSelect={handleSelectFile} onInvalid={setSelectionError} />
                    </div>
                  ) : undefined}
                />
              </div>
            }
            reference={session.kind === "succeeded"
              ? <SucceededWorkspace key={session.jobId} session={session} currentTime={currentTime} onReplay={replaySegment} />
              : session.kind === "selected"
                ? <ReadinessPanel jobMessage={jobMessage} />
                : session.kind === "failed"
                  ? <FailedPanel session={session} onRetry={retryFailedJob} />
                  : session.kind === "submitting" || session.kind === "queued" || session.kind === "running"
                    ? <ProgressPanel session={session} jobMessage={jobMessage} />
                    : null}
          />
        </div>
      )}

      <footer className="page-footer sticky bottom-0 z-20 flex shrink-0 items-center justify-between gap-3 border-t border-line bg-canvas py-3 text-xs text-ink-muted sm:min-h-[58px]">
        <p className="m-0 hidden min-w-0 sm:block">ไฟล์ไม่เกิน 1 GiB · ยาวไม่เกิน 2 ชั่วโมง · คิวรอได้สูงสุด 10 งาน</p>
        <p className="m-0 min-w-0 flex-1 sm:hidden">ไฟล์ไม่เกิน 1 GiB · ยาว 2 ชม. · คิวรอ 10 งาน</p>
        <p className="m-0 shrink-0 font-mono tracking-[0.08em] text-accent">TIME ATLAS</p>
      </footer>
      {pendingMediaAction ? (
        <SessionDialog
          title={pendingMediaAction.kind === "replace" ? "ยืนยันการแทนที่ไฟล์" : "ยืนยันการล้างไฟล์"}
          description={pendingMediaAction.kind === "replace"
            ? `ไฟล์ ${pendingMediaAction.file.name} จะเข้ามาแทนที่ไฟล์ปัจจุบันและเริ่มเซสชันใหม่`
            : `ยืนยันล้างไฟล์ ${media?.file.name ?? ""} และข้อมูลในเซสชันนี้`}
          cancelLabel="ยกเลิก"
          onCancel={cancelPendingMediaAction}
        >
          <Button variant="primary" type="button" onClick={handleConfirmMediaAction}>
            {pendingMediaAction.kind === "replace" ? "แทนที่ไฟล์" : "ล้างไฟล์"}
          </Button>
        </SessionDialog>
      ) : null}
    </main>
  );
}
