import React from "react";

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Optional leading icon node. */
  icon?: React.ReactNode;
  /** Selected/active state (also sets aria-pressed). */
  active?: boolean;
}

/**
 * Chip — pill-shaped toggle / quick action.
 *
 * @example
 * <Chip icon={<Icon name="target" size={14} />}>Mi objetivo semanal</Chip>
 */
export function Chip({ icon, active, className, children, ...rest }: ChipProps) {
  const cls = ["chip", active ? "chip--active" : "", className].filter(Boolean).join(" ");
  return (
    <button className={cls} aria-pressed={active} {...rest}>
      {icon}
      {children}
    </button>
  );
}

export default Chip;
