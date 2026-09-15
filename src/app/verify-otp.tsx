import { router, useLocalSearchParams } from "expo-router";
import { Button, InputOTP, LinkButton, Typography } from "heroui-native";
import type { JSX } from "react";
import { useState } from "react";
import { View } from "react-native";

import { AuthScreen } from "@/components/auth/auth-screen";

export default function VerifyOtpScreen(): JSX.Element {
  const { phone = "số điện thoại của bạn", flow } = useLocalSearchParams<{
    phone?: string;
    flow?: string;
  }>();
  const [otp, setOtp] = useState("");
  return (
    <AuthScreen canGoBack title="Xác thực SĐT" description={`Nhập mã đã được gửi đến ${phone}.`}>
      <View className="items-center gap-7">
        <InputOTP
          maxLength={6}
          value={otp}
          onChange={setOtp}
          inputMode="numeric"
          textInputProps={{ accessibilityLabel: "Mã xác thực 6 chữ số" }}
        >
          <InputOTP.Group>
            {Array.from({ length: 6 }, (_, index) => (
              <InputOTP.Slot key={index} index={index} />
            ))}
          </InputOTP.Group>
        </InputOTP>
        <View className="items-center gap-1">
          <Typography.Paragraph className="text-muted">Bạn chưa nhận được mã?</Typography.Paragraph>
          <LinkButton>Gửi lại mã</LinkButton>
        </View>
        <Button
          className="w-full"
          size="lg"
          isDisabled={otp.length !== 6}
          onPress={() =>
            flow === "reset" ? router.replace("/reset-password") : router.replace("/login")
          }
        >
          <Button.Label>Xác nhận</Button.Label>
        </Button>
      </View>
    </AuthScreen>
  );
}
