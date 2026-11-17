import { Stack } from "expo-router";
import type { JSX } from "react";

import { LegalScreen } from "@/features/legal/legal-screen";

export default function LegalRoute(): JSX.Element {
  return (
    <>
      <Stack.Screen options={{ title: "Tài liệu pháp lý", headerShown: true }} />
      <LegalScreen />
    </>
  );
}
