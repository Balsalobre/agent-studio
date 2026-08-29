import React from "react";
import { Icon, IconName } from "./Icon";
import { ResourceChip, ResourceType } from "./ResourceChip";

export type StepStatus = "completed" | "in_progress" | "pending";
export type CompletionType = "consume" | "evaluation" | "quiz";

const COMPLETION_META: Record<CompletionType, { icon: IconName; label: string }> = {
  consume: { icon: "book", label: "Lectura" },
  evaluation: { icon: "award", label: "Evaluación" },
  quiz: { icon: "lightbulb", label: "Quiz" },
};

export interface StepResource {
  title: string;
  type: ResourceType;
  measure?: string;
  onOpen?: () => void;
}

export interface StepCardProps {
  /** 1-based step number, shown in the status circle when pending. */
  order: number;
  title: string;
  objective: string;
  status: StepStatus;
  completion: CompletionType;
  resources?: StepResource[];
  /** Highlight as the active step + show the CTA. */
  current?: boolean;
  /** Hide the connector line (use on the last step). */
  last?: boolean;
  /** CTA label (only shown when `current`). @default "Continuar con Bonsai" */
  ctaLabel?: string;
  onCta?: () => void;
}

/**
 * StepCard — one node of a learning route, with status, resources and an
 * optional "current step" CTA.
 */
export function StepCard({
  order,
  title,
  objective,
  status,
  completion,
  resources = [],
  current,
  last,
  ctaLabel = "Continuar con Bonsai",
  onCta,
}: StepCardProps) {
  const comp = COMPLETION_META[completion] ?? COMPLETION_META.consume;
  const stateClass = current ? "step--current" : status === "completed" ? "step--done" : status === "pending" ? "step--pending" : "";
  return (
    <div className={["step", stateClass].filter(Boolean).join(" ")}>
      <div className="step-rail">
        <span className={"step-dot step-dot--" + status}>
          {status === "completed" ? (
            <Icon name="check" size={17} color="#06231a" />
          ) : status === "in_progress" ? (
            <Icon name="play" size={15} color="#fff" />
          ) : (
            order
          )}
        </span>
        {!last && <span className="step-conn" />}
      </div>
      <div className="step-main">
        <div className="step-row1">
          <span className="step-title">{title}</span>
          <span className="step-badge">
            <Icon name={comp.icon} size={12} /> {comp.label}
          </span>
        </div>
        <div className="step-obj">{objective}</div>
        {resources.length > 0 && (
          <div className="step-chips">
            {resources.map((r, i) => (
              <ResourceChip key={i} {...r} />
            ))}
          </div>
        )}
        {current && (
          <div className="step-cta">
            <button className="btn btn--accent btn--sm" onClick={onCta} type="button">
              {ctaLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default StepCard;
