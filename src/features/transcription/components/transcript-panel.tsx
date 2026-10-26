"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode, type TouchEvent, type WheelEvent } from "react";
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
  activeEdit: { segmentId: number; text: string } | null;
  downloadActions?: ReactNode;
  onReplay: (segment: TranscriptSegment) => void;
  onBeginEdit: (segmentId: number) => void;
  onEdit: (text: string) => void;
  onStageEdit: () => void;
  onCancelEdit: () => void;
  onViewOriginal: () => void;
  onViewLatest: () => void;
  onSave: () => void;
};

function isEditableTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest("textarea, input, select, [contenteditable='true']") !== null;
}

export function TranscriptPanel({
  transcript,
  currentTime,
  isOriginal,
  isDirty,
  isSaving,
  saveState,
  originalState,
  activeEdit,
  downloadActions,
  onReplay,
  onBeginEdit,
  onEdit,
  onStageEdit,
  onCancelEdit,
  onViewOriginal,
  onViewLatest,
  onSave,
}: Props) {
  const lastSegmentIndex = transcript.segments.length - 1;
  const activeSegment = transcript.segments.find((segment, index) =>
    currentTime >= segment.start &&
    (currentTime < segment.end || (index === lastSegmentIndex && currentTime <= segment.end)),
  );
  const listRef = useRef<HTMLOListElement>(null);
  const activeRowRef = useRef<HTMLLIElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const editButtonRefs = useRef(new Map<number, HTMLButtonElement>());
  const focusEditButtonAfterClose = useRef<number | null>(null);
  const [isFollowing, setIsFollowing] = useState(true);

  const scrollActiveRowIntoView = useCallback(() => {
    const list = listRef.current;
    const row = activeRowRef.current;
    if (!list || !row) return;
    const overflowY = window.getComputedStyle(list).overflowY;
    if ((overflowY !== "auto" && overflowY !== "scroll") || list.scrollHeight <= list.clientHeight) return;

    const listBounds = list.getBoundingClientRect();
    const rowBounds = row.getBoundingClientRect();
    const inset = 12;
    let top = list.scrollTop;
    if (rowBounds.top < listBounds.top + inset) top -= listBounds.top + inset - rowBounds.top;
    else if (rowBounds.bottom > listBounds.bottom - inset) top += rowBounds.bottom - (listBounds.bottom - inset);
    if (top === list.scrollTop) return;

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    list.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? "auto" : "smooth" });
  }, []);

  useEffect(() => {
    if (isFollowing) scrollActiveRowIntoView();
  }, [activeSegment?.id, isFollowing, scrollActiveRowIntoView]);

  const activeEditId = activeEdit?.segmentId ?? null;

  useEffect(() => {
    if (activeEditId !== null) {
      editorRef.current?.focus();
      return;
    }
    const segmentId = focusEditButtonAfterClose.current;
    if (segmentId === null) return;
    editButtonRefs.current.get(segmentId)?.focus({ preventScroll: true });
    focusEditButtonAfterClose.current = null;
  }, [activeEditId]);

  useEffect(() => {
    if (saveState.kind === "saved") titleRef.current?.focus({ preventScroll: true });
  }, [saveState.kind]);

  function pauseFollowForManualScroll(): void {
    const list = listRef.current;
    if (!list) return;
    const overflowY = window.getComputedStyle(list).overflowY;
    if ((overflowY === "auto" || overflowY === "scroll") && list.scrollHeight > list.clientHeight) {
      list.scrollTo?.({ top: list.scrollTop, behavior: "auto" });
      setIsFollowing(false);
    }
  }

  function handleWheel(event: WheelEvent<HTMLOListElement>): void {
    if (event.deltaY !== 0 && !isEditableTarget(event.target)) pauseFollowForManualScroll();
  }

  function handleTouchMove(event: TouchEvent<HTMLOListElement>): void {
    if (!isEditableTarget(event.target)) pauseFollowForManualScroll();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLOListElement>): void {
    if (!isEditableTarget(event.target) && ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End"].includes(event.key)) {
      pauseFollowForManualScroll();
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLOListElement>): void {
    if (isEditableTarget(event.target)) return;
    const list = event.currentTarget;
    const scrollbarWidth = list.offsetWidth - list.clientWidth;
    if (scrollbarWidth > 0 && event.clientX >= list.getBoundingClientRect().right - scrollbarWidth) {
      pauseFollowForManualScroll();
    }
  }

  function returnToFollow(): void {
    setIsFollowing(true);
    activeRowRef.current?.querySelector<HTMLButtonElement>(".segment-button")?.focus({ preventScroll: true });
  }

  function stageCurrentEdit(): void {
    if (!activeEdit) return;
    focusEditButtonAfterClose.current = activeEdit.segmentId;
    onStageEdit();
  }

  function cancelCurrentEdit(): void {
    if (!activeEdit) return;
    focusEditButtonAfterClose.current = activeEdit.segmentId;
    onCancelEdit();
  }

  return (
    <section className="panel transcript-panel flex min-w-0 flex-col overflow-hidden rounded-2xl bg-surface shadow-[0_8px_26px_rgb(32_60_90_/_7%)] desktop-fit:h-full desktop-fit:min-h-0" aria-labelledby="transcript-title">
      <div className="panel-heading transcript-heading flex shrink-0 flex-col gap-3 border-b border-line px-4 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 id="transcript-title" ref={titleRef} tabIndex={-1} className="m-0 text-base font-semibold leading-snug text-ink">{isOriginal ? "บทถอดเสียงต้นฉบับ" : "บทถอดเสียง"}</h2>
          <p className="panel-meta m-0 mt-1 text-xs text-ink-muted">{transcript.segments.length} ช่วงเวลา · กดเวลาเพื่อฟังช่วงนี้</p>
        </div>
        <div className="transcript-actions flex flex-wrap items-center justify-start gap-2 lg:justify-end">
          {downloadActions}
          {!isFollowing ? (
            <Button variant="text" className="min-h-10 px-2 text-xs" type="button" onClick={returnToFollow}>
              กลับไปติดตามเสียง
            </Button>
          ) : null}
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
            <Button className="min-h-10 px-3 text-xs" variant="primary" type="button" onClick={onSave} disabled={isSaving || activeEdit !== null}>
              {isSaving ? "กำลังบันทึก" : activeEdit ? "บันทึกช่วงนี้ก่อน" : saveState.kind === "failed" ? "ลองบันทึกอีกครั้ง" : "บันทึกการแก้ไข"}
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
        <ol
          ref={listRef}
          className="transcript-list m-0 min-h-0 flex-1 list-none overflow-y-visible py-2 pl-3 pr-3 desktop-fit:overflow-y-auto desktop-fit:overscroll-contain"
          aria-label="ช่วงของบทถอดเสียง"
          onWheel={handleWheel}
          onTouchMove={handleTouchMove}
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
        >
          {transcript.segments.map((segment) => {
            const isActive = activeSegment?.id === segment.id;
            const timestamp = formatTimestamp(segment.start);
            const rows = Math.max(2, Math.min(5, Math.ceil(segment.text.length / 50)));
            return (
              <li ref={isActive ? activeRowRef : null} className={"transcript-row relative grid min-h-[68px] grid-cols-[20px_minmax(0,1fr)] gap-2 " + (isActive ? "is-active" : "")} data-segment-id={segment.id} key={segment.id}>
                <div className="coordinate-rail relative flex justify-center" aria-hidden="true">
                  <span className={"coordinate-line my-0.5 w-px bg-coordinate-soft " + (isActive ? "bg-accent" : "")} />
                  <span className={"coordinate-point absolute top-5 size-2 rounded-full border border-white bg-coordinate " + (isActive ? "size-2.5 bg-accent ring-2 ring-blue-100" : "")} />
                </div>
                <div className={"segment-content grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-2 rounded-lg border border-transparent p-1.5 " + (isActive ? "bg-accent-soft" : "")}>
                  {activeEdit?.segmentId === segment.id ? (
                    <div className="col-span-2 grid min-w-0 gap-2">
                      <div className="grid min-w-0 grid-cols-[60px_minmax(0,1fr)] items-start gap-2">
                        <button type="button" className="segment-button flex min-h-11 items-start justify-start rounded-md px-1 py-2 text-left text-accent hover:bg-blue-50" onClick={() => onReplay(segment)} aria-current={isActive ? "true" : undefined} aria-label={"เล่นช่วงเวลา " + timestamp}>
                          <time className="segment-time font-mono text-xs leading-relaxed tabular-nums" dateTime={"PT" + segment.start + "S"}>{timestamp}</time>
                        </button>
                        <div className="segment-text flex min-w-0 flex-col items-start gap-1">
                          <Textarea
                            ref={editorRef}
                            className="segment-editor min-h-12 resize-y rounded-lg border-coordinate-soft px-2.5 py-2 text-sm leading-relaxed [overflow-wrap:anywhere]"
                            aria-label={"แก้ไขข้อความช่วงเวลา " + timestamp}
                            value={activeEdit.text}
                            rows={rows}
                            disabled={isSaving}
                            onChange={(event) => onEdit(event.currentTarget.value)}
                          />
                          {isActive ? <span className="segment-state text-[11px] font-medium text-accent">กำลังเล่น</span> : null}
                        </div>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button className="min-h-9 px-3 text-xs" variant="primary" type="button" onClick={stageCurrentEdit} disabled={isSaving}>เก็บช่วงนี้</Button>
                        <Button className="min-h-9 px-3 text-xs" variant="secondary" type="button" onClick={cancelCurrentEdit} disabled={isSaving}>ยกเลิก</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={"segment-button grid min-h-11 w-full min-w-0 grid-cols-[60px_minmax(0,1fr)] items-start gap-2 rounded-md px-1 py-2 text-left text-ink hover:bg-blue-50 " + (isOriginal ? "col-span-2" : "")}
                        onClick={() => onReplay(segment)}
                        aria-current={isActive ? "true" : undefined}
                        aria-label={"เล่นช่วงเวลา " + timestamp + ": " + segment.text}
                      >
                        <time className="segment-time font-mono text-xs leading-relaxed tabular-nums text-accent" dateTime={"PT" + segment.start + "S"}>{timestamp}</time>
                        <span className="segment-copy min-w-0 whitespace-pre-wrap py-0.5 text-sm leading-relaxed [overflow-wrap:anywhere]">{segment.text}</span>
                      </button>
                      {!isOriginal ? (
                        <Button
                          ref={(element) => {
                            if (element) editButtonRefs.current.set(segment.id, element);
                            else editButtonRefs.current.delete(segment.id);
                          }}
                          className="min-h-9 self-start px-2 text-xs"
                          variant="secondary"
                          type="button"
                          aria-label={"แก้ไขข้อความช่วงเวลา " + timestamp}
                          onClick={() => onBeginEdit(segment.id)}
                          disabled={isSaving || activeEdit !== null}
                        >
                          แก้ไข
                        </Button>
                      ) : null}
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
