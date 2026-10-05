import type { JSX } from "react";
import { View } from "react-native";

import { ResidentTabBar } from "@/components/resident-tab-scaffold";
import { NotificationListScreen } from "@/features/notifications/notification-list-screen";

export default function NotificationsScreen(): JSX.Element {
  return <View style={{ flex: 1 }}><NotificationListScreen /><ResidentTabBar /></View>;
}
