"use client";

import { useState, type RefObject, type SyntheticEvent } from "react";
import { formatDuration, formatTimestamp } from "../format";
import type { MediaFile } from "../types";

type Props = {
  media: MediaFile;
  playerRef: RefObject<HTMLMediaElement | null>;
  currentTime: number;
  onTimeChange: (seconds: number) => void;
  onDuration: (seconds: number) => void;
};

export function MediaPlayer({ media, playerRef, currentTime, onTimeChange, onDuration }: Props) {
  const [previewError, setPreviewError] = useState(false);
  const isVideo = media.file.name.toLowerCase().endsWith(".mp4");

  function handleTimeUpdate(event: SyntheticEvent<HTMLMediaElement>) {
    onTimeChange(event.currentTarget.currentTime);
  }

  function handleMetadata(event: SyntheticEvent<HTMLMediaElement>) {
    const duration = event.currentTarget.duration;
    if (Number.isFinite(duration) && duration >= 0) onDuration(duration);
  }

  return (
    <section className="panel media-panel" aria-labelledby="player-title">
      <div className="panel-heading">
        <h2 id="player-title">เล่นสื่อต้นฉบับ</h2>
        <span className="panel-meta">ไฟล์อยู่ในเซสชันนี้</span>
      </div>
      <div className="media-frame">
        {isVideo ? (
          <video
            ref={(element) => {
              playerRef.current = element;
            }}
            src={media.url}
            controls
            preload="metadata"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleMetadata}
            onError={() => setPreviewError(true)}
            aria-label={`เล่นวิดีโอ ${media.file.name}`}
          />
        ) : (
          <div className="audio-player-shell">
            <div className="audio-diagram" aria-hidden="true">
              <span className="orbit orbit-one" />
              <span className="orbit orbit-two" />
              <span className="orbit-point point-one" />
              <span className="orbit-point point-two" />
              <span className="orbit-point point-three" />
              <span className="orbit-readout">{formatTimestamp(currentTime)}</span>
            </div>
            <audio
              ref={(element) => {
                playerRef.current = element;
              }}
              src={media.url}
              controls
              preload="metadata"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleMetadata}
              onError={() => setPreviewError(true)}
              aria-label={`เล่นไฟล์เสียง ${media.file.name}`}
            />
          </div>
        )}
      </div>
      <div className="player-details">
        <div>
          <strong className="player-filename" title={media.file.name}>{media.file.name}</strong>
          <span className="player-meta">{media.durationSeconds === null ? "อ่านความยาวสื่อไม่ได้" : `ความยาว ${formatDuration(media.durationSeconds)}`}</span>
        </div>
        <span className="player-current-time">{formatTimestamp(currentTime)}</span>
      </div>
      {previewError ? (
        <p className="inline-note" role="status">เบราว์เซอร์เล่นตัวอย่างไฟล์นี้ไม่ได้ แต่ยังส่งถอดเสียงและดาวน์โหลดผลได้</p>
      ) : null}
    </section>
  );
}
