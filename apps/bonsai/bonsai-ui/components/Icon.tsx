import React from "react";

/** Names of every icon in the Bonsai set. */
export type IconName =
  | "message" | "plus" | "sparkles" | "clock" | "target" | "mail" | "book"
  | "route" | "file" | "play" | "pause" | "volume" | "send" | "mic" | "clip"
  | "search" | "check" | "chevronRight" | "chevronDown" | "arrowRight" | "x"
  | "settings" | "users" | "chart" | "shield" | "coins" | "upload" | "flame"
  | "bookmark" | "lightbulb" | "dots" | "calendar" | "cap" | "layers"
  | "trending" | "euro" | "globe" | "grid" | "star" | "refresh" | "home"
  | "pin" | "bell" | "download" | "filter" | "award" | "external";

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
  className?: string;
}

const PATHS: Record<IconName, React.ReactNode> = {
  message: <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  sparkles: <><path d="M12 3l1.6 4.6L18 9l-4.4 1.4L12 15l-1.6-4.6L6 9l4.4-1.4z" /><path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M4 5.5V20.5" /></>,
  route: <><circle cx="6" cy="18" r="2.4" /><circle cx="18" cy="6" r="2.4" /><path d="M8.4 18H14a3.5 3.5 0 0 0 0-7H9.5a3.5 3.5 0 0 1 0-7h6.1" /></>,
  file: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h4" /></>,
  play: <path d="M7 5l12 7-12 7z" fill="currentColor" stroke="none" />,
  pause: <><rect x="7" y="5" width="3.4" height="14" rx="1" fill="currentColor" stroke="none" /><rect x="13.6" y="5" width="3.4" height="14" rx="1" fill="currentColor" stroke="none" /></>,
  volume: <><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M17 8a5 5 0 0 1 0 8" /></>,
  send: <path d="M12 19V5M5 12l7-7 7 7" />,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>,
  clip: <path d="M21 11.5 12.5 20a5 5 0 0 1-7-7l8-8a3.3 3.3 0 0 1 4.7 4.7l-8 8a1.6 1.6 0 0 1-2.3-2.3l7.4-7.4" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
  check: <path d="M20 6 9 17l-5-5" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.2A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 0 1 0-4h.2A1.6 1.6 0 0 0 2.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H7a1.6 1.6 0 0 0 1-1.5V1a2 2 0 0 1 4 0v.2a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V7a1.6 1.6 0 0 0 1.5 1H23a2 2 0 0 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1z" transform="translate(0.5 0.5) scale(0.92)" /></>,
  users: <><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><path d="M16 5.2a3.2 3.2 0 0 1 0 6M21 20a5.5 5.5 0 0 0-4-5.3" /></>,
  chart: <><path d="M4 20V4" /><path d="M4 20h16" /><rect x="7" y="11" width="3" height="6" rx="1" /><rect x="12.5" y="7" width="3" height="10" rx="1" /><rect x="18" y="13" width="3" height="4" rx="1" /></>,
  shield: <><path d="M12 3 5 6v5c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6z" /><path d="m9.5 12 1.8 1.8 3.5-3.6" /></>,
  coins: <><ellipse cx="9" cy="7" rx="6" ry="3" /><path d="M3 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7" /><path d="M3 12v5c0 1.7 2.7 3 6 3 1.2 0 2.3-.2 3.2-.5" /><circle cx="17" cy="15" r="4.5" /></>,
  upload: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></>,
  flame: <path d="M12 22c3.3 0 6-2.5 6-5.8 0-3.7-3-5.4-3.5-8.7-1.3 1-2 2.3-2 3.7C11 9 9.5 7.6 9.5 5.5 7.4 7.3 6 10 6 12.6 6 16.7 8.7 22 12 22z" />,
  bookmark: <path d="M6 4h12v17l-6-4-6 4z" />,
  lightbulb: <><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.3 1 2.5h6c0-1.2.3-1.8 1-2.5A6 6 0 0 0 12 3z" /></>,
  dots: <><circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="16" rx="2.5" /><path d="M3.5 9.5h17M8 3v4M16 3v4" /></>,
  cap: <><path d="M12 4 2 9l10 5 10-5z" /><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5M21 9.5v5" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5z" /><path d="m3 13 9 5 9-5" /></>,
  trending: <><path d="M3 17 10 10l4 4 7-7" /><path d="M15 7h6v6" /></>,
  euro: <><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5A4 4 0 0 0 9 11.5c0 2.5 1.8 4.5 4 4.5a4 4 0 0 0 2.5-.9M7.5 11h6M7.5 13.4h5" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" /></>,
  grid: <><rect x="4" y="4" width="6.5" height="6.5" rx="1.6" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6" /></>,
  star: <path d="m12 3 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8L6.6 19.6l1-6L3.3 9.4l6-.9z" />,
  refresh: <path d="M4 12a8 8 0 0 1 13.7-5.6L20 8M20 4v4h-4M20 12a8 8 0 0 1-13.7 5.6L4 16M4 20v-4h4" />,
  home: <><path d="m4 11 8-7 8 7" /><path d="M6 9.5V20h12V9.5" /></>,
  pin: <><path d="M12 21s7-5.3 7-11a7 7 0 0 0-14 0c0 5.7 7 11 7 11z" /><circle cx="12" cy="10" r="2.6" /></>,
  bell: <><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  download: <><path d="M12 4v12M7 11l5 5 5-5" /><path d="M4 20h16" /></>,
  filter: <path d="M3 5h18l-7 8v5l-4 2v-7z" />,
  award: <><circle cx="12" cy="9" r="5.5" /><path d="m9 13.5-1.5 7L12 18l4.5 2.5L15 13.5" /></>,
  external: <><path d="M14 4h6v6" /><path d="M20 4 11 13" /><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" /></>,
};

/**
 * Icon — 24×24 line icon set (1.6px stroke). Inherits `currentColor` by default.
 *
 * @example
 * <Icon name="target" size={18} />
 */
export function Icon({ name, size = 20, color = "currentColor", strokeWidth = 1.6, style, className }: IconProps) {
  const path = PATHS[name];
  if (!path) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      className={className}
      aria-hidden="true"
    >
      {path}
    </svg>
  );
}

/** All available icon names, handy for galleries. */
export const ICON_NAMES = Object.keys(PATHS) as IconName[];

export default Icon;
