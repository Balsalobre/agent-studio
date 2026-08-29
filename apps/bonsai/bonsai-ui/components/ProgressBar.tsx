import React from "react";

export type ProgressTone = "accent" | "sky" | "success";

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 0–100. */
  value: number;
  /** Bar color. @default "accent" */
  tone?: ProgressTone;
  /** Thinner 6px track. */
  thin?: boolean;
}

/**
 * ProgressBar — horizontal completion meter.
 *
 * @example
 * <ProgressBar value={33} />
 */
export function ProgressBar({ value, tone = "accent", thin, className, ...rest }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value));
  const cls = [
    "progress",
    thin ? "progress--thin" : "",
    tone === "sky" ? "progress--sky" : tone === "success" ? "progress--success" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={cls} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} {...rest}>
      <span style={{ width: pct + "%" }} />
    </div>
  );
}

export default ProgressBar;
