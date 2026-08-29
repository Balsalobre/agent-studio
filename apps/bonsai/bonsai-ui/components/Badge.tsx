import React from "react";

export type BadgeTone =
  | "accent"
  | "sky"
  | "neutral"
  | "success"
  | "warning"
  | "danger";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Color tone. @default "accent" */
  tone?: BadgeTone;
}

const TONE_CLASS: Record<BadgeTone, string> = {
  accent: "",
  sky: "badge--sky",
  neutral: "badge--neutral",
  success: "badge--success",
  warning: "badge--warning",
  danger: "badge--danger",
};

/**
 * Badge — compact status / category label.
 *
 * @example
 * <Badge tone="success">Resuelta por IA</Badge>
 */
export function Badge({ tone = "accent", className, children, ...rest }: BadgeProps) {
  const cls = ["badge", TONE_CLASS[tone], className].filter(Boolean).join(" ");
  return (
    <span className={cls} {...rest}>
      {children}
    </span>
  );
}

export default Badge;
