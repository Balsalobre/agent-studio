import React from "react";

export interface PanelProps {
  /** Title shown in the header. */
  title?: React.ReactNode;
  /** Optional right-aligned header content (buttons, badges…). */
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Panel — titled surface container used across dashboards. Compose with
 * RankedList / TopicBars / GapRow / DataTable inside.
 */
export function Panel({ title, actions, children, className }: PanelProps) {
  return (
    <div className={["panel", className].filter(Boolean).join(" ")}>
      {(title || actions) && (
        <div className="panel-head">
          {typeof title === "string" ? <span className="panel-title">{title}</span> : title}
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}

export default Panel;
