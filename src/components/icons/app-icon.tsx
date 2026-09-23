import { useThemeColor } from "heroui-native";
import type { JSX, ReactNode } from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";

export type AppIconName =
  | "arrow-left"
  | "bell"
  | "bluetooth"
  | "box"
  | "calendar"
  | "check"
  | "chevron"
  | "clock"
  | "history"
  | "home"
  | "lock"
  | "map-pin"
  | "moon"
  | "person"
  | "phone"
  | "receipt"
  | "settings"
  | "shield"
  | "sun"
  | "wifi";

export function AppIcon({
  name,
  size = 21,
  tone = "foreground",
}: {
  name: AppIconName;
  size?: number;
  tone?: "foreground" | "muted" | "accent" | "accent-foreground" | "success" | "danger";
}): JSX.Element {
  const color = useThemeColor(tone);
  const paths: Record<AppIconName, ReactNode> = {
    "arrow-left": <Path d="m15 18-6-6 6-6" />,
    bell: (
      <>
        <Path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <Path d="M10 21h4" />
      </>
    ),
    bluetooth: (
      <>
        <Path d="m7 7 10 10-5 4V3l5 4L7 17" />
      </>
    ),
    box: (
      <>
        <Path d="m21 8-9 5-9-5 9-5 9 5Z" />
        <Path d="m3 8 9 5 9-5v9l-9 5-9-5V8Z" />
        <Path d="M12 13v9" />
      </>
    ),
    calendar: (
      <>
        <Rect x="3" y="5" width="18" height="16" rx="2" />
        <Path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    check: <Path d="m5 12 4 4L19 6" />,
    chevron: <Path d="m9 18 6-6-6-6" />,
    clock: (
      <>
        <Circle cx="12" cy="12" r="9" />
        <Path d="M12 7v5l3 2" />
      </>
    ),
    history: (
      <>
        <Path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <Path d="M3 3v5h5M12 7v5l3 2" />
      </>
    ),
    home: (
      <>
        <Path d="m3 11 9-8 9 8" />
        <Path d="M5 10v10h14V10M9 20v-6h6v6" />
      </>
    ),
    lock: (
      <>
        <Rect x="5" y="10" width="14" height="11" rx="2" />
        <Path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
      </>
    ),
    "map-pin": (
      <>
        <Path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <Circle cx="12" cy="10" r="2.5" />
      </>
    ),
    moon: <Path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />,
    person: (
      <>
        <Circle cx="12" cy="8" r="4" />
        <Path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    phone: (
      <Path d="M6.6 2.8 9 8l-2.1 1.4a15 15 0 0 0 7.7 7.7L16 15l5.2 2.4-.6 3.2a2 2 0 0 1-2 1.6A16.8 16.8 0 0 1 1.8 5.4a2 2 0 0 1 1.6-2l3.2-.6Z" />
    ),
    receipt: (
      <>
        <Path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Z" />
        <Path d="M8 8h8M8 12h8M8 16h5" />
      </>
    ),
    settings: (
      <>
        <Circle cx="12" cy="12" r="3" />
        <Path d="M19 15a2 2 0 0 0 .4 2l-2.8 2.8a2 2 0 0 0-2-.4A2 2 0 0 0 13 21h-2a2 2 0 0 0-1.3-1.6 2 2 0 0 0-2 .4L4.9 17a2 2 0 0 0 .4-2A2 2 0 0 0 3 13v-2a2 2 0 0 0 2.3-2 2 2 0 0 0-.4-2l2.8-2.8a2 2 0 0 0 2 .4A2 2 0 0 0 11 3h2a2 2 0 0 0 1.3 1.6 2 2 0 0 0 2-.4L19.1 7a2 2 0 0 0-.4 2A2 2 0 0 0 21 11v2a2 2 0 0 0-2 2Z" />
      </>
    ),
    shield: (
      <>
        <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <Path d="m9 12 2 2 4-4" />
      </>
    ),
    sun: (
      <>
        <Circle cx="12" cy="12" r="4" />
        <Path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </>
    ),
    wifi: (
      <>
        <Path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0" />
        <Circle cx="12" cy="19" r="1" fill={color} stroke="none" />
      </>
    ),
  };

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </Svg>
  );
}
