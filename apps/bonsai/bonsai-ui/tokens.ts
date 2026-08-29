/**
 * Bonsai UI design tokens, mirrored as JS constants.
 *
 * The source of truth for runtime styling is `styles/globals.css` (CSS custom
 * properties). This file is a convenience for when you need token values in
 * JS/TS — charts, canvas, inline styles, emails, etc. Keep both in sync.
 */

export const colors = {
  accent: "#2F6CFF",
  sky: "#7FA8FF",
  success: "#5BD8A0",
  warning: "#EFC88B",
  danger: "#F0654E",
} as const;

/** Bonsai mark palette (tonal blues). */
export const brand = {
  deep: "#0A1E47",
  navy: "#13316E",
  accent: "#2F6CFF",
  light: "#7FA8FF",
  pale: "#BBD0FF",
  trunk: "#FFFFFF",
} as const;

export const dark = {
  bg: "#14161C",
  fg: "#F6F8FC",
  fg2: "#A9B1C0",
  fg3: "#6E7686",
} as const;

export const light = {
  bg: "#F3EFEE",
  fg: "#1C1719",
  fg2: "#5C545A",
  fg3: "#8A8388",
} as const;

export const radii = {
  xs: 6, sm: 10, md: 14, lg: 18, xl: 24, "2xl": 32, pill: 999,
} as const;

export const space = {
  1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32, 7: 48, 8: 64, 9: 96,
} as const;

export const fonts = {
  display: '"Space Grotesk", ui-sans-serif, system-ui, sans-serif',
  ui: '"Hanken Grotesk", ui-sans-serif, -apple-system, system-ui, sans-serif',
} as const;
