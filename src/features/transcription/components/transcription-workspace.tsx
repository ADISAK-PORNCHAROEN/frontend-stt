"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { MAX_FILE_DURATION_SECONDS } from "../constants";
import { formatFileSize } from "../format";
import type { JobId, WorkspaceSession } from "../types";
import { Button } from "@/components/ui/button";
import { useTranscriptionSession } from "../hooks/use-transcription-session";
import { FileDrop } from "./file-drop";
import { MediaPlayer } from "./media-player";
import { TranscriptPanel } from "./transcript-panel";

function getJobId(session: WorkspaceSession): JobId | null {
  return session.kind === "queued" || session.kind === "running" || session.kind === "succeeded"
    ? session.jobId
    : session.kind === "failed" ? session.jobId : null;
}

export function TranscriptionWorkspace() {
  const [currentTime, setCurrentTime] = useState(0);
  const playerRef = useRef<HTMLMediaElement>(null);
  const {
    session,
    media,
    serviceState,
    selectionError,
    setSelectionError,
    jobMessage,
    checkService,
    selectFile,
    clearSession,
    updateDuration,
    startTranscription,
  } = useTranscriptionSession();

  function seek(seconds: number) {
    const player = playerRef.current;
    if (!player) return;
    player.currentTime = seconds;
    void player.play().catch(() => undefined);
    setCurrentTime(seconds);
  }

  function downloadUrl(format: "txt" | "srt") {
    const jobId = getJobId(session);
    return jobId ? `/api/stt/jobs/${jobId}/result?format=${format}` : "#";
  }

  return (
    <main className="site-shell">
      <header className="topbar">
        <Link className="wordmark" href="/" aria-label="Time Atlas หน้าแรก">
          <span className="wordmark-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>TIME ATLAS</span>
        </Link>
        <div className="service-actions">
          <p className="service-indicator" data-state={serviceState} role="status">
            <span className="status-dot" />
            {serviceState === "checking" ? "กำลังตรวจ STT service" : serviceState === "ready" ? "STT service พร้อมใช้งาน" : "STT service ยังไม่พร้อม"}
          </p>
          {serviceState === "unavailable" ? <Button variant="text" className="service-retry" type="button" onClick={() => void checkService()}>ตรวจอีกครั้ง</Button> : null}
        </div>
      </header>

      <section className="page-intro" aria-labelledby="page-title">
        <div className="intro-copy">
          <h1 id="page-title">ฟังทุกช่วงเวลา<br /><span>อ่านทุกถ้อยคำ</span></h1>
          <p>ถอดเสียงจากคลิปเสียงหรือวิดีโอ แล้วกลับไปฟังแต่ละช่วงได้ทันที</p>
        </div>
      </section>

      <div className={`workspace-grid${media ? " has-media" : " is-empty"}`}>
        <div className="source-band">
          {!media ? (
            <FileDrop disabled={false} error={selectionError} onSelect={(file) => { selectFile(file); setCurrentTime(0); }} onInvalid={setSelectionError} />
          ) : (
            <section className="panel source-panel" aria-labelledby="source-title">
              <div className="panel-heading">
                <div><h2 id="source-title">ไฟล์ต้นฉบับ</h2><p className="panel-meta">{media.file.name} · {formatFileSize(media.file.size)}</p></div>
                {(session.kind === "selected" || session.kind === "failed" || session.kind === "succeeded") ? (
                  <Button variant="text" type="button" onClick={() => { clearSession(); setCurrentTime(0); }}>เลือกไฟล์ใหม่</Button>
                ) : null}
              </div>
              <FileDrop disabled={session.kind !== "selected"} error={selectionError} onSelect={(file) => { selectFile(file); setCurrentTime(0); }} onInvalid={setSelectionError} />
              {session.kind === "selected" ? (
                <Button variant="primary" className="start-button" type="button" onClick={() => void startTranscription()} disabled={serviceState !== "ready" || (media.durationSeconds !== null && media.durationSeconds > MAX_FILE_DURATION_SECONDS)}>
                  <span>เริ่มถอดเสียง</span><span aria-hidden="true">→</span>
                </Button>
              ) : null}
            </section>
          )}
        </div>

        <div className="workspace-main">
          {media ? <MediaPlayer key={media.url} media={media} playerRef={playerRef} currentTime={currentTime} onTimeChange={setCurrentTime} onDuration={(seconds) => updateDuration(media.url, seconds)} /> : null}

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
          {session.kind === "succeeded" ? (
            <div className="result-toolbar">
              <p role="status">ถอดเสียงเสร็จแล้ว · {session.transcript.segments.length} ช่วง</p>
              <div className="download-actions">
                <a className="button button-secondary" href={downloadUrl("txt")}>ดาวน์โหลด TXT</a>
                <a className="button button-secondary" href={downloadUrl("srt")}>ดาวน์โหลด SRT</a>
              </div>
            </div>
          ) : null}
          {session.kind === "failed" || jobMessage ? (
            <div className="error-panel" role="alert">
              <strong>{session.kind === "failed" ? "ถอดเสียงไม่สำเร็จ" : "เกิดปัญหา"}</strong>
              <p>{session.kind === "failed" ? session.message : jobMessage}</p>
              <span>เลือกไฟล์ใหม่เพื่อส่งงานอีกครั้ง</span>
            </div>
          ) : null}
        </div>

        <aside className="workspace-side">
          {session.kind === "succeeded" ? (
            <TranscriptPanel transcript={session.transcript} currentTime={currentTime} onSeek={seek} />
          ) : (
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
          )}
        </aside>
      </div>

      <footer className="page-footer">
        <p>ไฟล์ไม่เกิน 1 GiB · ยาวไม่เกิน 2 ชั่วโมง · คิวรอได้สูงสุด 10 งาน</p>
        <p>TIME ATLAS <span>·</span> ประมวลผลผ่าน STT service ในเครื่อง</p>
      </footer>
    </main>
  );
}
