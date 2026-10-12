import { router } from "expo-router";
import { Button, LinkButton, Typography } from "heroui-native";
import type { JSX, ReactNode } from "react";
import { View } from "react-native";
import { useUniwind } from "uniwind";

import { GravityIcon } from "@/components/icons/gravity-icon";

export function ScreenHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}): JSX.Element {
  const { theme } = useUniwind();
  return (
    <View className="flex-row items-center gap-3">
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        accessibilityLabel="Quay lại"
        onPress={() => router.back()}
      >
        <GravityIcon name="arrow-left" color={theme === "dark" ? "#f8f6f3" : "#1d1b1a"} />
      </Button>
      <Typography.Heading className="flex-1 text-2xl">{title}</Typography.Heading>
      {action}
    </View>
  );
}

export function IncidentAction({ onPress }: { onPress: () => void }): JSX.Element {
  return (
    <LinkButton className="self-center px-3 py-2" onPress={onPress}>
      <LinkButton.Label className="text-accent underline">Báo sự cố</LinkButton.Label>
    </LinkButton>
  );
}

export function FlowSteps({ labels, active }: { labels: string[]; active: number }): JSX.Element {
  return (
    <View className="flex-row items-start">
      {labels.map((label, index) => {
        const complete = index < active;
        const selected = index === active;
        return (
          <View key={label} className="flex-1 items-center">
            <View className="w-full flex-row items-center">
              <View
                className={
                  index === 0
                    ? "h-px flex-1 bg-transparent"
                    : `h-px flex-1 ${complete || selected ? "bg-accent" : "bg-default"}`
                }
              />
              <View
                className={`h-7 w-7 items-center justify-center rounded-full ${complete || selected ? "bg-accent" : "bg-default"}`}
              >
                {complete ? (
                  <GravityIcon name="check" size={14} tone="accent-foreground" />
                ) : (
                  <Typography.Paragraph
                    className={
                      selected ? "text-xs font-bold text-accent-foreground" : "text-xs text-muted"
                    }
                  >
                    {index + 1}
                  </Typography.Paragraph>
                )}
              </View>
              <View
                className={
                  index === labels.length - 1
                    ? "h-px flex-1 bg-transparent"
                    : `h-px flex-1 ${complete ? "bg-accent" : "bg-default"}`
                }
              />
            </View>
            <Typography.Paragraph
              className={
                selected
                  ? "mt-1 text-center text-xs font-semibold text-accent"
                  : "mt-1 text-center text-xs text-muted"
              }
            >
              {label}
            </Typography.Paragraph>
          </View>
        );
      })}
    </View>
  );
}
