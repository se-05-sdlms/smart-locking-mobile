import { Redirect, Stack } from "expo-router";
import { Spinner } from "heroui-native";
import type { JSX } from "react";
import { View } from "react-native";
import { useUniwind } from "uniwind";
import { residentPalette } from "@/theme/tokens";

import { useAuth } from "@/features/auth/auth-context";

export default function ResidentLayout(): JSX.Element {
  const { initializing, user } = useAuth();
  const { theme } = useUniwind();
  const palette = residentPalette[theme === "dark" ? "dark" : "light"];
  if (initializing) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner />
      </View>
    );
  }
  if (!initializing && !user) return <Redirect href="/login" />;
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: palette.canvas },
        headerTintColor: palette.text,
        contentStyle: { backgroundColor: palette.canvas },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="parcels/[id]" options={{ title: "Chi tiết bưu kiện" }} />
      <Stack.Screen name="delivery-requests/[id]" options={{ title: "Yêu cầu giao hàng" }} />
      <Stack.Screen name="returns/[id]" options={{ title: "Chi tiết đồ gửi" }} />
      <Stack.Screen name="retrieval/[parcelId]" options={{ title: "Nhận hàng" }} />
      <Stack.Screen name="payments/[id]" options={{ title: "Chi tiết thanh toán" }} />
    </Stack>
  );
}
