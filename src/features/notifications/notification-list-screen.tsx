import { Button, Card, PressableFeedback, Skeleton, Tabs, Typography } from "heroui-native";
import type { JSX } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "@/components/ui/themed-safe-area-view";

import { GravityIcon } from "@/components/icons/gravity-icon";
import { ScreenHeader } from "@/components/ui/resident-ui";
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
  const [items, setItems] = useState<ResidentNotification[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      setItems(await notificationApi.getAll());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tải thông báo.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  useEffect(() => {
    const task = setTimeout(() => void load(), 0);
    return () => clearTimeout(task);
  }, [load]);
  const visible = useMemo(
    () => items.filter((item) => filter === "all" || category(item.type) === filter),
    [filter, items]
  );
  const open = async (item: ResidentNotification) => {
    if (!item.isRead) {
      setItems((current) =>
        current.map((value) => (value.id === item.id ? { ...value, isRead: true } : value))
      );
      try {
        await notificationApi.markRead(item.id);
      } catch {
        /* optimistic read state is enough */
      }
    }
    openNotificationTarget(item);
  };
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentContainerClassName="gap-4 px-5 pb-8 pt-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />
        }
      >
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
        {error ? (
          <Card>
            <Card.Body className="gap-3">
              <Typography.Paragraph className="text-danger">{error}</Typography.Paragraph>
              <Button variant="secondary" onPress={() => void load()}>
                <Button.Label>Thử lại</Button.Label>
              </Button>
            </Card.Body>
          </Card>
        ) : null}
        {loading
          ? [0, 1, 2].map((value) => <Skeleton key={value} className="h-24 rounded-2xl" />)
          : null}
        {!loading && !error && visible.length === 0 ? (
          <Card>
            <Card.Body className="items-center gap-2 py-10">
              <GravityIcon name="bell" size={32} />
              <Typography.Heading className="text-lg">Chưa có thông báo</Typography.Heading>
            </Card.Body>
          </Card>
        ) : null}
        {!loading && !error
          ? visible.map((item) => <NotificationRow key={item.id} item={item} onPress={open} />)
          : null}
      </ScrollView>
    </SafeAreaView>
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
