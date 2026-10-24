export function formatTimestamp(seconds: number, includeTenths = true): string {
  const safeSeconds = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const totalTenths = Math.floor(safeSeconds * 10);
  const tenths = totalTenths % 10;
  const totalSeconds = Math.floor(totalTenths / 10);
  const secondPart = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutePart = totalMinutes % 60;
  const hourPart = Math.floor(totalMinutes / 60);
  const clock = hourPart > 0
    ? `${String(hourPart).padStart(2, "0")}:${String(minutePart).padStart(2, "0")}:${String(secondPart).padStart(2, "0")}`
    : `${String(totalMinutes).padStart(2, "0")}:${String(secondPart).padStart(2, "0")}`;

  return includeTenths ? `${clock}.${tenths}` : clock;
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "ไม่ทราบขนาด";
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GiB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MiB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KiB`;
  return `${bytes} B`;
}

export function formatDuration(seconds: number): string {
  return formatTimestamp(seconds, false);
}
