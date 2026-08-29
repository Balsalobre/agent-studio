import React from "react";
import { Icon, IconName } from "./Icon";

export type ResourceType = "pdf" | "ebook" | "audio" | "video" | "learning_experience";

const TYPE_META: Record<ResourceType, { icon: IconName; label: string; lx?: boolean }> = {
  pdf: { icon: "file", label: "PDF" },
  ebook: { icon: "book", label: "eBook" },
  audio: { icon: "volume", label: "Audio" },
  video: { icon: "play", label: "Vídeo" },
  learning_experience: { icon: "layers", label: "LX", lx: true },
};

export interface ResourceChipProps {
  /** Resource title. */
  title: string;
  /** Resource kind — picks the icon and label. */
  type: ResourceType;
  /** Short measure shown after the type (e.g. "14 min", "24 págs."). */
  measure?: string;
  /** Open handler — wire to your resource viewer / new tab. */
  onOpen?: () => void;
}

/**
 * ResourceChip — a single learning resource row (icon · title · type · measure).
 *
 * @example
 * <ResourceChip title="Manual de marca" type="pdf" measure="24 págs." />
 */
export function ResourceChip({ title, type, measure, onOpen }: ResourceChipProps) {
  const meta = TYPE_META[type] ?? TYPE_META.pdf;
  return (
    <button className="rchip" onClick={onOpen} type="button">
      <span className={"rchip-ico" + (meta.lx ? " rchip-ico--lx" : "")}>
        <Icon name={meta.icon} size={16} />
      </span>
      <span className="rchip-txt">
        <span className="rchip-t">{title}</span>
        <span className="rchip-m">
          <span className="tag">{meta.label}</span>
          {measure && (
            <>
              <span className="dot-sep" />
              {measure}
            </>
          )}
        </span>
      </span>
      <span className="rchip-ext">
        <Icon name="external" size={16} />
      </span>
    </button>
  );
}

export default ResourceChip;
