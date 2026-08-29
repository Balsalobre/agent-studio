import React from "react";
import { BonsaiMark } from "./BonsaiMark";

export interface WordmarkProps {
  /** Wordmark cap height in px (everything scales from this). @default 22 */
  height?: number;
  /** Text color (the "ai" stays accent-blue). */
  color?: string;
  /** Hide the "by Agent Studio" tagline. */
  hideTagline?: boolean;
  /** Hide the bonsai symbol tile. */
  hideMark?: boolean;
}

/**
 * Wordmark — full Bonsai lockup: bonsai tile + "Bonsai" (with "ai" in accent)
 * and a "by Agent Studio" tagline.
 *
 * @example
 * <Wordmark height={24} />
 */
export function Wordmark({ height = 22, color = "var(--fg)", hideTagline, hideMark }: WordmarkProps) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
      {!hideMark && (
        <span
          style={{
            width: height + 12,
            height: height + 12,
            borderRadius: 11,
            background: "var(--tile-bg)",
            border: "1px solid var(--line-2)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <BonsaiMark size={height + 2} />
        </span>
      )}
      <span style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: height * 0.82,
            letterSpacing: "-0.02em",
            color,
          }}
        >
          Bons<span style={{ color: "var(--accent)" }}>ai</span>
        </span>
        {!hideTagline && (
          <span
            style={{
              fontSize: 9.5,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--fg-3)",
              marginTop: 3,
              fontWeight: 600,
            }}
          >
            by Agent Studio
          </span>
        )}
      </span>
    </span>
  );
}

export default Wordmark;
