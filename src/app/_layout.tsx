import { Stack } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { HeroUINativeProvider } from "heroui-native";
import type { JSX } from "react";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Uniwind } from "uniwind";

import { AuthProvider } from "@/features/auth/auth-context";
import { NotificationBridge } from "@/features/notifications/notification-bridge";
import "../global.css";

export default function RootLayout(): JSX.Element {
  useEffect(() => { void SecureStore.getItemAsync("boxora-theme").then((theme) => { if (theme === "dark" || theme === "light") Uniwind.setTheme(theme); }); }, []);
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
