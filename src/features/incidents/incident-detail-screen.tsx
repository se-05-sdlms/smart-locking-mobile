import { router, useLocalSearchParams } from "expo-router";
import { Button, Card, Skeleton, Typography } from "heroui-native";
import type { JSX } from "react";
import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GravityIcon } from "@/components/icons/gravity-icon";
import { StatusBadge } from "@/components/ui/status-badge";
import { incidentApi } from "@/features/incidents/api";
import { incidentStatusLabel, incidentStatusTone } from "@/features/incidents/labels";
import type { IncidentAction, IncidentDetail } from "@/features/incidents/types";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" });

export function IncidentDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [incident, setIncident] = useState<IncidentDetail>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async (refresh = false): Promise<void> => {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError("");
      try {
        setIncident(await incidentApi.getDetail(String(id)));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Không thể tải chi tiết sự cố.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  useEffect(() => {
    void incidentApi
      .getDetail(String(id))
      .then(setIncident)
      .catch((loadError: unknown) =>
        setError(loadError instanceof Error ? loadError.message : "Không thể tải chi tiết sự cố.")
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <DetailSkeleton />;
  if (!incident || error) return <DetailError message={error} retry={() => void load()} />;

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
          <View className="flex-1 gap-1">
            <Typography.Heading className="text-2xl">Chi tiết sự cố</Typography.Heading>
            <Typography.Paragraph className="text-muted">
              {incident.lockerCode}
            </Typography.Paragraph>
          </View>
          <StatusBadge
            label={incidentStatusLabel(incident.status)}
            tone={incidentStatusTone(incident.status)}
          />
        </View>

        <Card className="border border-accent">
          <Card.Header>
            <Card.Title>{incident.title}</Card.Title>
          </Card.Header>
          <Card.Body className="gap-3">
            <Typography.Paragraph>{incident.description}</Typography.Paragraph>
            <InfoLine label="Vị trí" value={`${incident.lockerCode} · ${incident.lockerAddress}`} />
            {incident.parcelCode ? <InfoLine label="Bưu kiện" value={incident.parcelCode} /> : null}
            {incident.lockerCompartmentCode ? (
              <InfoLine label="Ngăn tủ" value={incident.lockerCompartmentCode} />
            ) : null}
            <InfoLine label="Đã gửi" value={dateFormatter.format(new Date(incident.createdAt))} />
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Quá trình xử lý</Card.Title>
          </Card.Header>
          <Card.Body className="gap-4">
            <TimelineItem
              title="Hệ thống đã tiếp nhận"
              note="Báo cáo đã được chuyển đến bộ phận phụ trách."
              createdAt={incident.createdAt}
              isLast={!incident.actions.length}
            />
            {incident.actions.map((action, index) => (
              <TimelineAction
                key={action.id}
                action={action}
                isLast={index === incident.actions.length - 1}
              />
            ))}
          </Card.Body>
        </Card>

        {incident.resolutionSummary ? (
          <Card>
            <Card.Header>
              <Card.Title>Kết quả xử lý</Card.Title>
            </Card.Header>
            <Card.Body>
              <Typography.Paragraph>{incident.resolutionSummary}</Typography.Paragraph>
            </Card.Body>
          </Card>
        ) : null}
        <Typography.Paragraph className="text-center text-xs text-muted">
          Kéo xuống để tải cập nhật mới nhất.
        </Typography.Paragraph>
      </ScrollView>
    </SafeAreaView>
  );
}

function TimelineAction({
  action,
  isLast,
}: {
  action: IncidentAction;
  isLast: boolean;
}): JSX.Element {
  const title = action.toStatus !== null ? incidentStatusLabel(action.toStatus) : action.actionType;
  const byline = action.actionByName
    ? `Cập nhật bởi ${action.actionByName}`
    : "Cập nhật từ hệ thống";
  return (
    <TimelineItem
      title={title}
      note={action.notes ? `${action.notes}\n${byline}` : byline}
      createdAt={action.createdAt}
      isLast={isLast}
    />
  );
}

function TimelineItem({
  title,
  note,
  createdAt,
  isLast,
}: {
  title: string;
  note: string;
  createdAt: string;
  isLast: boolean;
}): JSX.Element {
  return (
    <View className="flex-row gap-3">
      <View className="items-center">
        <View className="h-3 w-3 rounded-full bg-accent" />
        {!isLast ? <View className="min-h-16 w-0.5 flex-1 bg-accent-soft" /> : null}
      </View>
      <View className="flex-1 gap-1 pb-2">
        <Typography.Paragraph className="font-medium">{title}</Typography.Paragraph>
        <Typography.Paragraph className="text-sm text-muted">{note}</Typography.Paragraph>
        <Typography.Paragraph className="text-xs text-muted">
          {dateFormatter.format(new Date(createdAt))}
        </Typography.Paragraph>
      </View>
    </View>
  );
}

function InfoLine({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <View className="gap-1">
      <Typography.Paragraph className="text-xs text-muted">{label}</Typography.Paragraph>
      <Typography.Paragraph>{value}</Typography.Paragraph>
    </View>
  );
}

function DetailSkeleton(): JSX.Element {
  return (
    <SafeAreaView className="flex-1 gap-4 bg-background px-5 py-6">
      {[0, 1, 2].map((item) => (
        <Skeleton key={item} className="h-36 w-full rounded-2xl" />
      ))}
    </SafeAreaView>
  );
}

function DetailError({ message, retry }: { message: string; retry: () => void }): JSX.Element {
  return (
    <SafeAreaView className="flex-1 bg-background px-5 py-6">
      <Card>
        <Card.Body className="gap-4">
          <Typography.Heading className="text-xl">Không thể mở sự cố</Typography.Heading>
          <Typography.Paragraph className="text-danger">{message}</Typography.Paragraph>
          <Button onPress={retry}>
            <Button.Label>Thử lại</Button.Label>
          </Button>
          <Button variant="secondary" onPress={() => router.back()}>
            <Button.Label>Quay lại</Button.Label>
          </Button>
        </Card.Body>
      </Card>
    </SafeAreaView>
  );
}
