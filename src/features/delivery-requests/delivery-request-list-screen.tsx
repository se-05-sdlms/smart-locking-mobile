import { router } from "expo-router";
import { Button, Card, ControlField, Skeleton, Switch, Typography } from "heroui-native";
import type { JSX } from "react";
import { useCallback, useEffect, useState } from "react";
import { Image, RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GravityIcon } from "@/components/icons/gravity-icon";
import { deliveryRequestApi } from "@/features/delivery-requests/api";
import { formatCountdown } from "@/features/delivery-requests/countdown";
import type {
  DeliveryApprovalMode,
  PendingDeliveryRequest,
} from "@/features/delivery-requests/types";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });

export function DeliveryRequestListScreen(): JSX.Element {
  const [items, setItems] = useState<PendingDeliveryRequest[]>([]);
  const [mode, setMode] = useState<DeliveryApprovalMode>(0);
  const [now, setNow] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingMode, setSavingMode] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (refresh = false): Promise<void> => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const [requests, profile] = await Promise.all([
        deliveryRequestApi.getPending(),
        deliveryRequestApi.getProfile(),
      ]);
      setItems(requests);
      setMode(profile.deliveryApprovalMode);
      setNow(Date.now());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Không thể tải yêu cầu.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void Promise.all([deliveryRequestApi.getPending(), deliveryRequestApi.getProfile()])
      .then(([requests, profile]) => {
        setItems(requests);
        setMode(profile.deliveryApprovalMode);
        setNow(Date.now());
      })
      .catch((loadError: unknown) =>
        setError(loadError instanceof Error ? loadError.message : "Không thể tải yêu cầu.")
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function changeMode(isManual: boolean): Promise<void> {
    const nextMode: DeliveryApprovalMode = isManual ? 1 : 0;
    const previous = mode;
    setMode(nextMode);
    setSavingMode(true);
    setError("");
    try {
      const profile = await deliveryRequestApi.updateApprovalMode(nextMode);
      setMode(profile.deliveryApprovalMode);
    } catch (updateError) {
      setMode(previous);
      setError(updateError instanceof Error ? updateError.message : "Không thể đổi chế độ duyệt.");
    } finally {
      setSavingMode(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerClassName="gap-4 px-5 pb-8 pt-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />
        }
      >
        <View className="gap-1">
          <Typography.Heading className="text-3xl">Yêu cầu giao hàng</Typography.Heading>
          <Typography.Paragraph className="text-muted">
            Kiểm tra ảnh kiện hàng trước khi cho phép shipper sử dụng tủ.
          </Typography.Paragraph>
        </View>

        <Card>
          <Card.Body>
            <ControlField
              isSelected={mode === 1}
              isDisabled={loading || savingMode}
              onSelectedChange={(selected) => void changeMode(selected)}
            >
              <View className="flex-1 gap-1">
                <Typography.Heading className="text-base">Phê duyệt thủ công</Typography.Heading>
                <Typography.Paragraph className="text-sm text-muted">
                  {mode === 1 ? "Bạn duyệt từng yêu cầu" : "Hệ thống tự động phê duyệt"}
                </Typography.Paragraph>
              </View>
              <ControlField.Indicator>
                <Switch />
              </ControlField.Indicator>
            </ControlField>
          </Card.Body>
        </Card>

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

        {loading
          ? [0, 1].map((value) => <Skeleton key={value} className="h-52 rounded-2xl" />)
          : null}

        {!loading && !error && items.length === 0 ? (
          <Card>
            <Card.Body className="items-center gap-3 py-10">
              <GravityIcon name="package" size={40} />
              <Typography.Heading className="text-lg">
                Không có yêu cầu chờ duyệt
              </Typography.Heading>
              <Typography.Paragraph className="text-center text-muted">
                Yêu cầu mới từ shipper sẽ xuất hiện tại đây.
              </Typography.Paragraph>
            </Card.Body>
          </Card>
        ) : null}

        {!loading && !error
          ? items.map((item) => <RequestCard key={item.requestId} item={item} now={now} />)
          : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function RequestCard({ item, now }: { item: PendingDeliveryRequest; now: number }): JSX.Element {
  return (
    <Card>
      {item.parcelImageUrl ? (
        <Image
          source={{ uri: item.parcelImageUrl }}
          className="h-40 w-full rounded-t-2xl bg-default"
          resizeMode="cover"
          accessibilityLabel="Ảnh bưu kiện do shipper cung cấp"
        />
      ) : null}
      <Card.Header className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Card.Title>Locker {item.lockerCode}</Card.Title>
          <Typography.Paragraph className="text-sm text-muted">
            {item.lockerAddress}
          </Typography.Paragraph>
        </View>
        <View className="items-end">
          <Typography.Paragraph className="text-xs text-muted">Còn lại</Typography.Paragraph>
          <Typography.Heading className="text-lg text-warning">
            {formatCountdown(item.approvalExpiresAt, now)}
          </Typography.Heading>
        </View>
      </Card.Header>
      <Card.Body className="gap-3">
        <Typography.Paragraph className="text-sm text-muted">
          Gửi lúc {dateFormatter.format(new Date(item.createdAt))}
        </Typography.Paragraph>
        <Button onPress={() => router.push(`/delivery-requests/${item.requestId}`)}>
          <Button.Label>Xem và xử lý</Button.Label>
        </Button>
      </Card.Body>
    </Card>
  );
}
