import type { ComponentProps } from "react";

const variantClasses = {
  primary: "border border-transparent bg-accent text-white hover:bg-accent-hover",
  secondary: "border border-coordinate-soft bg-transparent text-ink hover:border-accent hover:bg-accent-soft",
  text: "border border-transparent bg-transparent text-accent underline underline-offset-4 hover:bg-accent-soft",
} as const;

export type ButtonVariant = keyof typeof variantClasses;

export type ButtonProps = ComponentProps<"button"> & {
  variant: ButtonVariant;
};

export function buttonClassName(variant: ButtonVariant, className = ""): string {
  return [
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-center text-sm leading-snug font-semibold transition-colors motion-reduce:transition-none",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    "disabled:cursor-not-allowed disabled:opacity-55",
    variantClasses[variant],
    className,
  ].filter(Boolean).join(" ");
}

export function Button({ variant, className, ...props }: ButtonProps) {
  return <button {...props} className={buttonClassName(variant, className)} />;
}
