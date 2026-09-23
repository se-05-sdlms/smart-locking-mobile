import { Tabs } from "expo-router";
import { Button } from "heroui-native";
import type { ComponentProps, JSX } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppIcon, type AppIconName } from "@/components/icons/app-icon";

const tabs: Record<string, { label: string; icon: AppIconName }> = {
  home: { label: "Đơn hàng", icon: "box" },
  notifications: { label: "Thông báo", icon: "bell" },
  history: { label: "Lịch sử", icon: "history" },
  account: { label: "Tài khoản", icon: "person" },
};

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];

function TabBar({ state, descriptors, navigation }: TabBarProps): JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <View
      accessibilityRole="tablist"
      className="flex-row border-t border-border bg-background px-2 pt-2"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const tab = tabs[route.name];
        const options = descriptors[route.key].options;

        return (
          <Button
            key={route.key}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? tab.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: isFocused }}
            testID={options.tabBarButtonTestID}
            variant="ghost"
            size="sm"
            className="h-14 flex-1 flex-col gap-1"
            onLongPress={() => navigation.emit({ type: "tabLongPress", target: route.key })}
            onPress={() => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            }}
          >
            <View>
              <AppIcon name={tab.icon} size={20} tone={isFocused ? "accent" : "muted"} />
              {route.name === "notifications" && (
                <View className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-danger" />
              )}
            </View>
            <Button.Label
              numberOfLines={1}
              className={isFocused ? "text-xs text-accent" : "text-xs text-muted"}
            >
              {tab.label}
            </Button.Label>
          </Button>
        );
      })}
    </View>
  );
}

export default function TabsLayout(): JSX.Element {
  return (
    <Tabs
      backBehavior="history"
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        lazy: true,
        freezeOnBlur: true,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: "Đơn hàng", tabBarAccessibilityLabel: "Tab đơn hàng" }}
      />
      <Tabs.Screen
        name="notifications"
        options={{ title: "Thông báo", tabBarAccessibilityLabel: "Tab thông báo" }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: "Lịch sử", tabBarAccessibilityLabel: "Tab lịch sử" }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: "Tài khoản", tabBarAccessibilityLabel: "Tab tài khoản" }}
      />
    </Tabs>
  );
}
