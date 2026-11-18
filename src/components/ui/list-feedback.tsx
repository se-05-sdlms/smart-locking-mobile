import { Skeleton, Typography } from "heroui-native";
import type { JSX } from "react";
import { View } from "react-native";
import { ActionError } from "@/components/ui/action-error";
import { GravityIcon, type GravityIconName } from "@/components/icons/gravity-icon";
export function ListFeedback({
  loading,
  error,
  empty,
  emptyTitle = "Chưa có dữ liệu",
  icon,
  onRetry,
  busy = false,
}: {
  loading: boolean;
  error: string;
  empty: string;
  emptyTitle?: string;
  icon: GravityIconName;
  onRetry: () => void;
  busy?: boolean;
}): JSX.Element {
  if (loading)
    return (
      <View
        className="gap-4 py-4"
        accessibilityLabel="Đang tải danh sách"
        accessibilityState={{ busy: true }}
      >
        {[0, 1, 2].map((key) => (
          <View key={key} className="flex-row items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <View className="flex-1 gap-2">
              <Skeleton className="h-5 w-3/4 rounded-md" />
              <Skeleton className="h-4 w-1/2 rounded-md" />
            </View>
          </View>
        ))}
      </View>
    );
  if (error) return <ActionError message={error} busy={busy} onRetry={onRetry} />;
  return (
    <View className="items-center gap-3 py-10">
      <GravityIcon name={icon} size={32} tone="muted" />
      <Typography.Heading className="text-center text-lg">{emptyTitle}</Typography.Heading>
      <Typography.Paragraph className="text-center text-sm text-muted">
        {empty}
      </Typography.Paragraph>
    </View>
  );
}
