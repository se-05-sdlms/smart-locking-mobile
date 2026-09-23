import { router } from "expo-router";
import { Button, LinkButton, Typography } from "heroui-native";
import type { JSX } from "react";
import { useState } from "react";
import { View } from "react-native";

import { AuthField } from "@/components/auth/auth-field";
import { AuthScreen } from "@/components/auth/auth-screen";
import { BoxoraLogo } from "@/components/auth/boxora-logo";
import { useAuth } from "@/providers/auth-provider";

export default function LoginScreen(): JSX.Element {
  const { login } = useAuth();
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(): Promise<void> {
    if (!loginIdentifier.trim() || !password) {
      setError("Vui lòng nhập số điện thoại/email và mật khẩu.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await login(loginIdentifier, password);
      router.replace("/home");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Đăng nhập thất bại.");
    } finally {
      setSubmitting(false);
    }
  }

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
          label="Số điện thoại hoặc email"
          icon="phone"
          placeholder="0900 000 001"
          value={loginIdentifier}
          onChangeText={setLoginIdentifier}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
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
        />
        <View className="flex-row justify-end">
          <LinkButton onPress={() => router.push("/forgot-password")}>Quên mật khẩu?</LinkButton>
        </View>
        {error ? (
          <Typography.Paragraph className="text-sm text-danger">{error}</Typography.Paragraph>
        ) : null}
        <Button size="lg" isDisabled={submitting} onPress={() => void submit()}>
          <Button.Label>{submitting ? "Đang đăng nhập..." : "Đăng nhập"}</Button.Label>
        </Button>
        <View className="flex-row justify-center gap-1">
          <Typography.Paragraph className="text-muted">Chưa có tài khoản?</Typography.Paragraph>
          <LinkButton onPress={() => router.push("/register")}>Đăng ký</LinkButton>
        </View>
      </View>
    </AuthScreen>
  );
}
