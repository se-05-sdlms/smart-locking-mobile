import type { JSX, ReactNode } from "react";
import { SafeAreaView, View } from "react-native";

export function AppScreen({ children }: { children: ReactNode }): JSX.Element {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-5 pt-4">{children}</View>
    </SafeAreaView>
  );
}
