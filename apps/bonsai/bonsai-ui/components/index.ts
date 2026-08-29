// Bonsai UI — public API barrel.
// Import components from "@/components/bonsai-ui" (adjust to your alias/path).

// Primitives
export { Button } from "./Button";
export type { ButtonProps, ButtonVariant, ButtonSize } from "./Button";
export { Badge } from "./Badge";
export type { BadgeProps, BadgeTone } from "./Badge";
export { Chip } from "./Chip";
export type { ChipProps } from "./Chip";
export { Card } from "./Card";
export type { CardProps } from "./Card";
export { Avatar } from "./Avatar";
export type { AvatarProps, AvatarSize } from "./Avatar";
export { ProgressBar } from "./ProgressBar";
export type { ProgressBarProps, ProgressTone } from "./ProgressBar";
export { TextField } from "./TextField";
export type { TextFieldProps } from "./TextField";

// Brand
export { Icon, ICON_NAMES } from "./Icon";
export type { IconProps, IconName } from "./Icon";
export { BonsaiMark } from "./BonsaiMark";
export type { BonsaiMarkProps } from "./BonsaiMark";
export { Wordmark } from "./Wordmark";
export type { WordmarkProps } from "./Wordmark";

// Learning
export { StepCard } from "./StepCard";
export type { StepCardProps, StepStatus, CompletionType, StepResource } from "./StepCard";
export { ResourceChip } from "./ResourceChip";
export type { ResourceChipProps, ResourceType } from "./ResourceChip";
export { ProgressCard } from "./ProgressCard";
export type { ProgressCardProps } from "./ProgressCard";
export { RecommendationCard } from "./RecommendationCard";
export type { RecommendationCardProps } from "./RecommendationCard";
export { BonsaiBar } from "./BonsaiBar";
export type { BonsaiBarProps } from "./BonsaiBar";
export { WorkflowButtons } from "./WorkflowButtons";
export type { WorkflowButtonsProps, Workflow } from "./WorkflowButtons";

// Dashboard
export { Panel } from "./Panel";
export type { PanelProps } from "./Panel";
export { KPICard } from "./KPICard";
export type { KPICardProps } from "./KPICard";
export { RankedList } from "./RankedList";
export type { RankedListProps, RankedItem } from "./RankedList";
export { TopicBars } from "./TopicBars";
export type { TopicBarsProps, TopicDatum } from "./TopicBars";
export { GapRow } from "./GapRow";
export type { GapRowProps } from "./GapRow";
export { DataTable } from "./DataTable";
export type { DataTableProps, DataTableColumn } from "./DataTable";

// Navigation
export { Rail } from "./Rail";
export type { RailProps, RailItem } from "./Rail";
export { RoleSwitcher } from "./RoleSwitcher";
export type { RoleSwitcherProps, RoleOption } from "./RoleSwitcher";

// Hooks
export { useTheme } from "./useTheme";
export type { Theme } from "./useTheme";
