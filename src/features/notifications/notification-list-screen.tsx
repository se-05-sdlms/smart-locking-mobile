import { PressableFeedback, Tabs, Typography } from "heroui-native";
import type { JSX } from "react";
import { useMemo, useState } from "react";
import { View } from "react-native";
import { GravityIcon } from "@/components/icons/gravity-icon";
import { ScreenHeader } from "@/components/ui/resident-ui";
import { ResidentFeed } from "@/components/ui/resident-feed";
import { useResidentFeed } from "@/features/navigation/use-resident-feed";
import { notificationApi } from "@/features/notifications/api";
import { openNotificationTarget } from "@/features/notifications/navigation";
import type { ResidentNotification } from "@/features/notifications/types";

type Filter = "all" | "incoming" | "outgoing" | "system";
const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "incoming", label: "Nhận" },
  { value: "outgoing", label: "Gửi" },
  { value: "system", label: "Hệ thống" },
];
export function NotificationListScreen(): JSX.Element {
  const feed = useResidentFeed(notificationApi.getPage);
  const [filter, setFilter] = useState<Filter>("all");
  const visible = useMemo(
    () => feed.items.filter((item) => filter === "all" || category(item.type) === filter),
    [feed.items, filter]
  );
  const open = async (item: ResidentNotification) => {
    if (!item.isRead) {
      feed.setItems((current) =>
        current.map((value) => (value.id === item.id ? { ...value, isRead: true } : value))
      );
      try {
        await notificationApi.markRead(item.id);
      } catch {
        feed.setItems((current) =>
          current.map((value) => (value.id === item.id ? { ...value, isRead: false } : value))
        );
      }
    }
    openNotificationTarget(item);
  };
  return (
    <ResidentFeed
      {...feed}
      items={visible}
      onRefresh={feed.refresh}
      onLoadMore={feed.loadMore}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <NotificationRow item={item} onPress={open} />}
      empty="Chưa có thông báo trong mục này."
      icon="bell"
      header={
        <>
          <ScreenHeader title="Thông báo" />
          <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
            <Tabs.List>
              <Tabs.ScrollView>
                <Tabs.Indicator />
                {filters.map((item) => (
                  <Tabs.Trigger key={item.value} value={item.value}>
                    <Tabs.Label>{item.label}</Tabs.Label>
                  </Tabs.Trigger>
                ))}
              </Tabs.ScrollView>
            </Tabs.List>
          </Tabs>
        </>
      }
    />
  );
}
function NotificationRow({
  item,
  onPress,
}: {
  item: ResidentNotification;
  onPress: (item: ResidentNotification) => Promise<void>;
}): JSX.Element {
  return (
    <PressableFeedback onPress={() => void onPress(item)} accessibilityRole="button">
      <View
        className={
          item.isRead
            ? "flex-row gap-3 rounded-2xl px-3 py-3"
            : "flex-row gap-3 rounded-2xl bg-accent/5 px-3 py-3"
        }
      >
        <View
          className={
            item.isRead
              ? "mt-2 h-2 w-2 rounded-full bg-default-300"
              : "mt-2 h-2 w-2 rounded-full bg-accent"
          }
        />
        <View className="flex-1 gap-1">
          <View className="flex-row items-start justify-between gap-3">
            <Typography.Heading className="flex-1 text-base">
              {item.title.replace("Tủ A02 báo sự cố", "Sự cố tại ngăn A02")}
            </Typography.Heading>
            <Typography.Paragraph className="text-xs text-muted">
              {new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(
                new Date(item.createdAt)
              )}
            </Typography.Paragraph>
          </View>
          <Typography.Paragraph className="text-sm text-muted" numberOfLines={2}>
            {item.message}
          </Typography.Paragraph>
        </View>
        <GravityIcon name="chevron-right" size={18} />
      </View>
    </PressableFeedback>
  );
}
function category(type: string): Exclude<Filter, "all"> {
  const value = type.toLowerCase();
  if (value.includes("return")) return "outgoing";
  if (value.includes("parcel") || value.includes("delivery") || value.includes("request"))
    return "incoming";
  return "system";
}
