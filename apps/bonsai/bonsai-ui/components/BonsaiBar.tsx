import React from "react";
import { Icon } from "./Icon";
import { BonsaiMark } from "./BonsaiMark";

export interface BonsaiBarProps {
  /** 1-based index of the step the learner is on. */
  stepIndex: number;
  /** Title of that step. */
  stepTitle: string;
  /** Placeholder for the input. @default "Pregúntale a Bonsai…" */
  placeholder?: string;
  /** Click handler — open the assistant. */
  onOpen?: () => void;
}

/**
 * BonsaiBar — persistent "ask the assistant" footer with a memory recall line.
 *
 * @example
 * <BonsaiBar stepIndex={3} stepTitle="Tu primera conversación" onOpen={openChat} />
 */
export function BonsaiBar({ stepIndex, stepTitle, placeholder = "Pregúntale a Bonsai…", onOpen }: BonsaiBarProps) {
  return (
    <div className="sbar">
      <div className="sbar-recall">
        <span className="sbar-mark">
          <BonsaiMark size={14} />
        </span>
        <span>
          Bonsai recuerda: vas por el paso <b>{stepIndex}</b> ({stepTitle}).
        </span>
      </div>
      <button className="sbar-open" onClick={onOpen} type="button">
        <Icon name="message" size={18} color="var(--accent)" />
        <span className="sbar-txt">{placeholder}</span>
        <span className="sbar-send">
          <Icon name="send" size={17} color="#fff" />
        </span>
      </button>
    </div>
  );
}

export default BonsaiBar;
