import { router } from "expo-router";
import { Button, PressableFeedback, Tabs, Typography } from "heroui-native";
import type { JSX } from "react";
import { useMemo, useState } from "react";
import { View } from "react-native";
import { GravityIcon } from "@/components/icons/gravity-icon";
import { ParcelImage } from "@/components/ui/parcel-image";
import { ResidentFeed } from "@/components/ui/resident-feed";
import { StatusBadge } from "@/components/ui/status-badge";
import { useResidentFeed } from "@/features/navigation/use-resident-feed";
import { returnApi } from "@/features/returns/api";
import type { ReturnRequestItem } from "@/features/returns/types";

type Filter = "waiting" | "picked" | "cancelled";
export function ReturnListContent(): JSX.Element {
  const feed = useResidentFeed(returnApi.getPage);
  const [filter, setFilter] = useState<Filter>("waiting");
  const visible = useMemo(
    () =>
      feed.items.filter((item) =>
        filter === "waiting"
          ? item.status <= 2
          : filter === "picked"
            ? item.status === 3
            : item.status >= 4
      ),
    [feed.items, filter]
  );
  return (
    <ResidentFeed
      tab
      {...feed}
      items={visible}
      onRefresh={feed.refresh}
      onLoadMore={feed.loadMore}
      onRetryMore={feed.retryMore}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ReturnRow item={item} />}
      emptyTitle="Chưa có đồ trong mục này"
      empty="Đồ gửi phù hợp sẽ xuất hiện tại đây."
      icon="send"
      header={
        <>
          <View className="flex-row flex-wrap items-center justify-between gap-3">
            <Typography.Heading className="text-3xl">Gửi đồ</Typography.Heading>
            <Button size="sm" onPress={() => router.push("/returns/new")}>
              <Button.Label>Gửi đồ mới</Button.Label>
            </Button>
          </View>
          <Typography.Paragraph className="text-muted">
            Theo dõi đồ đã gửi và trạng thái nhận.
          </Typography.Paragraph>
          <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
            <Tabs.List>
              <Tabs.Indicator />
              <Tabs.Trigger value="waiting">
                <Tabs.Label>Chờ lấy</Tabs.Label>
              </Tabs.Trigger>
              <Tabs.Trigger value="picked">
                <Tabs.Label>Đã lấy</Tabs.Label>
              </Tabs.Trigger>
              <Tabs.Trigger value="cancelled">
                <Tabs.Label>Đã hủy</Tabs.Label>
              </Tabs.Trigger>
            </Tabs.List>
          </Tabs>
        </>
      }
    />
  );
}
function ReturnRow({ item }: { item: ReturnRequestItem }): JSX.Element {
  const state = returnState(item);
  return (
    <PressableFeedback
      accessibilityRole="button"
      accessibilityLabel={`Xem đồ gửi ${item.pickupCode || item.lockerCode}`}
      onPress={() => router.push({ pathname: "/returns/[id]", params: { id: item.id } })}
    >
      <View className="border-b border-separator">
        <View className="flex-row items-center gap-3 py-4">
          <ParcelImage
            uri={item.imageUrl}
            recyclingKey={item.id}
            style={{ width: 56, height: 56, borderRadius: 12 }}
          />
          <View className="min-w-0 flex-1 gap-1">
            <View className="gap-1">
              <Typography.Heading className="text-base">
                {item.pickupCode || "Đồ gửi"}
              </Typography.Heading>
              <StatusBadge label={state.label} tone={state.tone} />
            </View>
            <Typography.Paragraph className="text-sm text-muted">
              {item.lockerCode}
              {item.compartmentCode ? ` · Ngăn ${item.compartmentCode}` : ""}
            </Typography.Paragraph>
            <Typography.Paragraph className="text-xs text-muted">
              {new Intl.DateTimeFormat("vi-VN").format(new Date(item.createdAt))}
            </Typography.Paragraph>
          </View>
          <GravityIcon name="chevron-right" size={18} />
        </View>
      </View>
    </PressableFeedback>
  );
}
function returnState(item: ReturnRequestItem): {
  label: string;
  tone: "warning" | "success" | "danger" | "default";
} {
  if (item.cancellation?.status === "PendingVerification")
    return { label: "Chờ xác minh hủy", tone: "warning" };
  if (item.status === 3) return { label: "Đã lấy", tone: "success" };
  if (item.status >= 4) return { label: "Đã hủy", tone: "default" };
  if (item.status === 2) return { label: "Chờ lấy", tone: "warning" };
  return { label: "Đang gửi", tone: "default" };
}
