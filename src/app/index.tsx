import { Redirect } from "expo-router";
import { Spinner } from "heroui-native";
import type { JSX } from "react";
import { View } from "react-native";

import { useAuth } from "@/features/auth/auth-context";

export default function Index(): JSX.Element {
  const { initializing, user } = useAuth();
  if (initializing) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner />
      </View>
    );
  }
  return <Redirect href={user ? "/home" : "/welcome"} />;
}
