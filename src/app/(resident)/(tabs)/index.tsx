import type { JSX } from "react";
import { View } from "react-native";

import { ResidentTabBar } from "@/components/resident-tab-scaffold";
import { ResidentHomeContent } from "@/features/parcels/resident-home-screen";

export default function ResidentHomeScreen(): JSX.Element {
  return <View style={{ flex: 1 }}><ResidentHomeContent /><ResidentTabBar /></View>;
}
