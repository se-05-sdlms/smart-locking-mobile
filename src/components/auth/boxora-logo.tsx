import type { JSX } from "react";
import { Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

export function BoxoraLogo(): JSX.Element {
  return (
    <View className="items-center gap-2" accessibilityLabel="Boxora">
      <Svg width={78} height={78} viewBox="0 0 86 86">
        <Defs>
          <LinearGradient id="cube" x1="18" y1="12" x2="68" y2="70">
            <Stop stopColor="#FB923C" />
            <Stop offset="1" stop-color="#EA580C" />
          </LinearGradient>
        </Defs>
        <Path d="M43 12 68 26.5v29L43 70 18 55.5v-29z" fill="url(#cube)" />
        <Path d="M43 12v29l25 14.5v-29z" fill="#FDBA74" fillOpacity={0.9} />
        <Path d="M43 41v29L18 55.5v-29z" fill="#EA580C" fillOpacity={0.9} />
      </Svg>
      <Text className="text-3xl font-bold tracking-tight text-foreground">Boxora</Text>
    </View>
  );
}
