import type { ComponentProps, JSX } from "react";
import { SafeAreaView as NativeSafeAreaView } from "react-native-safe-area-context";
import { useUniwind } from "uniwind";

type Props = ComponentProps<typeof NativeSafeAreaView>;

export function SafeAreaView({ style, ...props }: Props): JSX.Element {
  const { theme } = useUniwind();

  return (
    <NativeSafeAreaView
      {...props}
      style={[
        { flex: 1, backgroundColor: theme === "dark" ? "#100d0b" : "#fbf8f3" },
        style,
      ]}
    />
  );
}
