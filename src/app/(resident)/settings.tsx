import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { Alert, Label, ListGroup, Radio, RadioGroup, Typography } from "heroui-native";
import type { JSX } from "react";
import { useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import { Uniwind, useUniwind } from "uniwind";
import { ScreenHeader } from "@/components/ui/resident-ui";
import { SafeAreaView } from "@/components/ui/themed-safe-area-view";
import { ActionError } from "@/components/ui/action-error";
import { GravityIcon } from "@/components/icons/gravity-icon";

type ThemePreference = "system" | "light" | "dark";
const options: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "Hệ thống" },
  { value: "light", label: "Sáng" },
  { value: "dark", label: "Tối" },
];
export default function SettingsScreen(): JSX.Element {
  const { theme, hasAdaptiveThemes } = useUniwind();
  const preference = hasAdaptiveThemes ? "system" : theme;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState<string | null>(null);
  const pending = useRef(false);
  const changeTheme = async (next: string) => {
    if (pending.current || !options.some((option) => option.value === next)) return;
    pending.current = true;
    setSaving(true);
    setError("");
    try {
      await SecureStore.setItemAsync("boxora-theme", next);
      Uniwind.setTheme(next as ThemePreference);
    } catch {
      setError("Không thể lưu giao diện. Lựa chọn trước đó được giữ lại; hãy chọn lại để thử.");
    } finally {
      pending.current = false;
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
          <Typography.Heading className="text-base">Tài khoản</Typography.Heading>
          <ListGroup variant="transparent">
            <ListGroup.Item
              accessibilityRole="button"
              accessibilityLabel="Gói tài khoản, xem hạn mức và đăng ký gói mới"
              className="min-h-12"
              onPress={() => router.push("/account-package")}
            >
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
          <Typography.Heading className="text-base">Thông báo</Typography.Heading>
          <Alert status="default" className="bg-surface-secondary">
            <Alert.Indicator>
              <GravityIcon name="bell" tone="muted" />
            </Alert.Indicator>
            <Alert.Content>
              <Alert.Description>
                Ứng dụng chưa hỗ trợ tùy chỉnh từng loại thông báo. Bạn có thể quản lý quyền thông
                báo trong Cài đặt của thiết bị.
              </Alert.Description>
            </Alert.Content>
          </Alert>
        </View>
        <View className="gap-3">
          <Typography.Heading className="text-base" nativeID="theme-label">
            Giao diện
          </Typography.Heading>
          <RadioGroup
            value={preference}
            onValueChange={(value) => void changeTheme(value)}
            isDisabled={saving}
            accessibilityLabel="Giao diện ứng dụng"
            className="flex-row flex-wrap gap-2"
          >
            {options.map((option) => (
              <RadioGroup.Item
                key={option.value}
                value={option.value}
                accessibilityLabel={option.label}
                onFocus={() => setFocused(option.value)}
                onBlur={() => setFocused(null)}
                className={`min-h-12 min-w-24 flex-1 flex-row items-center gap-2 rounded-xl border px-3 py-3 ${preference === option.value ? "border-accent bg-accent-soft" : "border-border bg-surface-secondary"} ${focused === option.value ? "border-2 border-link" : ""}`}
              >
                <Radio />
                <Label
                  className={`min-w-0 flex-1 text-sm ${preference === option.value ? "font-semibold text-link" : "text-foreground"}`}
                >
                  {option.label}
                </Label>
              </RadioGroup.Item>
            ))}
          </RadioGroup>
          {saving ? (
            <Typography.Paragraph accessibilityLiveRegion="polite" className="text-sm text-muted">
              Đang lưu giao diện...
            </Typography.Paragraph>
          ) : null}
          {error ? <ActionError message={error} title="Chưa lưu được giao diện" /> : null}
        </View>
        <Typography.Paragraph className="text-center text-xs text-muted">
          Boxora 1.0.0
        </Typography.Paragraph>
      </ScrollView>
    </SafeAreaView>
  );
}
