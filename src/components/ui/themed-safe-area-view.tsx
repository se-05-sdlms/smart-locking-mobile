import type { ComponentProps, JSX } from "react";
import { Platform } from "react-native";
import { SafeAreaView as NativeSafeAreaView } from "react-native-safe-area-context";
import { useUniwind } from "uniwind";
import { residentPalette } from "@/theme/tokens";

type Props = ComponentProps<typeof NativeSafeAreaView>;

export function SafeAreaView({
  style,
  edges = ["left", "right", "bottom"],
  ...props
}: Props): JSX.Element {
  const { theme } = useUniwind();

  return (
    <NativeSafeAreaView
      {...props}
      edges={
        Platform.OS === "ios" && Array.isArray(edges)
          ? edges.filter((edge) => edge !== "top")
          : edges
      }
      style={[
        { flex: 1, backgroundColor: residentPalette[theme === "dark" ? "dark" : "light"].canvas },
        style,
      ]}
    />
  );
}
