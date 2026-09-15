import type { JSX } from "react";
import Svg, { Path } from "react-native-svg";

import { useThemeColor } from "heroui-native";

export type GravityIconName =
  "arrow-left" | "envelope" | "eye" | "eye-slash" | "lock" | "phone" | "user";

// Path data follows Gravity Icons' 24px, round-line visual language.
const paths: Record<GravityIconName, string[]> = {
  "arrow-left": ["M20 12H4", "m10 6-6-6 6-6"],
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
  lock: [
    "M6 10V8a6 6 0 0 1 12 0v2",
    "M5 10h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2",
    "M12 14v3",
  ],
  phone: [
    "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z",
  ],
  user: ["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2", "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8"],
};

export function GravityIcon({
  name,
  size = 20,
}: {
  name: GravityIconName;
  size?: number;
}): JSX.Element {
  const color = useThemeColor("foreground");
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {paths[name].map((path) => (
        <Path
          key={path}
          d={path}
          stroke={color}
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}
