"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  downloadActions?: ReactNode;
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
  downloadActions,
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
    <section className="panel transcript-panel flex min-w-0 flex-col overflow-hidden rounded-2xl bg-surface shadow-[0_8px_26px_rgb(32_60_90_/_7%)] desktop-fit:h-full desktop-fit:min-h-0" aria-labelledby="transcript-title">
      <div className="panel-heading transcript-heading flex shrink-0 flex-col gap-3 border-b border-line px-4 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 id="transcript-title" className="m-0 text-base font-semibold leading-snug text-ink">{isOriginal ? "บทถอดเสียงต้นฉบับ" : "บทถอดเสียง"}</h2>
          <p className="panel-meta m-0 mt-1 text-xs text-ink-muted">{transcript.segments.length} ช่วงเวลา · กดเวลาเพื่อฟังช่วงนี้</p>
        </div>
        <div className="transcript-actions flex flex-wrap items-center justify-start gap-2 lg:justify-end">
          {downloadActions}
          <Button
            variant="text"
            className="min-h-10 px-2 text-xs"
            type="button"
            disabled={originalState.kind === "loading"}
            onClick={isOriginal ? onViewLatest : onViewOriginal}
          >
            {originalState.kind === "loading" ? "กำลังโหลดต้นฉบับ" : isOriginal ? "กลับไปฉบับแก้ไข" : "ดูต้นฉบับ"}
          </Button>
          {!isOriginal && isDirty ? (
            <Button className="min-h-10 px-3 text-xs" variant="primary" type="button" onClick={onSave} disabled={isSaving}>
              {isSaving ? "กำลังบันทึก" : "บันทึกการแก้ไข"}
            </Button>
          ) : null}
        </div>
      </div>

      {isDirty ? (
        <p className="unsaved-note m-0 border-b border-line bg-accent-soft px-4 py-2 text-xs text-ink" role="status">มีการแก้ไขที่ยังไม่ได้บันทึก · บันทึกก่อนดาวน์โหลด</p>
      ) : saveState.kind === "saved" ? (
        <p className="review-saved-note m-0 border-b border-line bg-emerald-50 px-4 py-2 text-xs text-success" role="status">บันทึกแล้ว · ไฟล์ดาวน์โหลดใช้ฉบับล่าสุด</p>
      ) : null}
      {saveState.kind === "failed" ? <p className="review-error m-0 border-b border-line bg-danger-soft px-4 py-2 text-xs text-danger" role="alert">{saveState.message}</p> : null}
      {originalState.kind === "failed" ? <p className="review-error m-0 border-b border-line bg-danger-soft px-4 py-2 text-xs text-danger" role="alert">{originalState.message}</p> : null}

      {transcript.segments.length === 0 ? (
        <div className="transcript-empty grid flex-1 place-items-center px-6 py-8 text-center" role="status">
          <div>
            <p className="m-0 text-sm font-medium text-ink">ไม่พบคำพูดในไฟล์นี้</p>
            <span className="mt-2 block text-xs text-ink-muted">ลองตรวจเสียงต้นฉบับ หรือเลือกไฟล์อื่นเพื่อถอดเสียงใหม่</span>
          </div>
        </div>
      ) : (
        <ol className="transcript-list m-0 min-h-0 flex-1 list-none overflow-y-visible py-2 pl-3 pr-3 desktop-fit:overflow-y-auto desktop-fit:overscroll-contain" aria-label="ช่วงของบทถอดเสียง">
          {transcript.segments.map((segment) => {
            const isActive = activeSegment?.id === segment.id;
            const timestamp = formatTimestamp(segment.start);
            const rows = Math.max(2, Math.min(5, Math.ceil(segment.text.length / 50)));
            return (
              <li className={"transcript-row relative grid min-h-[68px] grid-cols-[20px_minmax(0,1fr)] gap-2 " + (isActive ? "is-active" : "")} data-segment-id={segment.id} key={segment.id}>
                <div className="coordinate-rail relative flex justify-center" aria-hidden="true">
                  <span className={"coordinate-line my-0.5 w-px bg-coordinate-soft " + (isActive ? "bg-accent" : "")} />
                  <span className={"coordinate-point absolute top-5 size-2 rounded-full border border-white bg-coordinate " + (isActive ? "size-2.5 bg-accent ring-2 ring-blue-100" : "")} />
                </div>
                <div className={"segment-content grid min-w-0 grid-cols-[60px_minmax(0,1fr)] items-start gap-2 rounded-lg border border-transparent p-1.5 " + (isActive ? "bg-accent-soft shadow-[inset_3px_0_0_var(--accent)]" : "")}>
                  <button
                    ref={isActive ? activeRef : null}
                    type="button"
                    className="segment-button flex min-h-11 items-start justify-start rounded-md px-1 py-2 text-left text-accent hover:bg-blue-50"
                    onClick={() => onReplay(segment)}
                    aria-current={isActive ? "true" : undefined}
                    aria-label={"เล่นช่วงเวลา " + timestamp}
                  >
                    <time className="segment-time font-mono text-xs leading-relaxed tabular-nums" dateTime={"PT" + segment.start + "S"}>{timestamp}</time>
                  </button>
                  <div className="segment-text flex min-w-0 flex-col items-start gap-1">
                    {isOriginal ? (
                      <p className="segment-copy m-0 min-w-0 py-2 text-sm leading-relaxed text-ink [overflow-wrap:anywhere]">{segment.text}</p>
                    ) : (
                      <Textarea
                        className="segment-editor min-h-12 resize-y rounded-lg border-coordinate-soft px-2.5 py-2 text-sm leading-relaxed [overflow-wrap:anywhere]"
                        aria-label={"แก้ไขข้อความช่วงเวลา " + timestamp}
                        value={segment.text}
                        rows={rows}
                        disabled={isSaving}
                        onChange={(event) => onEdit(segment.id, event.currentTarget.value)}
                      />
                    )}
                    {isActive ? <span className="segment-state text-[11px] font-medium text-accent">กำลังเล่น</span> : null}
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
