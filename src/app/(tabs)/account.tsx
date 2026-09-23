import { router } from "expo-router";
import {
  Avatar,
  Button,
  Card,
  Chip,
  ControlField,
  Description,
  Label,
  ListGroup,
  Typography,
} from "heroui-native";
import type { JSX } from "react";
import { ScrollView, View } from "react-native";
import { Uniwind, useUniwind } from "uniwind";

import { AppIcon, type AppIconName } from "@/components/icons/app-icon";
import { AppScreen } from "@/components/ui/app-screen";
import { useAuth } from "@/providers/auth-provider";

export default function AccountScreen(): JSX.Element {
  const { theme } = useUniwind();
  const { logout, profile, pushStatus } = useAuth();
  const isDark = theme === "dark";
  const initials = profile?.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "--";
  const notificationStatus = {
    idle: "Chưa đăng ký",
    registering: "Đang đăng ký",
    registered: "Đã đăng ký",
    denied: "Chưa cấp quyền",
    failed: "Chưa khả dụng",
  }[pushStatus];
  const settings: { label: string; detail?: string; icon: AppIconName }[] = [
    { label: "Thông tin cá nhân", icon: "person" },
    { label: "Cài đặt thông báo", detail: notificationStatus, icon: "bell" },
    { label: "Trung tâm hỗ trợ", icon: "phone" },
    { label: "Về ứng dụng", detail: "v1.0.0", icon: "shield" },
  ];

  async function signOut(): Promise<void> {
    await logout();
    router.replace("/login");
  }

  return (
    <AppScreen padded={false}>
      <View className="flex-1 px-5 pt-3">
        <Typography.Heading className="mb-4 h-12 pt-2 text-xl">Tài khoản</Typography.Heading>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-5">
          <View className="mb-6 flex-row items-center gap-4">
            <Avatar size="lg" color="accent" variant="soft">
              <Avatar.Fallback>{initials}</Avatar.Fallback>
            </Avatar>
            <View className="flex-1 gap-1">
              <Typography.Heading className="text-lg">
                {profile?.fullName || "Đang tải..."}
              </Typography.Heading>
              <Typography.Paragraph className="text-sm text-muted">
                {profile?.phoneNumber || "Chưa cập nhật số điện thoại"}
              </Typography.Paragraph>
              <Typography.Paragraph className="text-sm text-muted">
                {profile?.email || "Chưa cập nhật email"}
              </Typography.Paragraph>
            </View>
            <Chip color="success" variant="soft">
              Đã xác thực
            </Chip>
          </View>
          <ListGroup>
            {settings.map((item) => (
              <ListGroup.Item key={item.label}>
                <ListGroup.ItemPrefix>
                  <AppIcon name={item.icon} tone="accent" />
                </ListGroup.ItemPrefix>
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle>{item.label}</ListGroup.ItemTitle>
                  {item.detail && (
                    <ListGroup.ItemDescription>{item.detail}</ListGroup.ItemDescription>
                  )}
                </ListGroup.ItemContent>
                <ListGroup.ItemSuffix />
              </ListGroup.Item>
            ))}
          </ListGroup>
          <Card className="mt-6 p-2">
            <ControlField
              isSelected={isDark}
              onSelectedChange={(selected) => Uniwind.setTheme(selected ? "dark" : "light")}
              accessibilityLabel="Chuyển chế độ tối"
              className="px-3 py-2"
            >
              <AppIcon name={isDark ? "moon" : "sun"} tone="accent" />
              <View className="flex-1">
                <Label>Giao diện</Label>
                <Description>{isDark ? "Chế độ tối" : "Chế độ sáng"}</Description>
              </View>
              <ControlField.Indicator />
            </ControlField>
          </Card>
          <Button variant="danger-soft" className="mt-6" onPress={() => void signOut()}>
            <Button.Label>Đăng xuất</Button.Label>
          </Button>
        </ScrollView>
      </View>
    </AppScreen>
  );
}
