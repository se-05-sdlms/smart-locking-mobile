import type { JSX } from "react";
import type { ColorValue } from "react-native";
import Svg, { Path } from "react-native-svg";

import { useThemeColor, type ThemeColor } from "heroui-native";

export type GravityIconName =
  | "alert-circle"
  | "arrow-left"
  | "arrow-right"
  | "bell"
  | "check-circle"
  | "clock"
  | "credit-card"
  | "envelope"
  | "eye"
  | "eye-slash"
  | "home"
  | "lock"
  | "package"
  | "phone"
  | "qr-code"
  | "refresh"
  | "unlock"
  | "user";

// Path data follows Gravity Icons' 24px, round-line visual language.
const paths: Record<GravityIconName, string[]> = {
  "alert-circle": ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20", "M12 7v6", "M12 17h.01"],
  "arrow-left": ["M20 12H4", "M10 6l-6 6 6 6"],
  "arrow-right": ["M4 12h16", "M14 6l6 6-6 6"],
  bell: ["M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9", "M10 21h4"],
  "check-circle": ["M22 11.1V12a10 10 0 1 1-5.9-9.1", "m9 11 3 3L22 4"],
  clock: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20", "M12 6v6l4 2"],
  "credit-card": ["M3 5h18v14H3z", "M3 9h18", "M7 15h3"],
  envelope: [
    "M3 6.5A2.5 2.5 0 0 1 5.5 4h13A2.5 2.5 0 0 1 21 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z",
    "m4 8 5 4 5-4",
  ],
  eye: [
    "M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6",
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6",
  ],
  "eye-slash": [
    "m4 4 16 16",
    "M9.8 6.3A9 9 0 0 1 12 6c6 0 9.5 6 9.5 6a14 14 0 0 1-2.1 2.8",
    "M6.1 6.9A14.5 14.5 0 0 0 2.5 12s3.5 6 9.5 6c1 0 1.9-.2 2.7-.5",
    "M10 10a3 3 0 0 0 4 4",
  ],
  home: ["m3 10 9-7 9 7", "M5 9v11h14V9", "M9 20v-6h6v6"],
  lock: [
    "M6 10V8a6 6 0 0 1 12 0v2",
    "M5 10h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2",
    "M12 14v3",
  ],
  package: ["m3 7 9-4 9 4-9 4z", "M3 7v10l9 4 9-4V7", "M12 11v10"],
  phone: [
    "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z",
  ],
  "qr-code": [
    "M3 3h7v7H3z",
    "M14 3h7v7h-7z",
    "M3 14h7v7H3z",
    "M14 14h3v3h-3z",
    "M18 18h3v3h-3z",
    "M18 14h3",
    "M14 18v3",
  ],
  refresh: [
    "M20 6v5h-5",
    "M4 18v-5h5",
    "M18.5 9A7 7 0 0 0 6 6.5L4 11",
    "M5.5 15A7 7 0 0 0 18 17.5l2-4.5",
  ],
  unlock: [
    "M7 10V7a5 5 0 0 1 9.5-2",
    "M5 10h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2",
    "M12 14v3",
  ],
  user: ["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2", "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8"],
};

export function GravityIcon({
  name,
  size = 20,
  tone = "foreground",
  color,
}: {
  name: GravityIconName;
  size?: number;
  tone?: ThemeColor;
  color?: ColorValue;
}): JSX.Element {
  const themeColor = useThemeColor(tone);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {paths[name].map((path) => (
        <Path
          key={path}
          d={path}
          stroke={color ?? themeColor}
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}
