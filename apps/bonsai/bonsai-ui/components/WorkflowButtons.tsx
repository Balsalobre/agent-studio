import React from "react";
import { Icon, IconName } from "./Icon";

export interface Workflow {
  /** Stable key passed back to onPick. */
  key: string;
  /** Short label shown on the pill. */
  label: string;
  /** Leading icon. */
  icon: IconName;
}

export interface WorkflowButtonsProps {
  /** The (usually three) main workflows. */
  workflows: Workflow[];
  /** Fired with the picked workflow's key. */
  onPick?: (key: string) => void;
}

/**
 * WorkflowButtons — the row of main workflow pills shown under the composer.
 *
 * @example
 * <WorkflowButtons
 *   workflows={[
 *     { key: "goal", label: "Mi objetivo semanal", icon: "target" },
 *     { key: "fivemin", label: "Repaso en 5 min", icon: "clock" },
 *     { key: "news", label: "Mi newsletter", icon: "mail" },
 *   ]}
 *   onPick={(k) => run(k)}
 * />
 */
export function WorkflowButtons({ workflows, onPick }: WorkflowButtonsProps) {
  return (
    <div className="workflows">
      {workflows.map((w) => (
        <button key={w.key} className="wf" onClick={() => onPick?.(w.key)} type="button">
          <Icon name={w.icon} size={17} />
          <span>{w.label}</span>
        </button>
      ))}
    </div>
  );
}

export default WorkflowButtons;
