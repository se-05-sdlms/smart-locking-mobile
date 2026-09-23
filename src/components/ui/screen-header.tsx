import { router } from "expo-router";
import { Button, Typography } from "heroui-native";
import type { JSX } from "react";
import { View } from "react-native";

import { AppIcon } from "@/components/icons/app-icon";

export function ScreenHeader({
  title,
  back = false,
}: {
  title: string;
  back?: boolean;
}): JSX.Element {
  return (
    <View className="mb-4 h-12 flex-row items-center">
      <View className="w-12">
        {back && (
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            accessibilityLabel="Quay lại"
            onPress={() => router.back()}
          >
            <AppIcon name="arrow-left" />
          </Button>
        )}
      </View>
      <Typography.Heading className="flex-1 text-center text-lg">{title}</Typography.Heading>
      <View className="w-12" />
    </View>
  );
}
