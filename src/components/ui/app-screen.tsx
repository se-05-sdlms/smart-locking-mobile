import { useThemeColor } from "heroui-native";
import type { JSX, ReactNode } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

export function AppScreen({
  children,
  padded = true,
}: {
  children: ReactNode;
  padded?: boolean;
}): JSX.Element {
  const backgroundColor = useThemeColor("background");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }} edges={["top", "right", "left"]}>
      <StatusBar style="auto" />
      <View className={`flex-1 bg-background ${padded ? "px-5 pt-3" : ""}`}>{children}</View>
    </SafeAreaView>
  );
}
