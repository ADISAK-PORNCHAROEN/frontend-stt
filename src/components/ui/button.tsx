import type { ComponentProps } from "react";

const variantClasses = {
  primary: "button button-primary",
  secondary: "button button-secondary",
  text: "text-button",
} as const;

export type ButtonVariant = keyof typeof variantClasses;

export type ButtonProps = ComponentProps<"button"> & {
  variant: ButtonVariant;
};

export function Button({ variant, className, ...props }: ButtonProps) {
  const classes = className ? `${variantClasses[variant]} ${className}` : variantClasses[variant];

  return <button {...props} className={classes} />;
}
