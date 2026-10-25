"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { formatTimestamp } from "../format";
import type { Transcript, TranscriptSegment } from "../types";

type Props = {
  transcript: Transcript;
  currentTime: number;
  isOriginal: boolean;
  isDirty: boolean;
  isSaving: boolean;
  saveState: { kind: "idle" } | { kind: "saving" } | { kind: "saved" } | { kind: "failed"; message: string };
  originalState: { kind: "unloaded" } | { kind: "loading" } | { kind: "loaded"; transcript: Transcript } | { kind: "failed"; message: string };
  onReplay: (segment: TranscriptSegment) => void;
  onEdit: (segmentId: number, text: string) => void;
  onViewOriginal: () => void;
  onViewLatest: () => void;
  onSave: () => void;
};

export function TranscriptPanel({
  transcript,
  currentTime,
  isOriginal,
  isDirty,
  isSaving,
  saveState,
  originalState,
  onReplay,
  onEdit,
  onViewOriginal,
  onViewLatest,
  onSave,
}: Props) {
  const lastSegmentIndex = transcript.segments.length - 1;
  const activeSegment = transcript.segments.find((segment, index) =>
    currentTime >= segment.start &&
    (currentTime < segment.end || (index === lastSegmentIndex && currentTime <= segment.end)),
  );
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeSegment?.id]);

  return (
    <section className="panel transcript-panel" aria-labelledby="transcript-title">
      <div className="panel-heading transcript-heading">
        <div>
          <h2 id="transcript-title">{isOriginal ? "บทถอดเสียงต้นฉบับ" : "บทถอดเสียง"}</h2>
          <p className="panel-meta">{transcript.segments.length} ช่วงเวลา · กดเวลาเพื่อฟังช่วงนี้</p>
        </div>
        <div className="transcript-actions">
          <Button
            variant="text"
            type="button"
            disabled={originalState.kind === "loading"}
            onClick={isOriginal ? onViewLatest : onViewOriginal}
          >
            {originalState.kind === "loading" ? "กำลังโหลดต้นฉบับ" : isOriginal ? "กลับไปฉบับแก้ไข" : "ดูต้นฉบับ"}
          </Button>
          {!isOriginal && isDirty ? (
            <Button variant="primary" type="button" onClick={onSave} disabled={isSaving}>
              {isSaving ? "กำลังบันทึก" : "บันทึกการแก้ไข"}
            </Button>
          ) : null}
        </div>
      </div>

      {isDirty ? (
        <p className="unsaved-note" role="status">มีการแก้ไขที่ยังไม่ได้บันทึก · บันทึกก่อนดาวน์โหลด</p>
      ) : saveState.kind === "saved" ? (
        <p className="review-saved-note" role="status">บันทึกแล้ว · ไฟล์ดาวน์โหลดใช้ฉบับล่าสุด</p>
      ) : null}
      {saveState.kind === "failed" ? <p className="review-error" role="alert">{saveState.message}</p> : null}
      {originalState.kind === "failed" ? <p className="review-error" role="alert">{originalState.message}</p> : null}

      {transcript.segments.length === 0 ? (
        <div className="transcript-empty" role="status">
          <p>ไม่พบคำพูดในไฟล์นี้</p>
          <span>ลองตรวจเสียงต้นฉบับ หรือเลือกไฟล์อื่นเพื่อถอดเสียงใหม่</span>
        </div>
      ) : (
        <ol className="transcript-list" aria-label="ช่วงของบทถอดเสียง">
          {transcript.segments.map((segment) => {
            const isActive = activeSegment?.id === segment.id;
            const timestamp = formatTimestamp(segment.start);
            const rows = Math.max(2, Math.min(5, Math.ceil(segment.text.length / 50)));
            return (
              <li className={`transcript-row${isActive ? " is-active" : ""}`} data-segment-id={segment.id} key={segment.id}>
                <div className="coordinate-rail" aria-hidden="true">
                  <span className="coordinate-line" />
                  <span className="coordinate-point" />
                </div>
                <div className="segment-content">
                  <button
                    ref={isActive ? activeRef : null}
                    type="button"
                    className="segment-button"
                    onClick={() => onReplay(segment)}
                    aria-current={isActive ? "true" : undefined}
                    aria-label={`เล่นช่วงเวลา ${timestamp}`}
                  >
                    <time className="segment-time" dateTime={`PT${segment.start}S`}>{timestamp}</time>
                  </button>
                  <div className="segment-text">
                    {isOriginal ? (
                      <p className="segment-copy">{segment.text}</p>
                    ) : (
                      <textarea
                        className="segment-editor"
                        aria-label={`แก้ไขข้อความช่วงเวลา ${timestamp}`}
                        value={segment.text}
                        rows={rows}
                        disabled={isSaving}
                        onChange={(event) => onEdit(segment.id, event.currentTarget.value)}
                      />
                    )}
                    {isActive ? <span className="segment-state">กำลังเล่น</span> : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
