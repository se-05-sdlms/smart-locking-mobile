import { Button, Card, Chip, PressableFeedback, Skeleton, Typography } from "heroui-native";
import type { JSX } from "react";
import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GravityIcon, type GravityIconName } from "@/components/icons/gravity-icon";
import { notificationApi } from "@/features/notifications/api";
import { openNotificationTarget } from "@/features/notifications/navigation";
import type { ResidentNotification } from "@/features/notifications/types";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
});

type Category = { label: string; icon: GravityIconName };

function getCategory(type: string): Category {
  const normalized = type.toLowerCase();
  if (normalized.includes("payment") || normalized.includes("fee")) {
    return { label: "Thanh toán", icon: "credit-card" };
  }
  if (normalized.includes("incident")) return { label: "Sự cố", icon: "alert-circle" };
  if (normalized.includes("delivery") || normalized.includes("request")) {
    return { label: "Giao hàng", icon: "envelope" };
  }
  return { label: "Bưu kiện", icon: "package" };
}

export function NotificationListScreen(): JSX.Element {
  const [items, setItems] = useState<ResidentNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (refresh = false): Promise<void> => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      setItems(await notificationApi.getAll());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Không thể tải thông báo.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void notificationApi
      .getAll()
      .then(setItems)
      .catch((loadError: unknown) =>
        setError(loadError instanceof Error ? loadError.message : "Không thể tải thông báo.")
      )
      .finally(() => setLoading(false));
  }, []);

  async function open(item: ResidentNotification): Promise<void> {
    if (!item.isRead) {
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? { ...entry, isRead: true, readAt: new Date().toISOString() }
            : entry
        )
      );
      try {
        await notificationApi.markRead(item.id);
      } catch {
        void load(true);
      }
    }
    openNotificationTarget(item);
  }

  async function markAllRead(): Promise<void> {
    setMarkingAll(true);
    setError("");
    try {
      await notificationApi.markAllRead();
      const readAt = new Date().toISOString();
      setItems((current) => current.map((item) => ({ ...item, isRead: true, readAt })));
    } catch (markError) {
      setError(markError instanceof Error ? markError.message : "Không thể đánh dấu đã đọc.");
    } finally {
      setMarkingAll(false);
    }
  }

  const unreadCount = items.filter((item) => !item.isRead).length;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerClassName="gap-4 px-5 pb-8 pt-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />
        }
      >
        <View className="flex-row items-center justify-between gap-4">
          <View className="flex-1 gap-1">
            <Typography.Heading className="text-3xl">Thông báo</Typography.Heading>
            <Typography.Paragraph className="text-muted">
              {unreadCount ? `${unreadCount} thông báo chưa đọc` : "Bạn đã xem tất cả thông báo"}
            </Typography.Paragraph>
          </View>
          {unreadCount ? (
            <Button
              size="sm"
              variant="tertiary"
              isDisabled={markingAll}
              onPress={() => void markAllRead()}
            >
              <Button.Label>{markingAll ? "Đang xử lý" : "Đọc tất cả"}</Button.Label>
            </Button>
          ) : null}
        </View>

        {error ? (
          <Card>
            <Card.Body className="gap-3">
              <Typography.Paragraph className="text-danger">{error}</Typography.Paragraph>
              <Button size="sm" variant="secondary" onPress={() => void load()}>
                <Button.Label>Thử lại</Button.Label>
              </Button>
            </Card.Body>
          </Card>
        ) : null}

        {loading ? (
          <View className="gap-3">
            {[0, 1, 2].map((value) => (
              <Skeleton key={value} className="h-36 w-full rounded-2xl" />
            ))}
          </View>
        ) : null}

        {!loading && !error && items.length === 0 ? (
          <Card>
            <Card.Body className="items-center gap-3 py-10">
              <GravityIcon name="bell" size={40} />
              <Typography.Heading className="text-lg">Chưa có thông báo</Typography.Heading>
              <Typography.Paragraph className="text-center text-muted">
                Cập nhật về bưu kiện và giao hàng sẽ xuất hiện tại đây.
              </Typography.Paragraph>
            </Card.Body>
          </Card>
        ) : null}

        {!loading && !error
          ? items.map((item) => <NotificationCard key={item.id} item={item} onPress={open} />)
          : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function NotificationCard({
  item,
  onPress,
}: {
  item: ResidentNotification;
  onPress: (item: ResidentNotification) => Promise<void>;
}): JSX.Element {
  const category = getCategory(item.type);
  return (
    <PressableFeedback
      accessibilityRole="button"
      accessibilityLabel={`${item.isRead ? "Đã đọc" : "Chưa đọc"}: ${item.title}`}
      onPress={() => void onPress(item)}
    >
      <Card className={item.isRead ? "opacity-75" : "border border-accent"}>
        <Card.Header className="flex-row items-start gap-3">
          <View className="rounded-full bg-accent-soft p-2.5">
            <GravityIcon name={category.icon} tone="accent" />
          </View>
          <View className="flex-1 gap-2">
            <View className="flex-row items-center justify-between gap-2">
              <Chip size="sm" variant="soft" color="accent">
                {category.label}
              </Chip>
              {!item.isRead ? <View className="h-2.5 w-2.5 rounded-full bg-accent" /> : null}
            </View>
            <Card.Title>{item.title}</Card.Title>
          </View>
        </Card.Header>
        <Card.Body className="gap-2 pl-[60px]">
          <Typography.Paragraph>{item.message}</Typography.Paragraph>
          <Typography.Paragraph className="text-xs text-muted">
            {dateFormatter.format(new Date(item.createdAt))}
          </Typography.Paragraph>
        </Card.Body>
      </Card>
    </PressableFeedback>
  );
}
