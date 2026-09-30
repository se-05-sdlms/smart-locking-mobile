import { router } from "expo-router";
import { Button, Card, Typography } from "heroui-native";
import type { JSX } from "react";

import { GravityIcon } from "@/components/icons/gravity-icon";
import { AppScreen } from "@/components/ui/app-screen";
import { useAuth } from "@/features/auth/auth-context";

export default function ProfileScreen(): JSX.Element {
  const { user, logout } = useAuth();
  return (
    <AppScreen>
      <Typography.Heading className="mb-5 text-3xl">Tài khoản</Typography.Heading>
      <Card className="mb-4">
        <Card.Body className="gap-2">
          <Typography.Heading className="text-xl">Cư dân</Typography.Heading>
          <Typography.Paragraph className="text-muted">
            {user?.phoneNumber || user?.email}
          </Typography.Paragraph>
        </Card.Body>
      </Card>
      <Button className="mb-3" onPress={() => router.push("/incidents")}>
        <GravityIcon name="alert-circle" tone="accent-foreground" />
        <Button.Label>Sự cố của tôi</Button.Label>
      </Button>
      <Button variant="secondary" onPress={() => void logout()}>
        <GravityIcon name="arrow-left" />
        <Button.Label>Đăng xuất</Button.Label>
      </Button>
    </AppScreen>
  );
}
