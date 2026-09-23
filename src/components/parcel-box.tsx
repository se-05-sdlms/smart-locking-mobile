import { useThemeColor } from "heroui-native";
import type { JSX } from "react";
import Svg, { Path, Polygon } from "react-native-svg";

export function ParcelBox({ size = 58 }: { size?: number }): JSX.Element {
  const [accent, warning] = useThemeColor(["accent", "warning"]);
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Polygon points="8,19 31,8 56,20 32,32" fill={warning} opacity={0.55} />
      <Polygon points="8,19 32,32 32,57 8,43" fill={warning} opacity={0.8} />
      <Polygon points="32,32 56,20 56,44 32,57" fill={warning} opacity={0.66} />
      <Path d="m21 13 25 12M32 32v25M20 26l24-12" stroke={accent} strokeWidth="2" opacity={0.4} />
      <Path d="M14 34h12" stroke={accent} strokeWidth="2.5" strokeLinecap="round" opacity={0.6} />
    </Svg>
  );
}
