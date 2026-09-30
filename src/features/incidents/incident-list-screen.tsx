import { router } from "expo-router";
import { Button, Card, PressableFeedback, Skeleton, Typography } from "heroui-native";
import type { JSX } from "react";
import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GravityIcon } from "@/components/icons/gravity-icon";
import { StatusBadge } from "@/components/ui/status-badge";
import { incidentApi } from "@/features/incidents/api";
import { incidentStatusLabel, incidentStatusTone } from "@/features/incidents/labels";
import type { IncidentListItem } from "@/features/incidents/types";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" });

export function IncidentListScreen(): JSX.Element {
  const [items, setItems] = useState<IncidentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (refresh = false): Promise<void> => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      setItems(await incidentApi.getMine());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Không thể tải sự cố.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void incidentApi
      .getMine()
      .then(setItems)
      .catch((loadError: unknown) =>
        setError(loadError instanceof Error ? loadError.message : "Không thể tải sự cố.")
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerClassName="gap-4 px-5 pb-8 pt-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />
        }
      >
        <View className="flex-row items-center gap-3">
          <Button
            isIconOnly
            variant="secondary"
            accessibilityLabel="Quay lại"
            onPress={() => router.back()}
          >
            <GravityIcon name="arrow-left" />
          </Button>
          <View className="flex-1">
            <Typography.Heading className="text-2xl">Sự cố của tôi</Typography.Heading>
            <Typography.Paragraph className="text-muted">
              Theo dõi phản hồi từ Operator
            </Typography.Paragraph>
          </View>
        </View>
        <Button onPress={() => router.push("/incidents/new")}>
          <Button.Label>Báo sự cố tại locker</Button.Label>
          <GravityIcon name="arrow-right" tone="accent-foreground" />
        </Button>

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
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} className="h-40 w-full rounded-2xl" />
            ))}
          </View>
        ) : null}
        {!loading && !error && !items.length ? (
          <Card>
            <Card.Body className="items-center gap-3 py-10">
              <GravityIcon name="check-circle" size={40} tone="success" />
              <Typography.Heading className="text-lg">Chưa có sự cố</Typography.Heading>
              <Typography.Paragraph className="text-center text-muted">
                Các báo cáo bạn gửi sẽ xuất hiện tại đây.
              </Typography.Paragraph>
            </Card.Body>
          </Card>
        ) : null}
        {!loading && !error
          ? items.map((item) => <IncidentCard key={item.id} item={item} />)
          : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function IncidentCard({ item }: { item: IncidentListItem }): JSX.Element {
  return (
    <PressableFeedback
      accessibilityRole="button"
      accessibilityLabel={`Mở sự cố ${item.title}`}
      onPress={() => router.push(`/incidents/${item.id}`)}
    >
      <Card>
        <Card.Header className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-1">
            <Typography.Paragraph className="text-xs text-muted">
              {item.parcelCode ? `Bưu kiện ${item.parcelCode}` : item.lockerCode}
            </Typography.Paragraph>
            <Card.Title>{item.title}</Card.Title>
          </View>
          <StatusBadge
            label={incidentStatusLabel(item.status)}
            tone={incidentStatusTone(item.status)}
          />
        </Card.Header>
        <Card.Body className="gap-3">
          <Typography.Paragraph className="text-sm text-muted">
            {item.lockerAddress}
          </Typography.Paragraph>
          <View className="flex-row items-center gap-2">
            <GravityIcon name="clock" size={16} />
            <Typography.Paragraph className="text-xs text-muted">
              Cập nhật {dateFormatter.format(new Date(item.updatedAt))}
            </Typography.Paragraph>
          </View>
        </Card.Body>
      </Card>
    </PressableFeedback>
  );
}
