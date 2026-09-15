import { router } from "expo-router";
import { Button, Checkbox, LinkButton, Typography } from "heroui-native";
import type { JSX } from "react";
import { useState } from "react";
import { View } from "react-native";

import { AuthField } from "@/components/auth/auth-field";
import { AuthScreen } from "@/components/auth/auth-screen";

export default function RegisterScreen(): JSX.Element {
  const [accepted, setAccepted] = useState(false);
  return (
    <AuthScreen
      canGoBack
      title="Tạo tài khoản cư dân"
      description="Dùng số điện thoại đã đăng ký với ban quản lý để bắt đầu."
    >
      <View className="gap-5">
        <AuthField
          label="Họ và tên"
          icon="user"
          placeholder="Nguyễn Minh Anh"
          autoComplete="name"
        />
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
          placeholder="Tối thiểu 8 ký tự"
          secureTextEntry
          autoComplete="new-password"
        />
        <AuthField
          label="Xác nhận mật khẩu"
          icon="lock"
          placeholder="Nhập lại mật khẩu"
          secureTextEntry
          autoComplete="new-password"
        />
        <Checkbox isSelected={accepted} onSelectedChange={setAccepted}>
          <Checkbox.Indicator />
          <Typography.Paragraph className="flex-1">
            Tôi đồng ý với điều khoản sử dụng và chính sách bảo mật
          </Typography.Paragraph>
        </Checkbox>
        <Button
          size="lg"
          isDisabled={!accepted}
          onPress={() =>
            router.push({
              pathname: "/verify-otp",
              params: { phone: "0912345678", flow: "register" },
            })
          }
        >
          <Button.Label>Đăng ký</Button.Label>
        </Button>
        <View className="flex-row justify-center gap-1">
          <Typography.Paragraph className="text-muted">Đã có tài khoản?</Typography.Paragraph>
          <LinkButton onPress={() => router.replace("/login")}>Đăng nhập</LinkButton>
        </View>
      </View>
    </AuthScreen>
  );
}
