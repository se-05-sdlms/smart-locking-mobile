import { useLocalSearchParams } from "expo-router";
import { Card, Skeleton, Typography } from "heroui-native";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import { Image, ScrollView, View } from "react-native";
import { SafeAreaView } from "@/components/ui/themed-safe-area-view";
import { GravityIcon } from "@/components/icons/gravity-icon";
import { ScreenHeader } from "@/components/ui/resident-ui";
import { StatusBadge } from "@/components/ui/status-badge";
import { incidentApi, type IncidentDetail, type IncidentStatus } from "@/features/incidents/api";

export default function IncidentDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<IncidentDetail | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (id)
      void incidentApi
        .get(id)
        .then(setItem)
        .catch((e: unknown) => setError(e instanceof Error ? e.message : "Không thể tải sự cố."));
  }, [id]);
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-5 px-5 pb-10 pt-4">
        <ScreenHeader title="Chi tiết sự cố" />
        {!item && !error ? <Skeleton className="h-96 rounded-3xl" /> : null}
        {item ? (
          <>
            <View className="flex-row items-center justify-between">
              <Typography.Heading className="text-xl">{item.title}</Typography.Heading>
              <StatusBadge
                label={statusLabel(item.status)}
                tone={item.resolutionSummary ? "success" : "warning"}
              />
            </View>
            <Card>
              <Card.Body className="gap-3">
                <Meta
                  label="Ngày gửi"
                  value={new Intl.DateTimeFormat("vi-VN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(item.createdAt))}
                />
                <Meta label="Loại sự cố" value={item.type} />
                <Typography.Paragraph>{item.description}</Typography.Paragraph>
                {item.evidenceUrl ? (
                  <Image source={{ uri: item.evidenceUrl }} className="h-48 w-full rounded-2xl" />
                ) : null}
              </Card.Body>
            </Card>
            <View className="gap-3">
              <Typography.Heading className="text-lg">Lịch sử xử lý</Typography.Heading>
              <Timeline
                icon="check"
                title="Đã tiếp nhận yêu cầu"
                detail={new Intl.DateTimeFormat("vi-VN", {
                  dateStyle: "short",
                  timeStyle: "short",
                }).format(new Date(item.createdAt))}
                active
              />
              <Timeline
                icon="clock"
                title={item.resolutionSummary ? "Đã xử lý" : "Đang kiểm tra"}
                detail={item.resolutionSummary ?? "Boxora đang kiểm tra sự cố."}
                active={Boolean(item.resolutionSummary)}
              />
            </View>
          </>
        ) : null}
        {error ? (
          <Typography.Paragraph className="text-danger">{error}</Typography.Paragraph>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
function Meta({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <View className="flex-row justify-between gap-4">
      <Typography.Paragraph className="text-muted">{label}</Typography.Paragraph>
      <Typography.Paragraph className="flex-1 text-right">{value}</Typography.Paragraph>
    </View>
  );
}
function Timeline({
  icon,
  title,
  detail,
  active,
}: {
  icon: "check" | "clock";
  title: string;
  detail: string;
  active: boolean;
}): JSX.Element {
  return (
    <View className="flex-row gap-3">
      <View
        className={
          active
            ? "h-8 w-8 items-center justify-center rounded-full bg-success"
            : "h-8 w-8 items-center justify-center rounded-full bg-default"
        }
      >
        <GravityIcon name={icon} size={17} tone={active ? "success-foreground" : "muted"} />
      </View>
      <View className="flex-1">
        <Typography.Heading className="text-base">{title}</Typography.Heading>
        <Typography.Paragraph className="text-sm text-muted">{detail}</Typography.Paragraph>
      </View>
    </View>
  );
}
function statusLabel(status: IncidentStatus): string {
  return ["Mới tạo", "Đang xử lý", "Đã giải quyết", "Đã chuyển cấp"][status];
}
