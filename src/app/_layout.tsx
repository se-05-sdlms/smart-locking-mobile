import { Stack } from "expo-router";
import { HeroUINativeProvider } from "heroui-native";
import type { JSX } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AuthProvider } from "@/features/auth/auth-context";
import { NotificationBridge } from "@/features/notifications/notification-bridge";
import "../global.css";

export default function RootLayout(): JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <AuthProvider>
          <NotificationBridge />
          <Stack screenOptions={{ headerShown: false }} />
        </AuthProvider>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
