export const MAX_FILE_BYTES = 1024 ** 3;
export const MAX_FILE_DURATION_SECONDS = 2 * 60 * 60;
export const ALLOWED_EXTENSIONS = ["mp3", "m4a", "wav", "flac", "mp4"] satisfies readonly string[];
export const FILE_ACCEPT = ALLOWED_EXTENSIONS.map((extension) => `.${extension}`).join(",");

export function getFileExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex < 0 ? "" : fileName.slice(dotIndex + 1).toLowerCase();
}
