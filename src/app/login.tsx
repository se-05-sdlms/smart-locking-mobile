import { router } from "expo-router";
import { Button, LinkButton, Typography } from "heroui-native";
import type { JSX } from "react";
import { useState } from "react";
import { View } from "react-native";

import { AuthField } from "@/components/auth/auth-field";
import { AuthScreen } from "@/components/auth/auth-screen";
import { GravityIcon } from "@/components/icons/gravity-icon";

export default function LoginScreen(): JSX.Element {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(): Promise<void> {
    if (!/^0\d{9}$/.test(phone.replace(/\s/g, "")) || password.length < 8) {
      setError("Vui lòng nhập số điện thoại hợp lệ và mật khẩu từ 8 ký tự.");
      return;
    }

    setError("");
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    router.replace("/home");
  }

  return (
    <AuthScreen
      title="Chào mừng trở lại"
      description="Đăng nhập để quản lý và nhận bưu kiện của bạn."
    >
      <View className="gap-4">
        <AuthField
          label="Số điện thoại"
          icon="phone"
          placeholder="0912 345 678"
          keyboardType="phone-pad"
          autoCapitalize="none"
          value={phone}
          onChangeText={setPhone}
          autoCorrect={false}
          autoComplete="tel"
          returnKeyType="next"
        />
        <AuthField
          label="Mật khẩu"
          icon="lock"
          placeholder="Nhập mật khẩu"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={() => void submit()}
          autoComplete="current-password"
          returnKeyType="done"
        />
        <View className="-mt-1 flex-row justify-end">
          <LinkButton onPress={() => router.push("/forgot-password")}>Quên mật khẩu?</LinkButton>
        </View>
        {error ? (
          <Typography.Paragraph className="text-sm text-danger">{error}</Typography.Paragraph>
        ) : null}
        <Button size="lg" className="mt-1" isDisabled={submitting} onPress={() => void submit()}>
          <Button.Label>{submitting ? "Đang đăng nhập..." : "Đăng nhập"}</Button.Label>
          {!submitting && <GravityIcon name="arrow-right" tone="accent-foreground" />}
        </Button>
        <View className="mt-1 flex-row items-center justify-center gap-1">
          <Typography.Paragraph className="text-muted">Chưa có tài khoản?</Typography.Paragraph>
          <LinkButton onPress={() => router.push("/register")}>Đăng ký</LinkButton>
        </View>
      </View>
    </AuthScreen>
  );
}
