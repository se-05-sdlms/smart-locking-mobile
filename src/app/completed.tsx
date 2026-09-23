import { router } from "expo-router";
import { Button, Card, Chip, Typography } from "heroui-native";
import type { JSX } from "react";
import { View } from "react-native";

import { AppIcon } from "@/components/icons/app-icon";
import { ParcelCard } from "@/components/parcel-card";
import { AppScreen } from "@/components/ui/app-screen";
import { ScreenHeader } from "@/components/ui/screen-header";
import { historyParcels } from "@/data/mock-data";

export default function CompletedScreen(): JSX.Element {
  return (
    <AppScreen>
      <ScreenHeader title="Hoàn tất" back />
      <View className="flex-1">
        <View className="items-center py-6">
          <Chip
            color="success"
            variant="soft"
            className="h-28 w-28 items-center justify-center rounded-full"
          >
            <AppIcon name="check" size={62} tone="success" />
          </Chip>
          <Typography.Heading className="mt-5 text-2xl">
            Đã nhận hàng thành công!
          </Typography.Heading>
        </View>
        <ParcelCard parcel={historyParcels[0]} compact />
        <Card variant="secondary" className="mt-3 flex-row items-center gap-3 p-4">
          <AppIcon name="calendar" tone="accent" />
          <View>
            <Card.Description>Nhận hàng lúc</Card.Description>
            <Card.Title>28/03/2025 16:15</Card.Title>
          </View>
        </Card>
      </View>
      <Button size="lg" className="mb-3" onPress={() => router.replace("/home")}>
        <Button.Label>Về danh sách</Button.Label>
      </Button>
    </AppScreen>
  );
}
