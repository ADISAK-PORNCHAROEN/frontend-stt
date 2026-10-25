"use client";

import { useState, type RefObject, type SyntheticEvent } from "react";
import { formatDuration, formatTimestamp } from "../format";
import type { MediaFile } from "../types";

type Props = {
  media: MediaFile;
  playerRef: RefObject<HTMLMediaElement | null>;
  currentTime: number;
  onTimeChange: (seconds: number) => void;
  onSeeking: () => void;
  onDuration: (seconds: number) => void;
};

export function MediaPlayer({ media, playerRef, currentTime, onTimeChange, onSeeking, onDuration }: Props) {
  const [previewError, setPreviewError] = useState(false);
  const isVideo = media.file.name.toLowerCase().endsWith(".mp4");

  function handleTimeUpdate(event: SyntheticEvent<HTMLMediaElement>) {
    onTimeChange(event.currentTarget.currentTime);
  }

  function handleMetadata(event: SyntheticEvent<HTMLMediaElement>) {
    const duration = event.currentTarget.duration;
    if (Number.isFinite(duration) && duration >= 0) onDuration(duration);
  }

  function connectPlayer(element: HTMLMediaElement | null) {
    playerRef.current = element;
  }

  return (
    <section className="panel media-panel flex min-w-0 flex-col overflow-hidden rounded-2xl bg-surface shadow-[0_8px_26px_rgb(32_60_90_/_7%)]" aria-labelledby="player-title">
      <div className="panel-heading flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <h2 id="player-title" className="m-0 text-sm font-semibold text-ink sm:text-base">เล่นสื่อต้นฉบับ</h2>
        <span className="panel-meta text-xs text-ink-muted">ไฟล์อยู่ในเซสชันนี้</span>
      </div>
      <div className="media-frame flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-surface-tint p-2 sm:p-3">
        {isVideo ? (
          <video
            ref={connectPlayer}
            className="aspect-video max-h-[min(55vh,420px)] w-full rounded-lg bg-[#080d19] object-contain shadow-md"
            src={media.url}
            controls
            preload="metadata"
            onSeeking={onSeeking}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleMetadata}
            onError={() => setPreviewError(true)}
            aria-label={"เล่นวิดีโอ " + media.file.name}
          />
        ) : (
          <div className="audio-player-shell flex min-h-52 w-full flex-col items-center justify-center gap-4 rounded-lg bg-surface-soft px-4 py-6 sm:min-h-64 sm:gap-5">
            <div className="grid size-14 place-items-center rounded-2xl border border-line bg-white text-accent shadow-sm" aria-hidden="true">
              <svg className="size-7" viewBox="0 0 32 32" fill="none">
                <path d="M4 13v6m5-10v14m5-18v22m5-16v10m5-13v16m5-12v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <p className="m-0 font-mono text-sm tabular-nums text-ink-muted">{formatTimestamp(currentTime)}</p>
            <audio
              ref={connectPlayer}
              className="min-h-11 w-full max-w-2xl"
              src={media.url}
              controls
              preload="metadata"
              onSeeking={onSeeking}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleMetadata}
              onError={() => setPreviewError(true)}
              aria-label={"เล่นไฟล์เสียง " + media.file.name}
            />
          </div>
        )}
      </div>
      <div className="player-details flex min-h-14 shrink-0 items-center justify-between gap-4 border-t border-line px-4 py-2 sm:px-5">
        <div className="flex min-w-0 flex-col">
          <strong className="player-filename max-w-[65ch] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-ink" title={media.file.name}>{media.file.name}</strong>
          <span className="player-meta text-xs text-ink-muted">{media.durationSeconds === null ? "อ่านความยาวสื่อไม่ได้" : "ความยาว " + formatDuration(media.durationSeconds)}</span>
        </div>
        <span className="player-current-time shrink-0 font-mono text-sm tabular-nums text-accent">{formatTimestamp(currentTime)}</span>
      </div>
      {previewError ? (
        <p className="inline-note m-0 px-4 py-3 text-sm text-ink-muted" role="status">เบราว์เซอร์เล่นตัวอย่างไฟล์นี้ไม่ได้ แต่ยังส่งถอดเสียงและดาวน์โหลดผลได้</p>
      ) : null}
    </section>
  );
}
