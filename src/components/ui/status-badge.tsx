import type { JSX } from "react";
import { Chip } from "heroui-native";

type BadgeTone = "success" | "warning" | "danger" | "default";

export function StatusBadge({
  label,
  tone = "success",
}: {
  label: string;
  tone?: BadgeTone;
}): JSX.Element {
  return (
    <Chip color={tone} variant="soft" size="sm" accessibilityLabel={`Trạng thái: ${label}`}>
      {label}
    </Chip>
  );
}
