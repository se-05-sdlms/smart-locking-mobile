import { router, useLocalSearchParams } from "expo-router";
import { Button, Typography } from "heroui-native";
import type { JSX } from "react";
import { ScrollView, View } from "react-native";

import { SafeAreaView } from "@/components/ui/themed-safe-area-view";
import { LEGAL_VERSION, legalDocuments, type LegalDocument } from "@/features/legal/content";

export function LegalScreen(): JSX.Element {
  const { document } = useLocalSearchParams<{ document?: string }>();
  const key: LegalDocument = document === "privacy" ? "privacy" : "terms";
  const content = legalDocuments[key];
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        accessibilityLabel={content.title}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-5 px-5 pb-10 pt-5"
      >
        <View className="gap-2">
          <Typography.Heading accessibilityRole="header" className="text-2xl">
            {content.title}
          </Typography.Heading>
          <Typography.Paragraph className="text-sm text-muted">
            Phiên bản {LEGAL_VERSION}
          </Typography.Paragraph>
        </View>
        {content.paragraphs.map((paragraph) => (
          <Typography.Paragraph key={paragraph} className="text-base leading-6">
            {paragraph}
          </Typography.Paragraph>
        ))}
        <Button accessibilityLabel="Quay lại" variant="secondary" onPress={() => router.back()}>
          <Button.Label>Quay lại</Button.Label>
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
