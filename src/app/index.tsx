import { Button, Card, Chip, Typography, useThemeColor } from "heroui-native";
import type { JSX, ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { AppScreen } from "@/components/ui/app-screen";
import { StatusBadge } from "@/components/ui/status-badge";

type IconName = "bell" | "box" | "chevron" | "history" | "qr" | "settings";

function Icon({
  name,
  muted = false,
  size = 22,
}: {
  name: IconName;
  muted?: boolean;
  size?: number;
}): JSX.Element {
  const foreground = useThemeColor(muted ? "muted" : "foreground");
  const paths: Record<IconName, ReactNode> = {
    bell: (
      <>
        <Path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <Path d="M10 21h4" />
      </>
    ),
    box: (
      <>
        <Path d="m21 8-9 5-9-5 9-5 9 5Z" />
        <Path d="m3 8 9 5 9-5v9l-9 5-9-5V8Z" />
        <Path d="M12 13v9" />
      </>
    ),
    chevron: <Path d="m9 18 6-6-6-6" />,
    history: (
      <>
        <Path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <Path d="M3 3v5h5M12 7v5l3 2" />
      </>
    ),
    qr: (
      <>
        <Rect x="3" y="3" width="7" height="7" rx="1" />
        <Rect x="14" y="3" width="7" height="7" rx="1" />
        <Rect x="3" y="14" width="7" height="7" rx="1" />
        <Path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 20h2M20 14h1" />
      </>
    ),
    settings: (
      <>
        <Circle cx="12" cy="12" r="3" />
        <Path d="M19 15a2 2 0 0 0 .4 2l-2.8 2.8a2 2 0 0 0-2-.4A2 2 0 0 0 13 21h-2a2 2 0 0 0-1.3-1.6 2 2 0 0 0-2 .4L4.9 17a2 2 0 0 0 .4-2A2 2 0 0 0 3 13v-2a2 2 0 0 0 2.3-2 2 2 0 0 0-.4-2l2.8-2.8a2 2 0 0 0 2 .4A2 2 0 0 0 11 3h2a2 2 0 0 0 1.3 1.6 2 2 0 0 0 2-.4L19.1 7a2 2 0 0 0-.4 2A2 2 0 0 0 21 11v2a2 2 0 0 0-2 2Z" />
      </>
    ),
  };
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={foreground}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </Svg>
  );
}

const quickActions: { icon: IconName; label: string }[] = [
  { icon: "qr", label: "Mã nhận hàng" },
  { icon: "history", label: "Lịch sử" },
  { icon: "settings", label: "Cài đặt" },
];

export default function HomeScreen(): JSX.Element {
  return (
    <AppScreen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-10">
        <View className="mb-7 flex-row items-center justify-between">
          <View>
            <Typography.Paragraph className="text-muted">Xin chào,</Typography.Paragraph>
            <Typography.Heading>Nguyễn Minh Anh</Typography.Heading>
          </View>
          <Button isIconOnly variant="tertiary" accessibilityLabel="Mở thông báo">
            <Icon name="bell" />
          </Button>
        </View>

        <Card>
          <Card.Header>
            <StatusBadge label="Sẵn sàng nhận" />
          </Card.Header>
          <Card.Body className="gap-2 py-5">
            <Card.Title className="text-xl">Bạn có 2 bưu kiện đang chờ</Card.Title>
            <Card.Description>Tủ Boxora · Sảnh A</Card.Description>
          </Card.Body>
          <Card.Footer>
            <Button className="w-full">
              <Icon name="qr" size={20} />
              <Button.Label>Mở mã nhận hàng</Button.Label>
            </Button>
          </Card.Footer>
        </Card>

        <Typography.Heading className="mb-4 mt-8">Truy cập nhanh</Typography.Heading>
        <View className="flex-row gap-3">
          {quickActions.map((action) => (
            <Card key={action.label} className="flex-1 items-center p-3">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={action.label}
                className="w-full items-center gap-3 py-2"
              >
                <Chip
                  color="default"
                  variant="soft"
                  className="h-11 w-11 items-center justify-center"
                >
                  <Icon name={action.icon} size={21} />
                </Chip>
                <Text className="text-center text-sm font-semibold text-foreground">
                  {action.label}
                </Text>
              </Pressable>
            </Card>
          ))}
        </View>

        <View className="mb-4 mt-8 flex-row items-center justify-between">
          <Typography.Heading>Bưu kiện gần đây</Typography.Heading>
          <Button variant="ghost" size="sm">
            <Button.Label>Xem tất cả</Button.Label>
          </Button>
        </View>
        <Card className="flex-row items-center p-4">
          <Chip color="warning" variant="soft" className="h-12 w-12 items-center justify-center">
            <Icon name="box" />
          </Chip>
          <View className="ml-4 flex-1 gap-1">
            <Card.Title>SPXVN23890152</Card.Title>
            <Card.Description>Ngăn A12 · Hôm nay, 09:24</Card.Description>
          </View>
          <Icon name="chevron" muted size={19} />
        </Card>
      </ScrollView>
    </AppScreen>
  );
}
