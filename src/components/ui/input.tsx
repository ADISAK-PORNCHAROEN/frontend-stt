import type { ComponentProps } from "react";

const inputClasses = [
  "min-h-11 w-full rounded-lg border border-coordinate-soft bg-surface px-3 py-2 text-sm text-ink",
  "placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
  "disabled:cursor-not-allowed disabled:bg-surface-soft disabled:text-ink-muted",
].join(" ");

export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return <input {...props} className={inputClasses + " " + className} />;
}
