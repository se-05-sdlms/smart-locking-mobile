import type { ReactNode } from "react";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { GravityIcon } from "@/components/icons/gravity-icon";

export const colors = {
  ink: "#172039",
  muted: "#747985",
  orange: "#F87919",
  cream: "#FFFBF4",
  line: "#F1EEE8",
  red: "#E5363D",
  green: "#159B80",
};

export function OrangeHeader({ children }: { children: ReactNode }) {
  return (
    <View style={styles.header}>
      <Svg
        style={StyleSheet.absoluteFill}
        width="100%"
        height="100%"
        viewBox="0 0 400 180"
        preserveAspectRatio="none"
      >
        <Defs>
          <LinearGradient id="header" x1="0" y1="0" x2="1" y2="1">
            <Stop stopColor="#FA6715" />
            <Stop offset="1" stopColor="#FFB850" />
          </LinearGradient>
        </Defs>
        <Rect width="400" height="180" fill="url(#header)" />
        <Path d="M230 0Q180 100 400 125V0Z" fill="#FFCF77" opacity=".15" />
        <Path d="M0 160C95 204 245 116 400 167V180H0Z" fill={colors.cream} />
      </Svg>
      {children}
    </View>
  );
}

export function ParcelArt({ size = 64, open = false }: { size?: number; open?: boolean }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      accessibilityLabel={open ? "Hộp hàng đang mở" : "Bưu kiện"}
    >
      <Circle cx="60" cy="64" r="52" fill="#FFF4E1" />
      <Path d="M27 53 60 37 94 53 60 70Z" fill="#F8BF78" />
      <Path d="M27 53v35l33 17V70Z" fill="#EFA65B" />
      <Path d="M60 70v35l34-17V53Z" fill="#D99147" />
      {open ? (
        <>
          <Path d="m27 53-16 16 34 17 15-16Z" fill="#FFCF84" />
          <Path d="m60 70 17 15 34-17-17-15Z" fill="#FFE0A4" />
          <Path d="M60 37 43 24 11 41l16 12Z" fill="#FFA94B" />
          <Path d="m60 37 18-13 33 17-17 12Z" fill="#FFBE64" />
          <Path
            d="M60 13V3M35 20l-5-9M85 20l5-9"
            stroke="#F89124"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      ) : (
        <Path d="m43 45 33 17v17l9-4V57L52 41Z" fill="#FFDBA4" />
      )}
    </Svg>
  );
}

export function ParcelThumb({
  uri,
  size = 100,
  compartment = "12",
}: {
  uri?: string | null;
  size?: number;
  compartment?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (uri && !failed)
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size * 1.25, borderRadius: 16 }}
        resizeMode="cover"
        onError={() => setFailed(true)}
        accessibilityLabel="Ảnh bưu kiện"
      />
    );
  return (
    <View
      style={{
        width: size,
        height: size * 1.25,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: "#FFB154",
      }}
    >
      <Svg width="100%" height="100%" viewBox="0 0 100 125">
        <Rect width="100" height="125" fill="#F59023" />
        <Path d="M5 5h80v110H5Z" fill="#FFAC43" />
        <Path d="M15 20h66v83H15Z" fill="#303534" />
        <Path d="M21 26h53v69H21Z" fill="#53554F" />
        <Path d="M21 95 38 82h36v13Z" fill="#757A6E" />
        <Path d="m35 50 19-6 19 9-19 7Z" fill="#E9C99B" />
        <Path d="M35 50v28l19 10V60Z" fill="#C99C68" />
        <Path d="M54 60v28l19-8V53Z" fill="#DEC19A" />
        <Rect x="57" y="65" width="9" height="9" fill="#F9F2E4" />
        <Path d="M10 18 26 24v80l-16 13Z" fill="#E36F12" />
        <Path d="M14 30v14M14 78v14" stroke="#8D4C21" strokeWidth="2" />
      </Svg>
      <Text
        style={{
          position: "absolute",
          top: 8,
          right: 6,
          color: "white",
          fontSize: 10,
          fontWeight: "700",
        }}
      >
        {compartment}
      </Text>
    </View>
  );
}

export function Chip({ label, status }: { label: string; status: string }) {
  const green = status === "Retrieved",
    red = status === "Overdue",
    gray = status === "Removed";
  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: green ? "#E0F7EB" : red ? "#FFE6E5" : gray ? "#F0F1F3" : "#FFF1CD" },
      ]}
    >
      <Text
        style={{
          color: green ? colors.green : red ? colors.red : gray ? colors.muted : "#CD761A",
          fontSize: 11,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export function Action({
  label,
  onPress,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        secondary && { backgroundColor: "#FFF0E0" },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={{ color: secondary ? colors.orange : "#FFF", fontWeight: "700", fontSize: 15 }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function InfoRow({
  icon,
  children,
  danger = false,
}: {
  icon: "clock" | "package" | "credit-card";
  children: ReactNode;
  danger?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <GravityIcon name={icon} color={danger ? colors.red : colors.ink} size={20} />
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  header: {
    minHeight: 156,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 35,
    justifyContent: "center",
  },
  body: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 28, gap: 22 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  between: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  heading: { color: colors.ink, fontSize: 20, fontWeight: "700", letterSpacing: -0.4 },
  text: { color: colors.ink, fontSize: 14, lineHeight: 21 },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  card: {
    backgroundColor: "white",
    borderRadius: 22,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: "#FFF",
  },
  chip: { borderRadius: 30, paddingHorizontal: 10, paddingVertical: 6, alignSelf: "flex-start" },
  infoRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  action: {
    backgroundColor: colors.orange,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    minHeight: 48,
  },
  demo: {
    color: "#A36314",
    fontSize: 12,
    textAlign: "center",
    backgroundColor: "#FFF0D7",
    borderRadius: 10,
    padding: 8,
  },
});
