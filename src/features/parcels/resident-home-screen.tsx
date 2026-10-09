import { router } from "expo-router";
import { Button, Card, PressableFeedback, Skeleton, Typography } from "heroui-native";
import type { JSX } from "react";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "@/components/ui/themed-safe-area-view";

import { BoxoraLogo } from "@/components/auth/boxora-logo";
import { GravityIcon } from "@/components/icons/gravity-icon";
import { StatusBadge } from "@/components/ui/status-badge";
import { deliveryRequestApi } from "@/features/delivery-requests/api";
import type { PendingDeliveryRequest } from "@/features/delivery-requests/types";
import { parcelApi } from "@/features/parcels/api";
import type { ParcelListItem } from "@/features/parcels/types";

export function ResidentHomeContent(): JSX.Element {
  const [parcels, setParcels] = useState<ParcelListItem[]>([]);
  const [request, setRequest] = useState<PendingDeliveryRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError("");
    try {
      const [active, pending] = await Promise.all([
        parcelApi.getActive(),
        deliveryRequestApi.getPending().catch(() => []),
      ]);
      setParcels(active);
      setRequest(pending[0] ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const task = setTimeout(() => void load(), 0);
    return () => clearTimeout(task);
  }, [load]);

  const featured = parcels[0];
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerClassName="gap-5 px-5 pb-6 pt-3"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between">
          <BoxoraLogo compact />
          <Button
            isIconOnly
            variant="ghost"
            accessibilityLabel="Mở thông báo"
            onPress={() => router.push("/notifications")}
          >
            <GravityIcon name="bell" size={24} />
            {request ? (
              <View className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-background bg-danger" />
            ) : null}
          </Button>
        </View>

        {request ? (
          <PressableFeedback
            onPress={() => router.push(`/delivery-requests/${request.requestId}`)}
            accessibilityRole="button"
          >
            <Card className="border border-danger/20 bg-danger/5">
              <Card.Body className="flex-row items-center gap-3 py-3">
                <View className="rounded-full bg-danger/10 p-2">
                  <GravityIcon name="clock" tone="danger" />
                </View>
                <View className="flex-1 gap-0.5">
                  <Typography.Heading className="text-base">
                    Có bưu kiện chờ xác nhận
                  </Typography.Heading>
                  <Typography.Paragraph className="text-sm text-danger">
                    Sắp hết thời gian phản hồi
                  </Typography.Paragraph>
                </View>
                <GravityIcon name="chevron-right" />
              </Card.Body>
            </Card>
          </PressableFeedback>
        ) : null}

        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Typography.Heading className="text-2xl">Đồ cần nhận</Typography.Heading>
            {parcels.length > 1 ? (
              <Typography.Paragraph className="text-sm text-muted">
                {parcels.length} bưu kiện
              </Typography.Paragraph>
            ) : null}
          </View>
          {loading ? <Skeleton className="h-64 w-full rounded-3xl" /> : null}
          {!loading && error ? <ErrorCard message={error} onRetry={load} /> : null}
          {!loading && !error && featured ? <FeaturedParcel parcel={featured} /> : null}
          {!loading && !error && !featured ? (
            <Card>
              <Card.Body className="items-center gap-3 py-8">
                <View className="rounded-full bg-accent-soft p-4">
                  <GravityIcon name="package" size={30} tone="accent" />
                </View>
                <Typography.Heading className="text-lg">Bạn chưa có đồ cần nhận</Typography.Heading>
                <Typography.Paragraph className="text-center text-muted">
                  Bưu kiện mới sẽ xuất hiện tại đây.
                </Typography.Paragraph>
              </Card.Body>
            </Card>
          ) : null}
          {!loading &&
            !error &&
            parcels.slice(1, 3).map((parcel) => <CompactParcel key={parcel.id} parcel={parcel} />)}
        </View>

        <Card className="border border-accent/20 bg-accent/5">
          <Card.Body className="flex-row items-center gap-3 py-4">
            <View className="rounded-2xl bg-accent-soft p-3">
              <GravityIcon name="send" tone="accent" />
            </View>
            <View className="flex-1">
              <Typography.Heading className="text-base">Bạn muốn gửi đồ?</Typography.Heading>
              <Typography.Paragraph className="text-sm text-muted">
                Đặt đồ vào tủ để người khác đến lấy.
              </Typography.Paragraph>
            </View>
            <Button size="sm" onPress={() => router.push("/send")}>
              <Button.Label>Gửi đồ</Button.Label>
            </Button>
          </Card.Body>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeaturedParcel({ parcel }: { parcel: ParcelListItem }): JSX.Element {
  const [renderedAt] = useState(Date.now);
  const overdue =
    parcel.status === "Overdue" || new Date(parcel.pickupDueAt).getTime() < renderedAt;
  return (
    <Card className="border border-default-200">
      <Card.Body className="gap-4">
        <View className="flex-row gap-3">
          <View className="h-20 w-20 items-center justify-center rounded-2xl bg-accent-soft">
            <GravityIcon name="package" size={38} tone="accent" />
          </View>
          <View className="flex-1 gap-1">
            <View className="flex-row items-start justify-between gap-2">
              <Typography.Heading className="text-lg">{parcel.parcelCode}</Typography.Heading>
              <StatusBadge
                label={overdue ? "Quá hạn" : "Sẵn sàng nhận"}
                tone={overdue ? "danger" : "success"}
              />
            </View>
            <Typography.Paragraph className="text-sm">
              {parcel.lockerCode} · Ngăn {parcel.compartmentCode}
            </Typography.Paragraph>
            <Typography.Paragraph
              className={overdue ? "text-sm text-danger" : "text-sm text-muted"}
            >
              {remainingLabel(parcel.pickupDueAt, renderedAt)}
            </Typography.Paragraph>
          </View>
        </View>
        <Button onPress={() => router.push(`/parcels/${parcel.id}`)}>
          <Button.Label>Nhận hàng</Button.Label>
        </Button>
      </Card.Body>
    </Card>
  );
}

function CompactParcel({ parcel }: { parcel: ParcelListItem }): JSX.Element {
  return (
    <PressableFeedback onPress={() => router.push(`/parcels/${parcel.id}`)}>
      <Card>
        <Card.Body className="flex-row items-center gap-3 py-3">
          <View className="rounded-xl bg-default p-2">
            <GravityIcon name="package" />
          </View>
          <View className="flex-1">
            <Typography.Heading className="text-base">{parcel.parcelCode}</Typography.Heading>
            <Typography.Paragraph className="text-sm text-muted">
              {parcel.lockerCode} · Ngăn {parcel.compartmentCode}
            </Typography.Paragraph>
          </View>
          <GravityIcon name="chevron-right" />
        </Card.Body>
      </Card>
    </PressableFeedback>
  );
}

function ErrorCard({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => Promise<void>;
}): JSX.Element {
  return (
    <Card>
      <Card.Body className="gap-3">
        <Typography.Paragraph className="text-danger">{message}</Typography.Paragraph>
        <Button variant="secondary" onPress={() => void onRetry()}>
          <Button.Label>Thử lại</Button.Label>
        </Button>
      </Card.Body>
    </Card>
  );
}

function remainingLabel(dueAt: string, now: number): string {
  const hours = Math.ceil((new Date(dueAt).getTime() - now) / 3_600_000);
  if (hours <= 0) return "Đã quá hạn";
  if (hours < 24) return `Còn ${hours} giờ`;
  return `Còn ${Math.ceil(hours / 24)} ngày`;
}
