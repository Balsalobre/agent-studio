import React from "react";
import { Icon, IconName } from "./Icon";

export interface RoleOption {
  /** Stable value. */
  value: string;
  /** Visible label. */
  label: string;
  /** Optional leading icon. */
  icon?: IconName;
}

export interface RoleSwitcherProps {
  options: RoleOption[];
  /** Selected value. */
  value: string;
  /** Fired with the chosen value. */
  onChange?: (value: string) => void;
}

/**
 * RoleSwitcher — segmented control for switching role / view.
 *
 * @example
 * <RoleSwitcher
 *   value={role}
 *   onChange={setRole}
 *   options={[
 *     { value: "chat", label: "Empleado", icon: "message" },
 *     { value: "manager", label: "Manager", icon: "users" },
 *   ]}
 * />
 */
export function RoleSwitcher({ options, value, onChange }: RoleSwitcherProps) {
  return (
    <div className="seg" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          className={"seg-btn" + (value === o.value ? " seg-btn--active" : "")}
          onClick={() => onChange?.(o.value)}
          type="button"
        >
          {o.icon && <Icon name={o.icon} size={15} />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default RoleSwitcher;
