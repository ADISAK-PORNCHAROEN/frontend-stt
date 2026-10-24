"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getRemoteJob, getServiceHealth, getTranscript, submitFile } from "../api";
import { MAX_FILE_DURATION_SECONDS, MAX_FILE_BYTES } from "../constants";
import { formatFileSize } from "../format";
import type { JobId, MediaFile, ServiceState, WorkspaceSession } from "../types";
import { FileDrop } from "./file-drop";
import { MediaPlayer } from "./media-player";
import { TranscriptPanel } from "./transcript-panel";

function getJobId(session: WorkspaceSession): JobId | null {
  return session.kind === "queued" || session.kind === "running" || session.kind === "succeeded"
    ? session.jobId
    : session.kind === "failed" ? session.jobId : null;
}

function getMedia(session: WorkspaceSession): MediaFile | null {
  return session.kind === "empty" ? null : session;
}

export function TranscriptionWorkspace() {
  const [session, setSession] = useState<WorkspaceSession>({ kind: "empty" });
  const [serviceState, setServiceState] = useState<ServiceState>("checking");
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [jobMessage, setJobMessage] = useState<string | null>(null);
  const playerRef = useRef<HTMLMediaElement>(null);
  const uploadController = useRef<AbortController | null>(null);
  const media = getMedia(session);
  const mediaUrl = media?.url;

  async function checkService() {
    setServiceState("checking");
    try {
      const health = await getServiceHealth();
      setServiceState(health.ready ? "ready" : "unavailable");
      if (health.ready) setJobMessage(null);
    } catch {
      setServiceState("unavailable");
    }
  }

  useEffect(() => {
    let live = true;
    void getServiceHealth().then((health) => {
      if (live) setServiceState(health.ready ? "ready" : "unavailable");
    }).catch(() => {
      if (live) setServiceState("unavailable");
    });
    return () => { live = false; };
  }, []);

  useEffect(() => {
    if (session.kind !== "submitting" && session.kind !== "queued" && session.kind !== "running") return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [session.kind]);

  const activeJobId = getJobId(session);
  useEffect(() => {
    if (!activeJobId || (session.kind !== "queued" && session.kind !== "running")) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      try {
        const job = await getRemoteJob(activeJobId);
        if (cancelled) return;
        setJobMessage(null);
        if (job.status === "succeeded") {
          const transcript = await getTranscript(activeJobId);
          if (!cancelled) {
            setSession((current) => current.kind !== "empty" && getJobId(current) === activeJobId
              ? { ...current, kind: "succeeded", jobId: activeJobId, transcript }
              : current);
          }
          return;
        }
        if (job.status === "failed") {
          setSession((current) => current.kind !== "empty" && getJobId(current) === activeJobId
            ? { ...current, kind: "failed", jobId: activeJobId, message: job.message }
            : current);
          return;
        }
        setSession((current) => current.kind !== "empty" && getJobId(current) === activeJobId
          ? { ...current, kind: job.status, jobId: activeJobId, progressPercent: job.progressPercent }
          : current);
        timer = setTimeout(() => void poll(), 1100);
      } catch (error) {
        if (!cancelled) {
          setJobMessage(error instanceof Error ? error.message : "ติดตามงานไม่ได้ กรุณาลองใหม่");
          timer = setTimeout(() => void poll(), 2500);
        }
      }
    };
    void poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [activeJobId, session.kind]);

  const handleSelect = useCallback((file: File) => {
    if (media) URL.revokeObjectURL(media.url);
    const nextMedia: MediaFile = { file, url: URL.createObjectURL(file), durationSeconds: null };
    setSelectionError(null);
    setJobMessage(null);
    setCurrentTime(0);
    setSession({ kind: "selected", ...nextMedia });
  }, [media]);

  useEffect(() => () => {
    if (mediaUrl) URL.revokeObjectURL(mediaUrl);
  }, [mediaUrl]);

  async function startTranscription() {
    if (session.kind !== "selected") return;
    if (serviceState !== "ready") {
      setJobMessage("STT service ยังไม่พร้อม ตรวจสอบว่า service ทำงานอยู่บนเครื่องนี้แล้วลองอีกครั้ง");
      return;
    }
    if (session.file.size > MAX_FILE_BYTES) {
      setSelectionError("ไฟล์มีขนาดเกิน 1 GiB กรุณาเลือกไฟล์ที่เล็กกว่านี้");
      return;
    }
    if (session.durationSeconds !== null && session.durationSeconds > MAX_FILE_DURATION_SECONDS) {
      setSelectionError("ไฟล์ยาวเกิน 2 ชั่วโมง กรุณาเลือกไฟล์ที่สั้นกว่านี้");
      return;
    }

    const original = session;
    const controller = new AbortController();
    uploadController.current = controller;
    setJobMessage(null);
    setSession({ ...original, kind: "submitting", uploadPercent: 0 });
    try {
      const jobId = await submitFile(original.file, (uploadPercent) => {
        setSession((current) => current.kind === "submitting"
          ? { ...current, uploadPercent }
          : current);
      }, controller.signal);
      setSession((current) => current.kind === "submitting"
        ? { ...current, kind: "queued", jobId, progressPercent: 0 }
        : current);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setJobMessage(error instanceof Error ? error.message : "ส่งไฟล์ไม่สำเร็จ กรุณาลองใหม่");
      setSession({ ...original, kind: "selected" });
      if (error instanceof Error && error.message.includes("service")) setServiceState("unavailable");
    } finally {
      uploadController.current = null;
    }
  }

  function updateDuration(seconds: number) {
    setSession((current) => current.kind === "empty" ? current : { ...current, durationSeconds: seconds });
    if (seconds > MAX_FILE_DURATION_SECONDS) setSelectionError("ไฟล์ยาวเกิน 2 ชั่วโมง กรุณาเลือกไฟล์ที่สั้นกว่านี้");
  }

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
          {serviceState === "unavailable" ? <button className="text-button service-retry" type="button" onClick={() => void checkService()}>ตรวจอีกครั้ง</button> : null}
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
            <FileDrop disabled={false} error={selectionError} onSelect={handleSelect} onInvalid={setSelectionError} />
          ) : (
            <section className="panel source-panel" aria-labelledby="source-title">
              <div className="panel-heading">
                <div><h2 id="source-title">ไฟล์ต้นฉบับ</h2><p className="panel-meta">{media.file.name} · {formatFileSize(media.file.size)}</p></div>
                {(session.kind === "selected" || session.kind === "failed" || session.kind === "succeeded") ? (
                  <button className="text-button" type="button" onClick={() => { URL.revokeObjectURL(media.url); setSession({ kind: "empty" }); setCurrentTime(0); setSelectionError(null); setJobMessage(null); }}>เลือกไฟล์ใหม่</button>
                ) : null}
              </div>
              <FileDrop disabled={session.kind !== "selected"} error={selectionError} onSelect={handleSelect} onInvalid={setSelectionError} />
              {session.kind === "selected" ? (
                <button className="button button-primary start-button" type="button" onClick={() => void startTranscription()} disabled={serviceState !== "ready" || (media.durationSeconds !== null && media.durationSeconds > MAX_FILE_DURATION_SECONDS)}>
                  <span>เริ่มถอดเสียง</span><span aria-hidden="true">→</span>
                </button>
              ) : null}
            </section>
          )}
        </div>

        <div className="workspace-main">
          {media ? <MediaPlayer media={media} playerRef={playerRef} currentTime={currentTime} onTimeChange={setCurrentTime} onDuration={updateDuration} /> : null}

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
