import type { JSX, ReactNode } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function AppScreen({ children }: { children: ReactNode }): JSX.Element {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-5 pt-4">{children}</View>
    </SafeAreaView>
  );
}
