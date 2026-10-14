import { NativeTabs } from "expo-router/unstable-native-tabs";
import type { JSX } from "react";
import { useUniwind } from "uniwind";
import { residentPalette } from "@/theme/tokens";

// Raster exports of existing GravityIcon paths; native tabs require image sources.
const tabs = [
  { name: "index", label: "Trang chủ", icon: require("../../../../assets/icons/tabs/home.png") },
  { name: "history", label: "Lịch sử", icon: require("../../../../assets/icons/tabs/clock.png") },
  { name: "send", label: "Gửi đồ", icon: require("../../../../assets/icons/tabs/send.png") },
  { name: "profile", label: "Tài khoản", icon: require("../../../../assets/icons/tabs/user.png") },
];
export default function ResidentTabsLayout(): JSX.Element {
  const { theme } = useUniwind();
  const palette = residentPalette[theme === "dark" ? "dark" : "light"];
  return (
    <NativeTabs
      backBehavior="history"
      backgroundColor={palette.canvas}
      tintColor={palette.accent}
      iconColor={{ default: palette.muted, selected: palette.accent }}
      labelStyle={{
        default: { color: palette.muted, fontSize: 12 },
        selected: { color: palette.accent, fontWeight: "600" },
      }}
      indicatorColor={palette.soft}
      labelVisibilityMode="labeled"
      disableTransparentOnScrollEdge
    >
      {tabs.map((tab) => (
        <NativeTabs.Trigger key={tab.name} name={tab.name} accessibilityLabel={tab.label}>
          <NativeTabs.Trigger.Icon src={tab.icon} renderingMode="template" />
          <NativeTabs.Trigger.Label>{tab.label}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
