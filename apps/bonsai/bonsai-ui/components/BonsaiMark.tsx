import React from "react";

export interface BonsaiMarkProps {
  /** Rendered width in px (height scales to keep aspect). @default 28 */
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * BonsaiMark — the Bonsai brand symbol: a multi-canopy bonsai with spreading
 * roots, drawn in tonal blues with a white trunk so it reads on dark surfaces.
 *
 * @example
 * <BonsaiMark size={40} />
 */
export function BonsaiMark({ size = 28, style, className }: BonsaiMarkProps) {
  const deep = "#0A1E47"; // roots, branches, darkest canopies
  const trunk = "#FFFFFF"; // main trunk
  const navy = "#13316E"; // dark canopies
  const accent = "#2F6CFF"; // primary blue canopies
  const light = "#7FA8FF"; // light canopies
  const pale = "#BBD0FF"; // lightest canopies
  return (
    <svg
      width={size}
      height={size * (126 / 134)}
      viewBox="0 0 134 126"
      fill="none"
      style={style}
      className={className}
      aria-hidden="true"
    >
      <path d="M24 123 C45 114 52 104 60 92 C62 96 64 98 66.5 98 C69 98 71 96 73 92 C82 105 90 114 110 123 C88 120 76 121 67 124 C57 121 45 120 24 123 Z" fill={deep} />
      <g stroke={deep} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M60 96 C58 86 67 82 65 73 C64 65 71 62 71 54" strokeWidth="8" stroke={trunk} />
        <path d="M71 55 C71 47 63 43 57 37" strokeWidth="6" />
        <path d="M71 56 C74 48 79 42 81 36" strokeWidth="5" />
        <path d="M67 62 C59 57 51 53 47 45" strokeWidth="5" />
        <path d="M52 52 L48 47 M52 52 L57 50" strokeWidth="2.4" />
        <path d="M69 73 C78 75 85 75 91 75" strokeWidth="6" />
        <path d="M57 90 C47 84 39 80 31 74" strokeWidth="6" />
        <path d="M43 81 C45 75 49 73 50 69 M40 79 L36 75 M40 79 L45 77" strokeWidth="2.4" />
      </g>
      <circle cx="57" cy="27" r="20" fill={navy} />
      <circle cx="88" cy="40" r="7" fill={deep} />
      <circle cx="114" cy="70" r="9" fill={navy} />
      <circle cx="31" cy="74" r="22" fill={accent} />
      <circle cx="81" cy="35" r="15" fill={light} />
      <circle cx="92" cy="76" r="20" fill={light} />
      <circle cx="47" cy="44" r="16" fill={pale} />
      <circle cx="51" cy="70" r="8" fill={pale} />
      <circle cx="18" cy="88" r="14" fill={light} />
      <circle cx="121" cy="80" r="8" fill={pale} />
    </svg>
  );
}

export default BonsaiMark;
