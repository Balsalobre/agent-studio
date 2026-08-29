import React from "react";
import { Icon, IconName } from "./Icon";
import { BonsaiMark } from "./BonsaiMark";

export interface RailItem {
  /** Stable id. */
  id: string;
  /** Lucide-style icon name. */
  icon: IconName;
  /** Tooltip label. */
  label: string;
}

export interface RailProps {
  items: RailItem[];
  /** Currently active item id. */
  active?: string;
  /** Fired with the clicked item id. */
  onSelect?: (id: string) => void;
  /** Click handler for the logo tile (e.g. go home / reset). */
  onLogo?: () => void;
  /** Optional footer node (e.g. an Avatar). */
  footer?: React.ReactNode;
}

/**
 * Rail — slim vertical navigation with a logo tile, icon buttons (with
 * tooltips) and an optional footer slot.
 *
 * @example
 * <Rail items={[{ id: "home", icon: "message", label: "Mi aprendizaje" }]} active="home" />
 */
export function Rail({ items, active, onSelect, onLogo, footer }: RailProps) {
  return (
    <nav className="rail">
      <button className="rail-logo" onClick={onLogo} title="Inicio" type="button">
        <BonsaiMark size={26} />
      </button>
      <div className="rail-spacer" style={{ flex: "0 0 6px" }} />
      <div className="rail-group">
        {items.map((it) => (
          <button
            key={it.id}
            className={"rail-btn" + (active === it.id ? " rail-btn--active" : "")}
            onClick={() => onSelect?.(it.id)}
            type="button"
            aria-current={active === it.id ? "page" : undefined}
          >
            <Icon name={it.icon} size={21} />
            <span className="rail-tip">{it.label}</span>
          </button>
        ))}
      </div>
      <div className="rail-spacer" />
      {footer}
    </nav>
  );
}

export default Rail;
