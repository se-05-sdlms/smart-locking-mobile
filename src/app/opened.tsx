import { router } from "expo-router";
import { Button, Typography } from "heroui-native";
import type { JSX } from "react";
import { View } from "react-native";

import { AppIcon } from "@/components/icons/app-icon";
import { ParcelBox } from "@/components/parcel-box";
import { AppScreen } from "@/components/ui/app-screen";
import { ScreenHeader } from "@/components/ui/screen-header";

export default function OpenedScreen(): JSX.Element {
  return (
    <AppScreen>
      <ScreenHeader title="Ngăn đã mở" back />
      <View className="flex-1 items-center justify-center">
        <View className="relative h-64 w-64 items-center justify-center rounded-[48px] bg-accent/10">
          <View className="absolute right-5 top-7 h-44 w-8 rounded-lg border-2 border-accent/30 bg-background" />
          <View className="h-40 w-44 items-center justify-center rounded-2xl border-4 border-accent/30 bg-accent/10">
            <ParcelBox size={104} />
          </View>
          <View className="absolute -top-3 right-16">
            <AppIcon name="check" size={34} tone="success" />
          </View>
        </View>
        <Typography.Heading className="mt-8 text-2xl text-accent">
          Ngăn A03 đã mở
        </Typography.Heading>
        <Typography.Paragraph className="mt-2 text-center text-muted">
          Lấy bưu kiện và đóng ngăn lại
        </Typography.Paragraph>
      </View>
      <Button size="lg" className="mb-3" onPress={() => router.replace("/completed")}>
        <Button.Label>Tôi đã lấy hàng</Button.Label>
      </Button>
    </AppScreen>
  );
}
