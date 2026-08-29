import React from "react";
import { Icon } from "./Icon";

export interface RankedItem {
  /** The question / row label. */
  question: string;
  /** Volume count. */
  count: number;
  /** Trend string, e.g. "+18%" or "-3%". */
  trend?: string;
  /** Category / topic. */
  topic?: string;
  /** Whether the AI resolved it. */
  resolved?: boolean;
}

export interface RankedListProps {
  items: RankedItem[];
  /** Show the resolved / unresolved flag. @default true */
  showFlag?: boolean;
}

/**
 * RankedList — ordered list of most-asked questions with volume, trend and
 * resolution flag. Pair with <Panel> for a titled container.
 */
export function RankedList({ items, showFlag = true }: RankedListProps) {
  return (
    <div>
      {items.map((it, i) => (
        <div className="rank" key={i}>
          <span className="rank-n">{i + 1}</span>
          <div className="rank-main">
            <div className="rank-q">{it.question}</div>
            <div className="rank-meta">
              {it.topic && <span className="rank-topic">{it.topic}</span>}
              {showFlag && it.resolved !== undefined && (
                <span className={"rank-flag " + (it.resolved ? "rank-flag--ok" : "rank-flag--miss")}>
                  <Icon name={it.resolved ? "check" : "x"} size={11} />{" "}
                  {it.resolved ? "Resuelta por IA" : "Sin respuesta"}
                </span>
              )}
            </div>
          </div>
          <div className="rank-count">
            <div className="c">{it.count}</div>
            {it.trend && (
              <div className="tr" style={{ color: it.trend.startsWith("-") ? "var(--danger)" : "var(--success)" }}>
                {it.trend}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default RankedList;
