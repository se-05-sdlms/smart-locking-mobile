import { router } from "expo-router";
import { Button, Card, PressableFeedback, Skeleton, Typography } from "heroui-native";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "@/components/ui/themed-safe-area-view";
import { GravityIcon } from "@/components/icons/gravity-icon";
import { ScreenHeader } from "@/components/ui/resident-ui";
import { StatusBadge } from "@/components/ui/status-badge";
import { incidentApi, type IncidentItem } from "@/features/incidents/api";

export default function IncidentListScreen(): JSX.Element {
  const [items, setItems] = useState<IncidentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    void incidentApi
      .getMine()
      .then(setItems)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Không thể tải sự cố."))
      .finally(() => setLoading(false));
  }, []);
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-4 px-5 pb-10 pt-4">
        <ScreenHeader
          title="Sự cố của tôi"
          action={
            <Button size="sm" onPress={() => router.push("/incidents/new")}>
              <Button.Label>Báo sự cố</Button.Label>
            </Button>
          }
        />
        {loading
          ? [0, 1, 2].map((value) => <Skeleton key={value} className="h-24 rounded-2xl" />)
          : null}
        {error ? (
          <Typography.Paragraph className="text-danger">{error}</Typography.Paragraph>
        ) : null}
        {!loading && !error && items.length === 0 ? (
          <Card>
            <Card.Body className="items-center gap-2 py-10">
              <GravityIcon name="alert-circle" size={32} />
              <Typography.Heading className="text-lg">Chưa có sự cố</Typography.Heading>
            </Card.Body>
          </Card>
        ) : null}
        {items.map((item) => (
          <IncidentRow key={item.id} item={item} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
function IncidentRow({ item }: { item: IncidentItem }): JSX.Element {
  const status = incidentStatus(item.status);
  return (
    <PressableFeedback
      onPress={() => router.push({ pathname: "/incidents/[id]", params: { id: item.id } })}
    >
      <View className="flex-row items-center gap-3 rounded-2xl border border-default-200 px-4 py-4">
        <View className="flex-1 gap-1">
          <View className="flex-row items-start justify-between gap-2">
            <Typography.Heading className="flex-1 text-base">{item.title}</Typography.Heading>
            <StatusBadge label={status.label} tone={status.tone} />
          </View>
          <Typography.Paragraph className="text-sm text-muted">
            {item.lockerCode} · {new Intl.DateTimeFormat("vi-VN").format(new Date(item.createdAt))}
          </Typography.Paragraph>
        </View>
        <GravityIcon name="chevron-right" size={18} />
      </View>
    </PressableFeedback>
  );
}
function incidentStatus(status: string): {
  label: string;
  tone: "warning" | "success" | "default";
} {
  const value = status.toLowerCase();
  if (value.includes("resolved")) return { label: "Đã giải quyết", tone: "success" };
  if (value.includes("closed")) return { label: "Đã đóng", tone: "default" };
  return { label: "Đang xử lý", tone: "warning" };
}
