import React from "react";
import { Icon } from "./Icon";

export interface KPICardProps {
  /** Metric label. */
  label: string;
  /** Big value (formatted string). */
  value: string;
  /** Delta / sublabel (e.g. "+12% vs. mes anterior"). */
  delta?: string;
  /** Direction of the delta — colors it and picks the arrow. @default "up" */
  trend?: "up" | "down";
  /** Color of the left accent bar (CSS color or var). @default var(--accent) */
  accent?: string;
  /** Color the big value with the danger token (for "bad is up" metrics). */
  danger?: boolean;
}

/**
 * KPICard — single headline metric with an accent bar and a trend delta.
 *
 * @example
 * <KPICard label="Preguntas este mes" value="3.482" delta="+12%" trend="up" />
 */
export function KPICard({ label, value, delta, trend = "up", accent = "var(--accent)", danger }: KPICardProps) {
  return (
    <div className="kpi bui-rise">
      <span className="kpi-bar" style={{ background: accent }} />
      <div className="kpi-k">{label}</div>
      <div className="kpi-v" style={{ color: danger ? "var(--danger)" : "var(--fg)" }}>
        {value}
      </div>
      {delta && (
        <div className="kpi-d" style={{ color: trend === "up" ? "var(--success)" : "var(--danger)" }}>
          <Icon name={trend === "up" ? "trending" : "chevronDown"} size={13} /> {delta}
        </div>
      )}
    </div>
  );
}

export default KPICard;
