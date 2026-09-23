import { router } from "expo-router";
import { Card, Spinner, Typography } from "heroui-native";
import type { JSX } from "react";
import { useEffect } from "react";
import { View } from "react-native";

import { AppIcon } from "@/components/icons/app-icon";
import { ParcelCard } from "@/components/parcel-card";
import { AppScreen } from "@/components/ui/app-screen";
import { ScreenHeader } from "@/components/ui/screen-header";
import { parcels } from "@/data/mock-data";

export default function OpeningScreen(): JSX.Element {
  useEffect(() => {
    const timer = setTimeout(() => router.replace("/opened"), 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AppScreen>
      <ScreenHeader title="Đang mở ngăn" back />
      <ParcelCard parcel={parcels[0]} compact />
      <View className="flex-1 items-center justify-center">
        <View className="h-52 w-52 items-center justify-center rounded-full border-[12px] border-accent/15 bg-accent/5">
          <Spinner size="lg" color="accent" />
          <AppIcon name="lock" size={38} tone="accent" />
          <Typography.Heading className="mt-3 text-base">Đang kết nối locker...</Typography.Heading>
        </View>
        <Card variant="transparent" className="mt-8 w-full gap-4 p-5">
          <View className="flex-row items-center gap-3">
            <AppIcon name="check" tone="accent" />
            <Typography.Paragraph className="font-semibold">
              Đã gửi yêu cầu mở ngăn
            </Typography.Paragraph>
          </View>
          <View className="flex-row items-center gap-3 opacity-60">
            <AppIcon name="clock" tone="muted" />
            <Typography.Paragraph className="text-muted">
              Chờ phản hồi từ locker
            </Typography.Paragraph>
          </View>
          <View className="flex-row items-center gap-3 opacity-40">
            <AppIcon name="lock" tone="muted" />
            <Typography.Paragraph className="text-muted">Đang xử lý</Typography.Paragraph>
          </View>
        </Card>
      </View>
    </AppScreen>
  );
}
