import { router } from "expo-router";
import { Button, PressableFeedback, Typography } from "heroui-native";
import type { JSX } from "react";
import { View } from "react-native";
import { GravityIcon } from "@/components/icons/gravity-icon";
import { ScreenHeader } from "@/components/ui/resident-ui";
import { ResidentFeed } from "@/components/ui/resident-feed";
import { StatusBadge } from "@/components/ui/status-badge";
import { useResidentFeed } from "@/features/navigation/use-resident-feed";
import { incidentApi, type IncidentItem, type IncidentStatus } from "@/features/incidents/api";
export default function IncidentListScreen(): JSX.Element {
  const feed = useResidentFeed(incidentApi.getPage);
  return (
    <ResidentFeed
      {...feed}
      onRefresh={feed.refresh}
      onLoadMore={feed.loadMore}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <IncidentRow item={item} />}
      empty="Bạn chưa báo cáo sự cố nào."
      icon="alert-circle"
      header={
        <ScreenHeader
          title="Sự cố của tôi"
          action={
            <Button size="sm" onPress={() => router.push("/incidents/new")}>
              <Button.Label>Báo sự cố</Button.Label>
            </Button>
          }
        />
      }
    />
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
          <View className="gap-2">
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
function incidentStatus(status: IncidentStatus): {
  label: string;
  tone: "warning" | "success" | "default";
} {
  if (status === 2) return { label: "Đã giải quyết", tone: "success" };
  if (status === 3) return { label: "Đã chuyển cấp", tone: "default" };
  return { label: status === 0 ? "Mới tạo" : "Đang xử lý", tone: "warning" };
}
