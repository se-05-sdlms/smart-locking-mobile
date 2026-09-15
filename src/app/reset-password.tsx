import { router } from "expo-router";
import { Button } from "heroui-native";
import type { JSX } from "react";
import { View } from "react-native";

import { AuthField } from "@/components/auth/auth-field";
import { AuthScreen } from "@/components/auth/auth-screen";

export default function ResetPasswordScreen(): JSX.Element {
  return (
    <AuthScreen
      canGoBack
      title="Tạo mật khẩu mới"
      description="Mật khẩu mới phải khác mật khẩu bạn đã dùng trước đây."
    >
      <View className="gap-5">
        <AuthField
          label="Mật khẩu mới"
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
        <Button size="lg" onPress={() => router.replace("/login")}>
          <Button.Label>Đổi mật khẩu</Button.Label>
        </Button>
      </View>
    </AuthScreen>
  );
}
