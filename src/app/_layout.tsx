import { Stack } from "expo-router";
import { HeroUINativeProvider } from "heroui-native";
import type { JSX } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "@/providers/auth-provider";

import "../global.css";

export default function RootLayout(): JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <HeroUINativeProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </HeroUINativeProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
