import React from "react";
import { ProgressBar } from "./ProgressBar";

export interface ProgressCardProps {
  /** Route / module title. */
  title: string;
  /** Completed steps. */
  done: number;
  /** Total steps. */
  total: number;
  /** Override the encouraging status line. */
  line?: string;
}

/**
 * ProgressCard — route header with a percentage, bar and an encouraging line.
 *
 * @example
 * <ProgressCard title="Onboarding · Liderazgo" done={2} total={6} />
 */
export function ProgressCard({ title, done, total, line }: ProgressCardProps) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  const msg =
    line ??
    (pct === 100
      ? "¡Ruta completada! Has cerrado todos los pasos."
      : done === 0
      ? "Empieza por el primer paso, no hay prisa."
      : `Vas bien, ${done} de ${total} pasos hechos. Sigue a tu ritmo.`);
  return (
    <div className="pcard">
      <div className="pcard-top">
        <span className="pcard-title">{title}</span>
        <span className="pcard-pct">{pct}%</span>
      </div>
      <ProgressBar className="pcard-bar" value={pct} />
      <div className="pcard-line">{msg}</div>
    </div>
  );
}

export default ProgressCard;
