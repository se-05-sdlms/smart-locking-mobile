import { router, useFocusEffect } from "expo-router";
import {
  Button,
  Card,
  ListGroup,
  PressableFeedback,
  Separator,
  Skeleton,
  Typography,
} from "heroui-native";
import { Fragment } from "react";
import type { JSX } from "react";
import { useCallback, useRef, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "@/components/ui/themed-safe-area-view";

import { BoxoraLogo } from "@/components/auth/boxora-logo";
import { GravityIcon } from "@/components/icons/gravity-icon";
import { ActionError } from "@/components/ui/action-error";
import { ListFeedback } from "@/components/ui/list-feedback";
import { StatusBadge } from "@/components/ui/status-badge";
import { deliveryRequestApi } from "@/features/delivery-requests/api";
import type { PendingDeliveryRequest } from "@/features/delivery-requests/types";
import { useMobileDataRevision } from "@/features/notifications/data-sync";
import { parcelApi } from "@/features/parcels/api";
import type { ParcelListItem } from "@/features/parcels/types";

export function ResidentHomeContent(): JSX.Element {
  const dataRevision = useMobileDataRevision();
  const [parcels, setParcels] = useState<ParcelListItem[]>([]);
  const [request, setRequest] = useState<PendingDeliveryRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const pending = useRef(false);
  const loaded = useRef(false);

  const load = useCallback(async (): Promise<void> => {
    if (pending.current) return;
    pending.current = true;
    setLoading(!loaded.current);
    setRefreshing(loaded.current);
    setError("");
    try {
      const [active, pendingRequests] = await Promise.all([
        parcelApi.getActive(),
        deliveryRequestApi.getPending(),
      ]);
      loaded.current = true;
      setParcels(active);
      setRequest(pendingRequests[0] ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Không thể tải dữ liệu.");
    } finally {
      pending.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const task = setTimeout(() => void load(), 0);
      return () => clearTimeout(task);
    }, [dataRevision, load])
  );

  const featured = parcels[0];
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load()} />}
        contentContainerClassName="gap-5 px-5 pb-6 pt-3"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row flex-wrap items-center justify-between gap-2">
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
          <View className="flex-row flex-wrap items-center justify-between gap-2">
            <Typography.Heading className="text-2xl">Đồ cần nhận</Typography.Heading>
            {parcels.length > 1 ? (
              <Typography.Paragraph className="text-sm text-muted">
                {parcels.length} bưu kiện
              </Typography.Paragraph>
            ) : null}
          </View>
          {loading ? <Skeleton className="h-64 w-full rounded-3xl" /> : null}
          {!loading && error ? (
            <ActionError message={error} busy={refreshing} onRetry={() => void load()} />
          ) : null}
          {!loading && featured ? <FeaturedParcel parcel={featured} /> : null}
          {!loading && !error && !featured ? (
            <ListFeedback
              loading={false}
              error=""
              emptyTitle="Bạn chưa có đồ cần nhận"
              empty="Bưu kiện mới sẽ xuất hiện tại đây."
              icon="package"
              onRetry={() => void load()}
            />
          ) : null}
          {!loading && parcels.length > 1 ? (
            <ListGroup variant="transparent">
              {parcels.slice(1, 3).map((parcel, index) => (
                <Fragment key={parcel.id}>
                  {index > 0 ? <Separator /> : null}
                  <CompactParcel parcel={parcel} />
                </Fragment>
              ))}
            </ListGroup>
          ) : null}
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
            <Button
              size="sm"
              variant="secondary"
              className="min-h-12"
              onPress={() => router.push("/send")}
            >
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
    <Card className="rounded-2xl border border-border shadow-none">
      <Card.Body className="gap-4">
        <View className="flex-row gap-3">
          <View className="h-20 w-20 items-center justify-center rounded-2xl bg-accent-soft">
            <GravityIcon name="package" size={38} tone="accent" />
          </View>
          <View className="min-w-0 flex-1 gap-2">
            <View className="min-w-0 gap-2">
              <Typography.Heading
                className="min-w-0 text-lg"
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {parcel.parcelCode}
              </Typography.Heading>
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
    <ListGroup.Item
      className="min-h-20 px-0 py-3"
      accessibilityRole="button"
      accessibilityLabel={`Xem bưu kiện ${parcel.parcelCode}, tủ ${parcel.lockerCode}, ngăn ${parcel.compartmentCode}`}
      onPress={() => router.push(`/parcels/${parcel.id}`)}
    >
      <ListGroup.ItemPrefix>
        <View className="rounded-xl bg-surface-secondary p-3">
          <GravityIcon name="package" />
        </View>
      </ListGroup.ItemPrefix>
      <ListGroup.ItemContent className="min-w-0 flex-1">
        <ListGroup.ItemTitle numberOfLines={1} ellipsizeMode="middle">
          {parcel.parcelCode}
        </ListGroup.ItemTitle>
        <ListGroup.ItemDescription>
          {parcel.lockerCode} · Ngăn {parcel.compartmentCode}
        </ListGroup.ItemDescription>
      </ListGroup.ItemContent>
      <ListGroup.ItemSuffix>
        <GravityIcon name="chevron-right" size={18} />
      </ListGroup.ItemSuffix>
    </ListGroup.Item>
  );
}

function remainingLabel(dueAt: string, now: number): string {
  const hours = Math.ceil((new Date(dueAt).getTime() - now) / 3_600_000);
  if (hours <= 0) return "Đã quá hạn";
  if (hours < 24) return `Còn ${hours} giờ`;
  return `Còn ${Math.ceil(hours / 24)} ngày`;
}
