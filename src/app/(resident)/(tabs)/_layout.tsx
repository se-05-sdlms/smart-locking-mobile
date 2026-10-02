import { Tabs } from "expo-router";
import type { JSX } from "react";

import { GravityIcon, type GravityIconName } from "@/components/icons/gravity-icon";
import { BoxoraLogo } from "@/components/auth/boxora-logo";

const icons: Record<string, GravityIconName> = {
  index: "home",
  history: "clock",
  notifications: "bell",
  profile: "user",
};

export default function ResidentTabsLayout(): JSX.Element {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#d95f18",
        tabBarInactiveTintColor: "#77716c",
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
        tabBarStyle: { height: 68, paddingBottom: 8, paddingTop: 8 },
        tabBarIcon: ({ color, size, focused }) =>
          route.name === "index" ? (
            <BoxoraLogo size={size + 4} symbolOnly muted={!focused} />
          ) : (
            <GravityIcon name={icons[route.name] ?? "home"} color={color} size={size} />
          ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Trang chủ" }} />
      <Tabs.Screen name="history" options={{ title: "Lịch sử" }} />
      <Tabs.Screen name="notifications" options={{ title: "Thông báo" }} />
      <Tabs.Screen name="profile" options={{ title: "Tài khoản" }} />
    </Tabs>
  );
}
