import * as SecureStore from "expo-secure-store";
import { Button, ControlField, ListGroup, Separator, Switch, Typography } from "heroui-native";
import type { JSX } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "@/components/ui/themed-safe-area-view";
import { Uniwind, useUniwind } from "uniwind";

import { ScreenHeader } from "@/components/ui/resident-ui";

export default function SettingsScreen(): JSX.Element {
  const { theme, hasAdaptiveThemes } = useUniwind();
  const preference = hasAdaptiveThemes ? "system" : theme;
  const changeTheme = async (next: "system" | "light" | "dark") => {
    Uniwind.setTheme(next);
    await SecureStore.setItemAsync("boxora-theme", next);
  };
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-6 px-5 pb-8 pt-4">
        <ScreenHeader title="Cài đặt" />
        <View className="gap-2">
          <Typography.Paragraph className="text-sm font-semibold text-muted">
            Thông báo
          </Typography.Paragraph>
          <ListGroup variant="transparent">
            <ToggleRow title="Thông báo bưu kiện mới" selected />
            <Separator />
            <ToggleRow title="Thông báo giao hàng" selected />
          </ListGroup>
        </View>
        <View className="gap-2">
          <Typography.Paragraph className="text-sm font-semibold text-muted">
            Giao diện
          </Typography.Paragraph>
          <View className="flex-row gap-2">
            {[
              { value: "system", label: "Hệ thống" },
              { value: "light", label: "Sáng" },
              { value: "dark", label: "Tối" },
            ].map((option) => (
              <Button
                key={option.value}
                className="min-w-0 flex-1"
                size="sm"
                variant={preference === option.value ? "primary" : "secondary"}
                onPress={() =>
                  void changeTheme(option.value as "system" | "light" | "dark")
                }
              >
                <Button.Label>{option.label}</Button.Label>
              </Button>
            ))}
          </View>
        </View>
        <Typography.Paragraph className="mt-auto text-center text-xs text-muted">
          Boxora 1.0.0
        </Typography.Paragraph>
      </ScrollView>
    </SafeAreaView>
  );
}
function ToggleRow({
  title,
  selected,
  onChange,
}: {
  title: string;
  selected: boolean;
  onChange?: (value: boolean) => void;
}): JSX.Element {
  return (
    <ControlField className="px-1 py-3" isSelected={selected} onSelectedChange={onChange}>
      <Typography.Paragraph className="flex-1 font-medium">{title}</Typography.Paragraph>
      <ControlField.Indicator>
        <Switch />
      </ControlField.Indicator>
    </ControlField>
  );
}
