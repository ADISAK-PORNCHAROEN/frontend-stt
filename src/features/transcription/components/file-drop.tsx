"use client";

import { useState, type ChangeEvent, type DragEvent } from "react";
import { buttonClassName } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FILE_ACCEPT, MAX_FILE_BYTES, getFileExtension } from "../constants";
import { formatFileSize } from "../format";

type Props = {
  disabled: boolean;
  error: string | null;
  compact?: boolean;
  compactLabel?: string;
  onSelect: (file: File) => void;
  onInvalid: (message: string) => void;
};

export function FileDrop({ disabled, error, compact = false, compactLabel = "เปลี่ยนไฟล์", onSelect, onInvalid }: Props) {
  const [dragging, setDragging] = useState(false);
  const describedBy = compact
    ? error ? "file-error" : undefined
    : error ? "file-help file-error" : "file-help";

  function chooseFile(file: File | undefined) {
    if (!file || disabled) return;
    const extension = getFileExtension(file.name);
    if (!FILE_ACCEPT.split(",").includes("." + extension)) {
      onInvalid("รูปแบบไฟล์นี้ยังไม่รองรับ เลือก MP3, M4A, WAV, FLAC หรือ MP4 ที่มีเสียง");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      onInvalid("ไฟล์มีขนาดเกิน 1 GiB กรุณาเลือกไฟล์ที่เล็กกว่านี้");
      return;
    }
    onSelect(file);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    chooseFile(event.currentTarget.files?.[0]);
    event.currentTarget.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files[0]);
  }

  return (
    <div
      className={[
        "file-drop relative transition-colors",
        compact && disabled
          ? "hidden"
          : compact
            ? "flex min-h-0 flex-wrap justify-end gap-2 rounded-none border-0 bg-transparent px-0 py-0"
            : "grid min-h-0 grid-cols-[44px_minmax(0,1fr)] items-center gap-x-4 gap-y-3 rounded-xl border border-dashed px-4 py-4 sm:min-h-48 sm:grid-cols-[52px_minmax(0,1fr)_auto] sm:px-6 sm:py-6",
        "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent",
        dragging && !disabled ? "is-dragging" : "",
        error ? "has-error" : "",
        dragging && !disabled ? "border-accent bg-accent-soft" : error ? "border-danger bg-danger-soft" : compact ? "border-transparent bg-transparent" : "border-coordinate-soft bg-surface-soft",
        disabled ? "opacity-75" : "",
      ].filter(Boolean).join(" ")}
      onDragEnter={(event) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        if (event.currentTarget === event.target) setDragging(false);
      }}
      onDrop={handleDrop}
    >
      <Input
        className="sr-only"
        id="media-file"
        type="file"
        accept={FILE_ACCEPT}
        disabled={disabled}
        onChange={handleInputChange}
        aria-describedby={describedBy}
      />
      {!compact ? (
        <>
          <div className="drop-icon grid size-11 place-items-center rounded-xl bg-accent-soft text-accent sm:size-[52px]" aria-hidden="true">
            <svg className="size-6 stroke-current stroke-[1.6]" viewBox="0 0 32 32" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21V5m0 0-6 6m6-6 6 6M6 20v6h20v-6" />
            </svg>
          </div>
          <div className="drop-copy min-w-0">
            <h2 className="m-0 text-sm font-semibold text-ink sm:text-base">เลือกไฟล์เสียงหรือวิดีโอ</h2>
            <p id="file-help" className="mb-0 mt-1 text-xs leading-relaxed text-ink-muted sm:text-sm">รองรับ MP3, M4A, WAV, FLAC และ MP4 ที่มีเสียง · ไม่เกิน 1 GiB · ยาวไม่เกิน 2 ชั่วโมง</p>
            <p className="drop-instruction mb-0 mt-1 text-xs leading-relaxed text-ink-muted">หรือลากไฟล์มาวางที่นี่</p>
          </div>
        </>
      ) : null}
      <label className={buttonClassName(compact ? "secondary" : "primary", "file-button whitespace-nowrap " + (disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer")) + (compact ? " min-h-10 px-3 text-xs" : " col-span-2 w-full sm:col-span-1 sm:col-start-3 sm:row-start-1 sm:w-auto")} htmlFor="media-file">
        {compact ? compactLabel : "เลือกไฟล์"}
      </label>
      {!compact ? (
        <>
          <p className="drop-size m-0 hidden text-right font-mono text-xs tabular-nums text-accent sm:col-start-3 sm:row-start-2 sm:block">ขนาดไฟล์สูงสุด {formatFileSize(MAX_FILE_BYTES)}</p>
        </>
      ) : null}
      {error ? <p className="field-error m-0 text-xs text-danger sm:col-span-full" id="file-error" role="status">{error}</p> : null}
    </div>
  );
}
