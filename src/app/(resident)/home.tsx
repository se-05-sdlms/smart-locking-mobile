import { Button, Card, Typography } from "heroui-native";
import type { JSX } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GravityIcon } from "@/components/icons/gravity-icon";
import { useAuth } from "@/features/auth/auth-context";

export default function HomeScreen(): JSX.Element {
  const { user, logout } = useAuth();
  return (
    <SafeAreaView className="flex-1 bg-background px-5 py-6">
      <View className="flex-1 gap-5">
        <Typography.Heading className="text-3xl">Xin chào!</Typography.Heading>
        <Card>
          <Card.Body className="gap-2">
            <Typography.Heading className="text-xl">Tài khoản Cư dân</Typography.Heading>
            <Typography.Paragraph className="text-muted">
              {user?.phoneNumber || user?.email}
            </Typography.Paragraph>
          </Card.Body>
        </Card>
        <Button variant="secondary" onPress={() => void logout()}>
          <GravityIcon name="arrow-left" />
          <Button.Label>Đăng xuất</Button.Label>
        </Button>
      </View>
    </SafeAreaView>
  );
}
