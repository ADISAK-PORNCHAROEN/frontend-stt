import type { ComponentProps } from "react";

export function Select({ className = "", ...props }: ComponentProps<"select">) {
  return (
    <select
      {...props}
      className={[
        "min-h-11 w-full cursor-pointer rounded-lg border border-coordinate-soft bg-surface px-3 py-2 text-sm text-ink",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        "disabled:cursor-not-allowed disabled:bg-surface-soft disabled:text-ink-muted",
        className,
      ].filter(Boolean).join(" ")}
    />
  );
}
