"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import { MAX_FILE_DURATION_SECONDS } from "../constants";
import { formatFileSize, formatMediaType } from "../format";
import type { ServiceState, TranscriptSegment, WorkspaceSession } from "../types";
import { Button } from "@/components/ui/button";
import { useTranscriptionSession } from "../hooks/use-transcription-session";
import { useTranscriptReview } from "../hooks/use-transcript-review";
import { FileDrop } from "./file-drop";
import { MediaPlayer } from "./media-player";
import { TranscriptPanel } from "./transcript-panel";

function ServiceNotice({ serviceState, onRetry, showChecking = true }: { serviceState: ServiceState; onRetry: () => void; showChecking?: boolean }) {
  if (serviceState === "ready" || (serviceState === "checking" && !showChecking)) return null;

  return (
    <div className="service-notice" data-state={serviceState} role="status">
      <span className="status-dot" aria-hidden="true" />
      <p>
        {serviceState === "checking"
          ? "กำลังตรวจการเชื่อมต่อ STT service"
          : "STT service ยังไม่พร้อม ตรวจว่า service ในเครื่องกำลังทำงาน แล้วลองอีกครั้ง"}
      </p>
      {serviceState === "unavailable" ? (
        <Button variant="text" className="service-retry" type="button" onClick={onRetry}>
          ตรวจอีกครั้ง
        </Button>
      ) : null}
    </div>
  );
}

type SucceededSession = Extract<WorkspaceSession, { kind: "succeeded" }>;

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
      <div className="workspace-main">
        <MediaPlayer
          media={session}
          playerRef={playerRef}
          currentTime={currentTime}
          onTimeChange={onTimeChange}
          onSeeking={onSeeking}
          onDuration={(seconds) => onDuration(session.url, seconds)}
        />
        <div className="result-toolbar">
          <p role="status">ถอดเสียงเสร็จแล้ว · {session.transcript.segments.length} ช่วง{review.isDirty ? " · มีการแก้ไขที่ยังไม่ได้บันทึก" : ""}</p>
          <div className="download-actions">
            {(["json", "txt", "srt"] as const).map((format) => {
              const label = `ดาวน์โหลด ${format.toUpperCase()}`;
              const href = `/api/stt/jobs/${session.jobId}/result?format=${format}`;
              return review.isDirty || review.isSaving
                ? <button className="button button-secondary" type="button" key={format} disabled>{label}</button>
                : <a className="button button-secondary" href={href} key={format}>{label}</a>;
            })}
          </div>
        </div>
      </div>
      <aside className="workspace-side">
        <TranscriptPanel
          transcript={review.transcript ?? session.transcript}
          currentTime={currentTime}
          isOriginal={review.isOriginal}
          isDirty={review.isDirty}
          isSaving={review.isSaving}
          saveState={review.saveState}
          originalState={review.originalState}
          onReplay={onReplay}
          onEdit={review.updateText}
          onViewOriginal={() => void review.viewOriginal()}
          onViewLatest={review.viewLatest}
          onSave={() => void review.saveChanges()}
        />
      </aside>
    </>
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
    if (
      player && replayWindow &&
      (player.currentTime < replayWindow.start || player.currentTime > replayWindow.end)
    ) {
      replayWindowRef.current = null;
    }
  }

  return (
    <main className="site-shell">
      <header className="topbar">
        <Link className="wordmark" href="/" aria-label="Time Atlas หน้าแรก">
          <span className="wordmark-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>TIME ATLAS</span>
        </Link>
      </header>

      <section className={`page-intro${media ? " has-media" : " is-home"}`} aria-labelledby="page-title">
        <div className="intro-copy">
          <h1 id="page-title">ฟังทุกช่วงเวลา<br /><span>อ่านทุกถ้อยคำ</span></h1>
          <p>ถอดเสียงจากคลิปเสียงหรือวิดีโอ แล้วกลับไปฟังแต่ละช่วงได้ทันที</p>
        </div>
        {!media ? (
          <div className="home-uploader">
            <FileDrop disabled={false} error={selectionError} onSelect={(file) => { replayWindowRef.current = null; selectFile(file); setCurrentTime(0); }} onInvalid={setSelectionError} />
            <ServiceNotice serviceState={serviceState} onRetry={() => void checkService()} showChecking={false} />
          </div>
        ) : null}
      </section>

      {!media ? (
        <section className="home-details" aria-label="วิธีใช้งานและการจัดเก็บ">
          <div className="home-process">
            <h2>จากไฟล์สู่บทถอดเสียง</h2>
            <ol className="home-steps">
              <li><span>01</span><p><strong>เลือกไฟล์</strong><small>เสียงหรือวิดีโอจากเครื่อง</small></p></li>
              <li><span>02</span><p><strong>เริ่มถอดเสียง</strong><small>ติดตามคิวและสถานะได้บนหน้านี้</small></p></li>
              <li><span>03</span><p><strong>ฟังตามช่วงเวลา</strong><small>กดเวลาเพื่อกลับไปยังช่วงนั้น</small></p></li>
            </ol>
          </div>
          <aside className="home-retention" aria-labelledby="retention-title">
            <h2 id="retention-title">การจัดเก็บชั่วคราว</h2>
            <p>เมื่อสำเร็จ service ลบไฟล์ต้นฉบับหลัง 24 ชั่วโมง และเก็บผลถอดเสียงไว้ 7 วัน หากงานล้มเหลวจะลบข้อมูลหลัง 24 ชั่วโมง เว็บนี้ไม่บันทึกประวัติถาวร และหากปิดแท็บระหว่างถอดเสียงจะกลับมาติดตามงานเดิมไม่ได้</p>
          </aside>
        </section>
      ) : (
        <div className="workspace-grid has-media">
          <div className="source-band">
            <section className="panel source-panel" aria-labelledby="source-title">
              <div className="panel-heading">
                <div><h2 id="source-title" ref={sourceTitleRef} tabIndex={-1}>ไฟล์ต้นฉบับ</h2><p className="panel-meta">{media.file.name} · {formatFileSize(media.file.size)} · {formatMediaType(media.file)}</p></div>
                {(session.kind === "selected" || session.kind === "failed" || session.kind === "succeeded") ? (
                  <Button variant="text" type="button" onClick={() => { replayWindowRef.current = null; clearSession(); setCurrentTime(0); }}>เลือกไฟล์ใหม่</Button>
                ) : null}
              </div>
              <FileDrop disabled={session.kind !== "selected"} error={selectionError} onSelect={(file) => { replayWindowRef.current = null; selectFile(file); setCurrentTime(0); }} onInvalid={setSelectionError} />
              <ServiceNotice serviceState={serviceState} onRetry={() => void checkService()} />
              {session.kind === "selected" ? (
                <>
                  <div className="model-field">
                    <label htmlFor="whisper-model">โมเดลถอดเสียง</label>
                    <select
                      id="whisper-model"
                      name="model"
                      value={selectedModel ?? ""}
                      disabled={selectedModel === null}
                      onChange={(event) => {
                        const model = event.currentTarget.value;
                        if (model === "turbo" || model === "large-v3") chooseModel(model);
                      }}
                    >
                      <option value="turbo">Turbo</option>
                      <option value="large-v3">large-v3</option>
                    </select>
                  </div>
                  <Button ref={startButtonRef} variant="primary" className="start-button" type="button" onClick={() => void startTranscription()} disabled={serviceState !== "ready" || selectedModel === null || (media.durationSeconds !== null && media.durationSeconds > MAX_FILE_DURATION_SECONDS)}>
                    <span>เริ่มถอดเสียง</span><span aria-hidden="true">→</span>
                  </Button>
                </>
              ) : null}
            </section>
          </div>

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
              <div className="workspace-main">
                <MediaPlayer key={media.url} media={media} playerRef={playerRef} currentTime={currentTime} onTimeChange={handleTimeChange} onSeeking={handleSeeking} onDuration={(seconds) => updateDuration(media.url, seconds)} />
                {session.kind === "submitting" ? (
                  <section className="progress-panel" aria-live="polite">
                    <div className="progress-label"><strong>กำลังส่งไฟล์ไปยัง service</strong><span>{session.uploadPercent}%</span></div>
                    <progress value={session.uploadPercent} max="100" aria-label="ความคืบหน้าการส่งไฟล์" />
                    <p>ส่งไฟล์แล้ว service จะเริ่มเข้าคิวถอดเสียง</p>
                  </section>
                ) : null}
                {(session.kind === "queued" || session.kind === "running") ? (
                  <section className="progress-panel" aria-live="polite">
                    <div className="progress-label"><strong>{session.kind === "queued" ? "อยู่ในคิวถอดเสียง" : "กำลังถอดเสียง"}</strong><span>{session.progressPercent}%</span></div>
                    <progress value={session.progressPercent} max="100" aria-label="ความคืบหน้าการถอดเสียง" />
                    <p>{jobMessage ?? "หน้านี้ติดตามงานหนึ่งรายการ หากปิดแท็บจะไม่สามารถกลับมาติดตามจากเว็บได้"}</p>
                  </section>
                ) : null}
                {session.kind === "failed" || jobMessage ? (
                  <div className="error-panel" role="alert">
                    <strong>{session.kind === "failed" ? "ถอดเสียงไม่สำเร็จ" : "เกิดปัญหา"}</strong>
                    <p>{session.kind === "failed" ? session.message : jobMessage}</p>
                    {session.kind === "failed" ? <Button variant="secondary" type="button" onClick={retryFailedJob}>ลองส่งไฟล์นี้อีกครั้ง</Button> : <span>เลือกไฟล์ใหม่เพื่อส่งงานอีกครั้ง</span>}
                  </div>
                ) : null}
              </div>
              <aside className="workspace-side">
                <section className="panel guide-panel" aria-labelledby="guide-title">
                  <div className="panel-heading"><h2 id="guide-title">แผนที่การฟัง</h2><span className="panel-meta">วิธีใช้งาน</span></div>
                  <ol className="guide-list">
                    <li><span className="guide-point">A</span><p><strong>เลือกไฟล์</strong><span>MP3, M4A, WAV, FLAC หรือ MP4</span></p></li>
                    <li><span className="guide-point">B</span><p><strong>เริ่มถอดเสียง</strong><span>รอคิวและติดตามสถานะได้ที่นี่</span></p></li>
                    <li><span className="guide-point">C</span><p><strong>กลับไปฟังตามช่วง</strong><span>กดเวลาในบทถอดเสียงเพื่อ seek</span></p></li>
                  </ol>
                  <div className="retention-note">
                    <h3>การจัดเก็บชั่วคราว</h3>
                    <p>งานสำเร็จ: service ลบไฟล์ต้นฉบับหลัง 24 ชั่วโมง และเก็บผล 7 วัน งานล้มเหลว: ลบข้อมูลหลัง 24 ชั่วโมง หน้านี้ไม่บันทึกประวัติถาวร ปิดแท็บแล้วจะติดตามงานเดิมไม่ได้</p>
                  </div>
                </section>
              </aside>
            </>
          )}
        </div>
      )}

      <footer className="page-footer">
        <p>ไฟล์ไม่เกิน 1 GiB · ยาวไม่เกิน 2 ชั่วโมง · คิวรอได้สูงสุด 10 งาน</p>
        <p>TIME ATLAS <span>·</span> ประมวลผลผ่าน STT service ในเครื่อง</p>
      </footer>
    </main>
  );
}
