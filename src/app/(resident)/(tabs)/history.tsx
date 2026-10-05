import type { JSX } from "react";
import { View } from "react-native";

import { ResidentTabBar } from "@/components/resident-tab-scaffold";
import { ParcelHistoryContent } from "@/features/parcels/parcel-history-screen";

export default function HistoryScreen(): JSX.Element {
  return <View style={{ flex: 1 }}><ParcelHistoryContent /><ResidentTabBar /></View>;
}
