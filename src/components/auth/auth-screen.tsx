import { router } from "expo-router";
import { Button, Typography } from "heroui-native";
import type { JSX, ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

import { GravityIcon } from "@/components/icons/gravity-icon";
import { AppScreen } from "@/components/ui/app-screen";

export function AuthScreen({
  title,
  description,
  children,
  canGoBack = false,
}: {
  title: string;
  description: string;
  children: ReactNode;
  canGoBack?: boolean;
}): JSX.Element {
  return (
    <AppScreen>
      {canGoBack && (
        <Button
          isIconOnly
          variant="tertiary"
          accessibilityLabel="Quay lại"
          onPress={() => router.back()}
        >
          <GravityIcon name="arrow-left" />
        </Button>
      )}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="flex-grow justify-center py-8"
        >
          <View className="mb-8 gap-2">
            <Typography.Heading className="text-3xl">{title}</Typography.Heading>
            <Typography.Paragraph className="text-muted">{description}</Typography.Paragraph>
          </View>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}
