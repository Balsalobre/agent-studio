import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Add default internal padding. */
  pad?: boolean;
  /** Hover affordance (use when the whole card is clickable). */
  hover?: boolean;
}

/**
 * Card — surface container.
 *
 * @example
 * <Card pad>…</Card>
 */
export function Card({ pad, hover, className, children, ...rest }: CardProps) {
  const cls = ["card", pad ? "card--pad" : "", hover ? "card--hover" : "", className]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={cls} {...rest}>
      {children}
    </div>
  );
}

export default Card;
