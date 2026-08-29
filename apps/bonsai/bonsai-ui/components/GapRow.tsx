import React from "react";
import { Icon } from "./Icon";

export interface GapRowProps {
  /** Topic with insufficient content. */
  topic: string;
  /** Why it's a gap (e.g. "Sin documento indexado"). */
  note: string;
  /** Count of unresolved questions. */
  miss: number;
}

/**
 * GapRow — a content gap: something people ask that the AI can't resolve well.
 *
 * @example
 * <GapRow topic="Política de teletrabajo 2026" note="Sin documento indexado" miss={63} />
 */
export function GapRow({ topic, note, miss }: GapRowProps) {
  return (
    <div className="gap">
      <span className="gap-ico">
        <Icon name="search" size={15} />
      </span>
      <div className="gap-main">
        <div className="gap-t">{topic}</div>
        <div className="gap-n">{note}</div>
      </div>
      <div className="gap-miss">
        <b>{miss}</b>sin resolver
      </div>
    </div>
  );
}

export default GapRow;
