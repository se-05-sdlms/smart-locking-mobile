import { router } from "expo-router";
import { Button, Card, Typography } from "heroui-native";
import type { JSX, ReactNode } from "react";
import { ImageBackground, KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { BoxoraLogo } from "@/components/auth/boxora-logo";
import { GravityIcon } from "@/components/icons/gravity-icon";

const lockerBackground = require("../../../assets/images/boxora-locker-welcome.png") as number;

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
    <ImageBackground source={lockerBackground} resizeMode="cover" className="flex-1 bg-background">
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "right", "left", "bottom"]}>
        {canGoBack && (
          <Button
            isIconOnly
            size="sm"
            variant="secondary"
            className="absolute left-5 top-3 z-20"
            accessibilityLabel="Quay lại"
            onPress={() => router.back()}
          >
            <GravityIcon name="arrow-left" />
          </Button>
        )}
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            automaticallyAdjustKeyboardInsets
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerClassName="flex-grow justify-end pt-28"
          >
            <View className="mb-6 items-center">
              <BoxoraLogo />
            </View>
            <Card className="rounded-t-[32px] rounded-b-none px-6 pb-7 pt-8">
              <Card.Header className="mb-7 items-center gap-2">
                <Typography.Heading className="text-center text-3xl tracking-tight">
                  {title}
                </Typography.Heading>
                <Typography.Paragraph className="text-center text-sm leading-5 text-muted">
                  {description}
                </Typography.Paragraph>
              </Card.Header>
              <Card.Body className="p-0">{children}</Card.Body>
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}
