"use client";

import { useEffect, useRef } from "react";
import { formatTimestamp } from "../format";
import type { Transcript } from "../types";

type Props = {
  transcript: Transcript;
  currentTime: number;
  onSeek: (seconds: number) => void;
};

export function TranscriptPanel({ transcript, currentTime, onSeek }: Props) {
  const activeSegment = transcript.segments.find(
    (segment) => currentTime >= segment.start && currentTime <= segment.end,
  );
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeSegment?.id]);

  return (
    <section className="panel transcript-panel" aria-labelledby="transcript-title">
      <div className="panel-heading">
        <div>
          <h2 id="transcript-title">บทถอดเสียง</h2>
          <p className="panel-meta">
            {transcript.segments.length} ช่วงเวลา · กดเวลาเพื่อข้ามไปยังคลิป
          </p>
        </div>
        <span className="read-only-label">อ่านอย่างเดียว</span>
      </div>
      {transcript.segments.length === 0 ? (
        <div className="transcript-empty" role="status">
          <p>ไม่พบคำพูดในไฟล์นี้</p>
          <span>ลองตรวจเสียงต้นฉบับ หรือเลือกไฟล์อื่นเพื่อถอดเสียงใหม่</span>
        </div>
      ) : (
        <ol className="transcript-list" aria-label="ช่วงของบทถอดเสียง">
          {transcript.segments.map((segment) => {
            const isActive = activeSegment?.id === segment.id;
            return (
              <li className={`transcript-row${isActive ? " is-active" : ""}`} key={segment.id}>
                <div className="coordinate-rail" aria-hidden="true">
                  <span className="coordinate-line" />
                  <span className="coordinate-point" />
                </div>
                <button
                  ref={isActive ? activeRef : null}
                  type="button"
                  className="segment-button"
                  onClick={() => onSeek(segment.start)}
                  aria-current={isActive ? "true" : undefined}
                  aria-label={`เล่นจาก ${formatTimestamp(segment.start)}: ${segment.text}`}
                >
                  <time className="segment-time" dateTime={`PT${segment.start}S`}>
                    {formatTimestamp(segment.start)}
                  </time>
                  <span className="segment-copy">{segment.text}</span>
                  {isActive ? <span className="segment-state">กำลังเล่น</span> : null}
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
