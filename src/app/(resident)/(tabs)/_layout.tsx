import { Slot } from "expo-router";
import type { JSX } from "react";
import { View } from "react-native";

import { ResidentTabBar } from "@/components/resident-tab-scaffold";

export default function ResidentTabsLayout(): JSX.Element {
  return (
    <View className="flex-1 bg-background">
      <Slot />
      <ResidentTabBar />
    </View>
  );
}
