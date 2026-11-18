import { useHeaderHeight } from "expo-router/react-navigation";
import type { JSX, ReactNode } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";

export function ResidentForm({ children }: { children: ReactNode }): JSX.Element {
  const headerHeight = useHeaderHeight();
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={headerHeight}
    >
      {children}
    </KeyboardAvoidingView>
  );
}
