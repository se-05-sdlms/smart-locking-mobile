import type { JSX } from "react";
import { Typography } from "heroui-native";
import { View } from "react-native";

type BadgeTone = "success" | "warning" | "danger" | "default";
const tones: Record<BadgeTone, string> = {
  success: "bg-success-soft text-success-soft-foreground",
  warning: "bg-warning-soft text-warning-soft-foreground",
  danger: "bg-danger-soft text-danger-soft-foreground",
  default: "bg-default text-muted",
};
export function StatusBadge({
  label,
  tone = "success",
}: {
  label: string;
  tone?: BadgeTone;
}): JSX.Element {
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Trạng thái: ${label}`}
      className="max-w-full self-start"
    >
      <Typography.Paragraph className={`rounded-lg px-2 py-1 text-xs font-semibold ${tones[tone]}`}>
        {label}
      </Typography.Paragraph>
    </View>
  );
}
