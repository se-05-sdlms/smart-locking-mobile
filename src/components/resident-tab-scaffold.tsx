import { router, usePathname } from "expo-router";
import type { JSX } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUniwind } from "uniwind";

import { GravityIcon, type GravityIconName } from "@/components/icons/gravity-icon";

const tabs: { label: string; icon: GravityIconName; path: "/" | "/history" | "/notifications" | "/profile" }[] = [
  { label: "Trang chủ", icon: "home", path: "/" },
  { label: "Lịch sử", icon: "clock", path: "/history" },
  { label: "Thông báo", icon: "bell", path: "/notifications" },
  { label: "Tài khoản", icon: "user", path: "/profile" },
];

export function ResidentTabBar(): JSX.Element {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { theme } = useUniwind();
  const dark = theme === "dark";

  return (
      <View
        accessibilityRole="tablist"
        style={{
          minHeight: 68 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: dark ? "#3c3530" : "#e9e2dc",
          backgroundColor: dark ? "#211d1a" : "#ffffff",
          flexDirection: "row",
        }}
      >
        {tabs.map((tab) => {
          const active = pathname === tab.path;
          const color = active ? "#d95f18" : dark ? "#b9afa8" : "#77716c";
          return (
            <Pressable
              key={tab.path}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: active }}
              onPress={() => router.replace(tab.path)}
              style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 3 }}
            >
              <GravityIcon name={tab.icon} color={color} size={24} />
              <Text style={{ color, fontSize: 12, fontWeight: "600" }}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
  );
}
