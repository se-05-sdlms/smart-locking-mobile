import { Image, type ImageProps } from "expo-image";
import { Typography } from "heroui-native";
import type { JSX } from "react";
import { useState } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { GravityIcon } from "@/components/icons/gravity-icon";

type Props = {
  uri?: string | null;
  recyclingKey?: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  contentFit?: ImageProps["contentFit"];
  onError?: () => void;
};

export function ParcelImage(props: Props): JSX.Element {
  return <ImageContent key={`${props.recyclingKey ?? ""}:${props.uri ?? ""}`} {...props} />;
}

function ImageContent({
  uri,
  recyclingKey,
  className,
  style,
  accessibilityLabel = "Ảnh bưu kiện",
  contentFit = "cover",
  onError,
}: Props): JSX.Element {
  const [failed, setFailed] = useState(false);
  return (
    <View className={`overflow-hidden bg-default ${className ?? ""}`} style={style}>
      <View
        accessible={failed || !uri}
        accessibilityElementsHidden={!failed && !!uri}
        importantForAccessibility={failed || !uri ? "yes" : "no-hide-descendants"}
        accessibilityLabel="Không có ảnh bưu kiện"
        className="absolute inset-0 items-center justify-center"
      >
        <GravityIcon name="package" tone="muted" size={24} />
        {failed ? (
          <Typography.Paragraph className="mt-1 text-center text-xs text-muted">
            Ảnh không khả dụng
          </Typography.Paragraph>
        ) : null}
      </View>
      {uri && !failed ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit={contentFit}
          cachePolicy="memory-disk"
          recyclingKey={recyclingKey ?? uri}
          transition={120}
          accessibilityLabel={accessibilityLabel}
          onError={() => {
            setFailed(true);
            onError?.();
          }}
        />
      ) : null}
    </View>
  );
}
