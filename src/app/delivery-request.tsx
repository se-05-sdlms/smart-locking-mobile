import { router } from "expo-router";
import { Alert, Button, Card, Chip, Typography } from "heroui-native";
import type { JSX } from "react";
import { useState } from "react";
import { View } from "react-native";

import { AppIcon } from "@/components/icons/app-icon";
import { ParcelBox } from "@/components/parcel-box";
import { AppScreen } from "@/components/ui/app-screen";
import { ScreenHeader } from "@/components/ui/screen-header";

export default function DeliveryRequestScreen(): JSX.Element {
  const [done, setDone] = useState(false);
  if (done) {
    return (
      <AppScreen>
        <ScreenHeader title="Yêu cầu giao hàng" back />
        <View className="flex-1 justify-center">
          <Alert status="success">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Đã chấp nhận yêu cầu</Alert.Title>
              <Alert.Description>
                Nhân viên giao hàng có thể gửi bưu kiện vào ngăn A06.
              </Alert.Description>
            </Alert.Content>
          </Alert>
          <Button className="mt-5" onPress={() => router.replace("/home")}>
            <Button.Label>Về danh sách</Button.Label>
          </Button>
        </View>
      </AppScreen>
    );
  }
  return (
    <AppScreen>
      <ScreenHeader title="Yêu cầu giao hàng" back />
      <Card className="p-5">
        <View className="mb-4 flex-row items-center gap-4">
          <View className="rounded-2xl bg-default p-2">
            <ParcelBox size={76} />
          </View>
          <View className="flex-1 gap-1">
            <Card.Title className="text-accent">GHN250329-1120</Card.Title>
            <Card.Description>Locker LK-01 · Ngăn A06</Card.Description>
            <Card.Description>Số 123 Nguyễn Văn Linh, Q.7</Card.Description>
          </View>
        </View>
        <View className="gap-3 rounded-2xl bg-default/60 p-4">
          <View className="flex-row items-center gap-3">
            <Chip color="warning" variant="soft">
              GHN
            </Chip>
            <Typography.Paragraph>Giao Hàng Nhanh</Typography.Paragraph>
          </View>
          <View className="flex-row items-center gap-3">
            <AppIcon name="person" tone="muted" />
            <Typography.Paragraph>Người giao: Nguyễn Hoàng</Typography.Paragraph>
          </View>
          <View className="flex-row items-center gap-3">
            <AppIcon name="clock" tone="muted" />
            <Typography.Paragraph>29/03/2025 10:24</Typography.Paragraph>
          </View>
          <View className="flex-row items-center gap-3">
            <AppIcon name="phone" tone="muted" />
            <Typography.Paragraph>0903 882 119</Typography.Paragraph>
          </View>
        </View>
      </Card>
      <View className="flex-1" />
      <View className="mb-3 flex-row gap-3">
        <Button variant="danger-soft" className="flex-1" onPress={() => router.back()}>
          <Button.Label>Từ chối</Button.Label>
        </Button>
        <Button className="flex-1" onPress={() => setDone(true)}>
          <AppIcon name="check" size={18} tone="accent-foreground" />
          <Button.Label>Chấp nhận</Button.Label>
        </Button>
      </View>
    </AppScreen>
  );
}
