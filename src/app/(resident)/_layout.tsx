import { Redirect, Slot } from "expo-router";
import { Spinner } from "heroui-native";
import type { JSX } from "react";
import { View } from "react-native";

import { useAuth } from "@/features/auth/auth-context";

export default function ResidentLayout(): JSX.Element {
  const { initializing, user } = useAuth();
  if (initializing) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner />
      </View>
    );
  }
  if (!initializing && !user) return <Redirect href="/login" />;
  return <Slot />;
}
