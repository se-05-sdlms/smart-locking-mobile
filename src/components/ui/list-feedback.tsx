import { Button, Skeleton, Typography } from "heroui-native";
import type { JSX } from "react";
import { View } from "react-native";

import { GravityIcon, type GravityIconName } from "@/components/icons/gravity-icon";

export function ListFeedback({
  loading,
  error,
  empty,
  icon,
  onRetry,
}: {
  loading: boolean;
  error: string;
  empty: string;
  icon: GravityIconName;
  onRetry: () => void;
}): JSX.Element {
  if (loading)
    return (
      <View className="gap-3 py-4">
        {[0, 1, 2].map((key) => (
          <Skeleton key={key} className="h-24 rounded-xl" />
        ))}
      </View>
    );
  if (error)
    return (
      <View className="gap-3 py-6">
        <Typography.Paragraph accessibilityRole="alert" className="text-danger">
          {error}
        </Typography.Paragraph>
        <Button variant="secondary" onPress={onRetry}>
          <Button.Label>Thử lại</Button.Label>
        </Button>
      </View>
    );
  return (
    <View className="items-center gap-3 py-12">
      <GravityIcon name={icon} size={32} tone="muted" />
      <Typography.Paragraph className="text-center text-muted">{empty}</Typography.Paragraph>
    </View>
  );
}
