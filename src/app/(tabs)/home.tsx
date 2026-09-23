import { router } from "expo-router";
import { Button, Chip, Typography } from "heroui-native";
import type { JSX } from "react";
import { ScrollView, View } from "react-native";

import { AppIcon } from "@/components/icons/app-icon";
import { ParcelCard } from "@/components/parcel-card";
import { AppScreen } from "@/components/ui/app-screen";
import { parcels } from "@/data/mock-data";

export default function HomeScreen(): JSX.Element {
  return (
    <AppScreen padded={false}>
      <View className="flex-1 px-5">
        <View className="mb-4 flex-row items-center justify-between pt-2">
          <View className="flex-row items-center gap-2">
            <Chip color="accent" variant="soft" className="h-10 w-10 items-center justify-center">
              <AppIcon name="lock" tone="accent" />
            </Chip>
            <View>
              <Typography.Heading className="text-lg text-accent">SmartLock</Typography.Heading>
              <Typography.Paragraph className="text-xs text-muted">
                Nhận hàng tiện lợi
              </Typography.Paragraph>
            </View>
          </View>
          <Button
            isIconOnly
            variant="ghost"
            accessibilityLabel="Mở thông báo"
            onPress={() => router.navigate("/notifications")}
          >
            <AppIcon name="bell" tone="accent" />
            <View className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger" />
          </Button>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-3 pb-5">
          <View className="mb-1 flex-row items-center justify-between">
            <Typography.Heading className="text-xl">Đơn cần lấy</Typography.Heading>
            <Chip color="accent" variant="soft">
              {parcels.length}
            </Chip>
          </View>
          {parcels.map((parcel) => (
            <ParcelCard key={parcel.id} parcel={parcel} />
          ))}

          <View className="mt-4 rounded-3xl bg-accent/10 p-5">
            <View className="mb-3 flex-row items-center gap-3">
              <Chip color="accent" variant="soft" className="h-11 w-11 items-center justify-center">
                <AppIcon name="shield" tone="accent" />
              </Chip>
              <View className="flex-1">
                <Typography.Heading className="text-base">Giao hàng vào tủ</Typography.Heading>
                <Typography.Paragraph className="text-sm text-muted">
                  Xác nhận yêu cầu từ nhân viên giao hàng
                </Typography.Paragraph>
              </View>
            </View>
            <Button variant="secondary" onPress={() => router.push("/delivery-request")}>
              <Button.Label>Xem yêu cầu mới</Button.Label>
            </Button>
          </View>
        </ScrollView>
      </View>
    </AppScreen>
  );
}
