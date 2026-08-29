import React from "react";
import { ProgressBar } from "./ProgressBar";

export interface TopicDatum {
  /** Topic name. */
  topic: string;
  /** Percentage share (0–100) — also drives the bar width. */
  pct: number;
  /** Optional absolute count shown next to the percentage. */
  count?: number;
}

export interface TopicBarsProps {
  data: TopicDatum[];
  /** Bar color tone. @default "accent" */
  tone?: "accent" | "sky";
}

/**
 * TopicBars — horizontal share-of-volume bars (e.g. most-consulted topics).
 * Bars are normalized so the largest fills the track.
 */
export function TopicBars({ data, tone = "accent" }: TopicBarsProps) {
  const max = Math.max(1, ...data.map((d) => d.pct));
  return (
    <div>
      {data.map((d, i) => (
        <div className="tbar" key={i}>
          <div className="tbar-top">
            <span className="tbar-name">{d.topic}</span>
            <span className="tbar-val">
              {d.count != null ? `${d.count} · ` : ""}
              {d.pct}%
            </span>
          </div>
          <ProgressBar value={(d.pct / max) * 100} tone={tone} thin />
        </div>
      ))}
    </div>
  );
}

export default TopicBars;
