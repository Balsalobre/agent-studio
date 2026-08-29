import React from "react";

export type ButtonVariant = "default" | "accent" | "ghost" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. @default "default" */
  variant?: ButtonVariant;
  /** Size. @default "md" */
  size?: ButtonSize;
  /** Stretch to full width. */
  block?: boolean;
  /** Render as a square icon-only button. */
  icon?: boolean;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  default: "",
  accent: "btn--accent",
  ghost: "btn--ghost",
  outline: "btn--outline",
};

/**
 * Button — primary action element.
 *
 * @example
 * <Button variant="accent" size="sm">Continuar</Button>
 */
export function Button({
  variant = "default",
  size = "md",
  block,
  icon,
  className,
  children,
  ...rest
}: ButtonProps) {
  const cls = [
    "btn",
    VARIANT_CLASS[variant],
    size === "sm" ? "btn--sm" : size === "lg" ? "btn--lg" : "",
    block ? "btn--block" : "",
    icon ? "btn--icon" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}

export default Button;
