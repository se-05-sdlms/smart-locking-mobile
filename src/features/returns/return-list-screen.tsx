import { router } from "expo-router";
import { Button, Card, PressableFeedback, Skeleton, Tabs, Typography } from "heroui-native";
import type { JSX } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Image, RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GravityIcon } from "@/components/icons/gravity-icon";
import { StatusBadge } from "@/components/ui/status-badge";
import { returnApi } from "@/features/returns/api";
import type { ReturnRequestItem } from "@/features/returns/types";

type Filter = "waiting" | "picked" | "cancelled";
export function ReturnListContent(): JSX.Element {
  const [items, setItems] = useState<ReturnRequestItem[]>([]);
  const [filter, setFilter] = useState<Filter>("waiting");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setError("");
    try {
      setItems(await returnApi.getMine());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tải đồ gửi.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const task = setTimeout(() => void load(), 0);
    return () => clearTimeout(task);
  }, [load]);
  const visible = useMemo(
    () =>
      items.filter((item) =>
        filter === "waiting"
          ? item.status <= 2
          : filter === "picked"
            ? item.status === 3
            : item.status >= 4
      ),
    [filter, items]
  );
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerClassName="gap-4 px-5 pb-6 pt-4"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
      >
        <View className="flex-row items-center justify-between">
          <Typography.Heading className="text-3xl">Gửi đồ</Typography.Heading>
          <Button size="sm" onPress={() => router.push("/returns/new")}>
            <Button.Label>Gửi đồ</Button.Label>
          </Button>
        </View>
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
        {loading
          ? [0, 1, 2].map((value) => <Skeleton key={value} className="h-24 rounded-2xl" />)
          : null}
        {error ? (
          <Typography.Paragraph className="text-danger">{error}</Typography.Paragraph>
        ) : null}
        {!loading && !error && visible.length === 0 ? (
          <Card>
            <Card.Body className="items-center gap-3 py-10">
              <View className="rounded-full bg-accent-soft p-4">
                <GravityIcon name="send" size={30} tone="accent" />
              </View>
              <Typography.Heading className="text-lg">Chưa có đồ trong mục này</Typography.Heading>
              <Button variant="secondary" onPress={() => router.push("/returns/new")}>
                <Button.Label>Gửi đồ</Button.Label>
              </Button>
            </Card.Body>
          </Card>
        ) : null}
        {visible.map((item) => (
          <ReturnRow key={item.id} item={item} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
function ReturnRow({ item }: { item: ReturnRequestItem }): JSX.Element {
  const state = returnState(item);
  return (
    <PressableFeedback
      onPress={() => router.push({ pathname: "/returns/[id]", params: { id: item.id } })}
    >
      <Card>
        <Card.Body className="flex-row items-center gap-3 py-3">
          <Image source={{ uri: item.imageUrl }} className="h-16 w-16 rounded-xl bg-default" />
          <View className="flex-1 gap-1">
            <View className="flex-row items-center justify-between gap-2">
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
        </Card.Body>
      </Card>
    </PressableFeedback>
  );
}
function returnState(item: ReturnRequestItem): {
  label: string;
  tone: "warning" | "success" | "danger" | "default";
} {
  if (item.status === 3) return { label: "Đã lấy", tone: "success" };
  if (item.status >= 4) return { label: "Đã hủy", tone: "default" };
  if (item.status === 2) return { label: "Chờ lấy", tone: "warning" };
  return { label: "Đang gửi", tone: "default" };
}
