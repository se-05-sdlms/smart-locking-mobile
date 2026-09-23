import { router } from "expo-router";
import { Button, Card, Chip, Typography } from "heroui-native";
import type { JSX } from "react";
import { ScrollView, View } from "react-native";

import { AppIcon, type AppIconName } from "@/components/icons/app-icon";
import { AppScreen } from "@/components/ui/app-screen";

const notices: {
  title: string;
  description: string;
  time: string;
  icon: AppIconName;
  tone: "accent" | "danger" | "success";
  action?: boolean;
}[] = [
  {
    title: "Bưu kiện đang chờ bạn lấy",
    description: "PRC250328-0012 · Ngăn A03",
    time: "15:20",
    icon: "box",
    tone: "accent",
  },
  {
    title: "Bưu kiện sắp quá hạn",
    description: "SPX250327-8845 · Ngăn B12",
    time: "10:08",
    icon: "clock",
    tone: "danger",
  },
  {
    title: "Yêu cầu giao hàng mới",
    description: "GHN250329-1120 · Ngăn A06",
    time: "Hôm qua",
    icon: "bell",
    tone: "accent",
    action: true,
  },
  {
    title: "Đã nhận hàng thành công",
    description: "TIK250326-7710 · Ngăn C05",
    time: "Hôm qua",
    icon: "check",
    tone: "success",
  },
  {
    title: "Thanh toán thành công",
    description: "Đơn hàng SPX250327-8845",
    time: "26/03",
    icon: "receipt",
    tone: "accent",
  },
];

export default function NotificationsScreen(): JSX.Element {
  return (
    <AppScreen padded={false}>
      <View className="flex-1 px-5 pt-3">
        <View className="mb-4 h-12 flex-row items-center justify-between">
          <Typography.Heading className="text-xl">Thông báo</Typography.Heading>
          <Button variant="ghost" size="sm">
            <Button.Label>Đã đọc tất cả</Button.Label>
          </Button>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-2 pb-4">
          {notices.map((notice, index) => (
            <Card key={notice.title} variant={index < 3 ? "secondary" : "default"} className="p-1">
              <Button
                variant="ghost"
                className="h-auto min-h-20 w-full justify-start px-3 py-3"
                onPress={() => notice.action && router.push("/delivery-request")}
              >
                <Chip
                  color={notice.tone}
                  variant="soft"
                  className="h-11 w-11 items-center justify-center"
                >
                  <AppIcon name={notice.icon} tone={notice.tone} />
                </Chip>
                <View className="min-w-0 flex-1 items-start gap-1">
                  <Typography.Paragraph className="font-semibold" numberOfLines={1}>
                    {notice.title}
                  </Typography.Paragraph>
                  <Typography.Paragraph className="text-sm text-muted" numberOfLines={1}>
                    {notice.description}
                  </Typography.Paragraph>
                </View>
                <Typography.Paragraph className="text-xs text-muted">
                  {notice.time}
                </Typography.Paragraph>
              </Button>
            </Card>
          ))}
        </ScrollView>
      </View>
    </AppScreen>
  );
}
