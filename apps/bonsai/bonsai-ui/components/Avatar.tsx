import React from "react";

export type AvatarSize = "sm" | "md" | "lg";

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Initials shown when there is no image. */
  initials?: string;
  /** Optional image URL. */
  src?: string;
  /** Alt text for the image. */
  alt?: string;
  /** Size. @default "md" */
  size?: AvatarSize;
}

/**
 * Avatar — user mark. Falls back to gradient + initials when no image.
 *
 * @example
 * <Avatar initials="MR" />
 */
export function Avatar({ initials, src, alt, size = "md", className, ...rest }: AvatarProps) {
  const cls = [
    "avatar",
    size === "sm" ? "avatar--sm" : size === "lg" ? "avatar--lg" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <span className={cls} {...rest}>
      {src ? <img src={src} alt={alt ?? initials ?? ""} /> : initials}
    </span>
  );
}

export default Avatar;
