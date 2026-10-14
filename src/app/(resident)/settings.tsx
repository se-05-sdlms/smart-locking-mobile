import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { Button, ControlField, ListGroup, Separator, Switch, Typography } from "heroui-native";
import type { JSX } from "react";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "@/components/ui/themed-safe-area-view";
import { Uniwind, useUniwind } from "uniwind";

import { ScreenHeader } from "@/components/ui/resident-ui";
import { GravityIcon } from "@/components/icons/gravity-icon";

export default function SettingsScreen(): JSX.Element {
  const { theme, hasAdaptiveThemes } = useUniwind();
  const preference = hasAdaptiveThemes ? "system" : theme;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const changeTheme = async (next: "system" | "light" | "dark") => {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      await SecureStore.setItemAsync("boxora-theme", next);
      Uniwind.setTheme(next);
    } catch {
      setError("Không thể lưu giao diện. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-6 px-5 pb-8 pt-4"
      >
        <ScreenHeader title="Cài đặt" />
        <View className="gap-2">
          <Typography.Paragraph className="text-sm font-semibold text-muted">
            Tài khoản
          </Typography.Paragraph>
          <ListGroup variant="transparent">
            <ListGroup.Item onPress={() => router.push("/account-package")}>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>Gói tài khoản</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  Xem hạn mức và đăng ký gói mới
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix>
                <GravityIcon name="chevron-right" size={18} />
              </ListGroup.ItemSuffix>
            </ListGroup.Item>
          </ListGroup>
        </View>
        <View className="gap-2">
          <Typography.Paragraph className="text-sm font-semibold text-muted">
            Thông báo
          </Typography.Paragraph>
          <ListGroup variant="transparent">
            <ToggleRow title="Thông báo bưu kiện mới" />
            <Separator />
            <ToggleRow title="Thông báo giao hàng" />
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
                isDisabled={saving}
                variant={preference === option.value ? "primary" : "secondary"}
                onPress={() => void changeTheme(option.value as "system" | "light" | "dark")}
              >
                <Button.Label>{option.label}</Button.Label>
              </Button>
            ))}
          </View>
        </View>
        {error ? (
          <Typography.Paragraph accessibilityRole="alert" className="text-danger">
            {error}
          </Typography.Paragraph>
        ) : null}
        <Typography.Paragraph className="mt-auto text-center text-xs text-muted">
          Boxora 1.0.0
        </Typography.Paragraph>
      </ScrollView>
    </SafeAreaView>
  );
}
function ToggleRow({ title }: { title: string }): JSX.Element {
  return (
    <ControlField className="px-1 py-3" isSelected={false} isDisabled>
      <View className="flex-1 gap-1">
        <Typography.Paragraph className="font-medium">{title}</Typography.Paragraph>
        <Typography.Paragraph className="text-sm text-muted">
          Chưa khả dụng — chưa hỗ trợ tùy chỉnh loại thông báo.
        </Typography.Paragraph>
      </View>
      <ControlField.Indicator>
        <Switch />
      </ControlField.Indicator>
    </ControlField>
  );
}
