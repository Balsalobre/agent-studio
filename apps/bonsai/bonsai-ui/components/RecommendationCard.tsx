import React from "react";
import { Icon, IconName } from "./Icon";
import { ResourceType } from "./ResourceChip";

const TYPE_META: Record<ResourceType, { icon: IconName; label: string }> = {
  pdf: { icon: "file", label: "PDF" },
  ebook: { icon: "book", label: "eBook" },
  audio: { icon: "volume", label: "Audio" },
  video: { icon: "play", label: "Vídeo" },
  learning_experience: { icon: "layers", label: "LX" },
};

export interface RecommendationCardProps {
  title: string;
  type: ResourceType;
  measure?: string;
  onOpen?: () => void;
}

/**
 * RecommendationCard — a suggested library resource (vertical card).
 *
 * @example
 * <RecommendationCard title="Radical Candor" type="ebook" measure="248 págs." />
 */
export function RecommendationCard({ title, type, measure, onOpen }: RecommendationCardProps) {
  const meta = TYPE_META[type] ?? TYPE_META.pdf;
  return (
    <button className="rec" onClick={onOpen} type="button">
      <span className="rec-ico">
        <Icon name={meta.icon} size={19} />
      </span>
      <span className="rec-t">{title}</span>
      <span className="rec-m">
        <span>{meta.label}</span>
        {measure && (
          <>
            <span className="dot-sep" />
            {measure}
          </>
        )}
      </span>
    </button>
  );
}

export default RecommendationCard;
