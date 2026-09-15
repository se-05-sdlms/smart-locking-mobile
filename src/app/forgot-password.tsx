import { router } from "expo-router";
import { Button } from "heroui-native";
import type { JSX } from "react";
import { View } from "react-native";

import { AuthField } from "@/components/auth/auth-field";
import { AuthScreen } from "@/components/auth/auth-screen";

export default function ForgotPasswordScreen(): JSX.Element {
  return (
    <AuthScreen
      canGoBack
      title="Quên mật khẩu?"
      description="Nhập số điện thoại của bạn, Boxora sẽ gửi mã xác thực gồm 6 chữ số."
    >
      <View className="gap-6">
        <AuthField
          label="Số điện thoại"
          icon="phone"
          placeholder="0912 345 678"
          keyboardType="phone-pad"
          autoCapitalize="none"
          autoComplete="tel"
        />
        <Button
          size="lg"
          onPress={() =>
            router.push({
              pathname: "/verify-otp",
              params: { phone: "0912345678", flow: "reset" },
            })
          }
        >
          <Button.Label>Gửi mã xác thực</Button.Label>
        </Button>
      </View>
    </AuthScreen>
  );
}
