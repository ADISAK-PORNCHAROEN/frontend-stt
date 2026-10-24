"use client";

import { useRef, useState, type DragEvent, type ChangeEvent } from "react";
import { FILE_ACCEPT, MAX_FILE_BYTES, getFileExtension } from "../constants";
import { formatFileSize } from "../format";

type Props = {
  disabled: boolean;
  error: string | null;
  onSelect: (file: File) => void;
  onInvalid: (message: string) => void;
};

export function FileDrop({ disabled, error, onSelect, onInvalid }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function chooseFile(file: File | undefined) {
    if (!file || disabled) return;
    const extension = getFileExtension(file.name);
    if (!FILE_ACCEPT.split(",").includes(`.${extension}`)) {
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
      className={`file-drop${dragging ? " is-dragging" : ""}${error ? " has-error" : ""}`}
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
      <input
        ref={inputRef}
        className="visually-hidden"
        id="media-file"
        type="file"
        accept={FILE_ACCEPT}
        disabled={disabled}
        onChange={handleInputChange}
        aria-describedby="file-help file-error"
      />
      <div className="drop-icon" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none">
          <path d="M16 21V5m0 0-6 6m6-6 6 6M6 20v6h20v-6" />
        </svg>
      </div>
      <div className="drop-copy">
        <h2>เลือกไฟล์เสียงหรือวิดีโอ</h2>
        <p id="file-help">รองรับ MP3, M4A, WAV, FLAC และ MP4 ที่มีเสียง · ไม่เกิน 1 GiB · ยาวไม่เกิน 2 ชั่วโมง</p>
        <p className="drop-retention">ไฟล์และผลถอดเสียงจัดเก็บชั่วคราวโดย service ตามช่วงเวลาที่แจ้งด้านล่าง</p>
      </div>
      <label className="button button-secondary file-button" htmlFor="media-file">
        เรียกดูไฟล์
      </label>
      <p className="drop-footnote">หรือลากไฟล์มาวางที่นี่</p>
      <p className="drop-size">ขนาดไฟล์สูงสุด {formatFileSize(MAX_FILE_BYTES)}</p>
      <p className="field-error" id="file-error" role="status">{error ?? ""}</p>
    </div>
  );
}
