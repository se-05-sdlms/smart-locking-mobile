import { Alert, Button } from "heroui-native";
import type { JSX } from "react";
import { View } from "react-native";

import { GravityIcon } from "@/components/icons/gravity-icon";

export function ActionError({
  message,
  title = "Không thể tải dữ liệu",
  onRetry,
  busy = false,
  compact = false,
}: {
  message: string;
  title?: string;
  onRetry?: () => void;
  busy?: boolean;
  compact?: boolean;
}): JSX.Element {
  return (
    <View className={compact ? "gap-2 py-2" : "gap-3 py-4"}>
      <Alert
        status="danger"
        accessibilityRole="alert"
        className="border border-danger/20 bg-surface-secondary"
      >
        <Alert.Indicator>
          <GravityIcon name="alert-circle" tone="danger" size={20} />
        </Alert.Indicator>
        <Alert.Content>
          <Alert.Title className="text-foreground">{title}</Alert.Title>
          <Alert.Description className="text-foreground">{message}</Alert.Description>
        </Alert.Content>
      </Alert>
      {onRetry ? (
        <Button
          variant="secondary"
          isDisabled={busy}
          className="min-h-12 self-start"
          onPress={onRetry}
        >
          <Button.Label>{busy ? "Đang thử lại..." : "Thử lại"}</Button.Label>
        </Button>
      ) : null}
    </View>
  );
}
