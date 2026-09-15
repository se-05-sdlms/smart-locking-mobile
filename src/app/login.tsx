import { router } from "expo-router";
import { Button, LinkButton, Typography } from "heroui-native";
import type { JSX } from "react";
import { View } from "react-native";

import { AuthField } from "@/components/auth/auth-field";
import { AuthScreen } from "@/components/auth/auth-screen";
import { BoxoraLogo } from "@/components/auth/boxora-logo";

export default function LoginScreen(): JSX.Element {
  return (
    <AuthScreen
      title="Chào mừng trở lại"
      description="Đăng nhập để quản lý và nhận bưu kiện của bạn."
    >
      <View className="mb-9">
        <BoxoraLogo />
      </View>
      <View className="gap-5">
        <AuthField
          label="Số điện thoại"
          icon="phone"
          placeholder="0912 345 678"
          keyboardType="phone-pad"
          autoCapitalize="none"
          autoComplete="tel"
        />
        <AuthField
          label="Mật khẩu"
          icon="lock"
          placeholder="Nhập mật khẩu"
          secureTextEntry
          autoComplete="current-password"
        />
        <View className="flex-row justify-end">
          <LinkButton onPress={() => router.push("/forgot-password")}>Quên mật khẩu?</LinkButton>
        </View>
        <Button size="lg" onPress={() => router.replace("/home")}>
          <Button.Label>Đăng nhập</Button.Label>
        </Button>
        <View className="flex-row justify-center gap-1">
          <Typography.Paragraph className="text-muted">Chưa có tài khoản?</Typography.Paragraph>
          <LinkButton onPress={() => router.push("/register")}>Đăng ký</LinkButton>
        </View>
      </View>
    </AuthScreen>
  );
}
