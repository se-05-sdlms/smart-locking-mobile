import { router, useFocusEffect } from "expo-router";
import { Button, Card, ControlField, Switch, Typography } from "heroui-native";
import type { JSX } from "react";
import { useCallback, useEffect, useState } from "react";
import { AppState, View } from "react-native";
import { ParcelImage } from "@/components/ui/parcel-image";
import { ScreenHeader } from "@/components/ui/resident-ui";
import { ResidentFeed } from "@/components/ui/resident-feed";
import { useResidentFeed } from "@/features/navigation/use-resident-feed";
import { deliveryRequestApi } from "@/features/delivery-requests/api";
import { formatCountdown } from "@/features/delivery-requests/countdown";
import type {
  DeliveryApprovalMode,
  PendingDeliveryRequest,
} from "@/features/delivery-requests/types";
const dateFormatter = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });
export function DeliveryRequestListScreen(): JSX.Element {
  const feed = useResidentFeed(deliveryRequestApi.getPendingPage);
  const refresh = feed.refresh;
  useFocusEffect(
    useCallback(() => {
      const timer = setInterval(() => {
        if (AppState.currentState === "active") refresh();
      }, 10000);
      return () => clearInterval(timer);
    }, [refresh])
  );
  const [mode, setMode] = useState<DeliveryApprovalMode | null>(null);
  const [now, setNow] = useState(Date.now);
  const [savingMode, setSavingMode] = useState(false);
  const [modeError, setModeError] = useState("");
  const loadMode = useCallback(async () => {
    setModeError("");
    try {
      setMode((await deliveryRequestApi.getProfile()).deliveryApprovalMode);
    } catch (error) {
      setModeError(error instanceof Error ? error.message : "Không thể tải chế độ duyệt.");
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void loadMode();
    }, [loadMode])
  );
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  async function changeMode(isManual: boolean): Promise<void> {
    if (savingMode || mode === null) return;
    setSavingMode(true);
    setModeError("");
    try {
      setMode((await deliveryRequestApi.updateApprovalMode(isManual ? 1 : 0)).deliveryApprovalMode);
    } catch (error) {
      setModeError(error instanceof Error ? error.message : "Không thể lưu chế độ duyệt.");
    } finally {
      setSavingMode(false);
    }
  }
  return (
    <ResidentFeed
      {...feed}
      onRefresh={() => {
        feed.refresh();
        void loadMode();
      }}
      onLoadMore={feed.loadMore}
      onRetryMore={feed.retryMore}
      keyExtractor={(item) => item.requestId}
      renderItem={({ item }) => <RequestCard item={item} now={now} />}
      empty="Không có yêu cầu chờ duyệt."
      icon="package"
      header={
        <>
          <ScreenHeader title="Yêu cầu giao hàng" />
          <Typography.Paragraph className="text-muted">
            Kiểm tra ảnh kiện hàng trước khi cho phép shipper sử dụng tủ.
          </Typography.Paragraph>
          <Card>
            <Card.Body>
              <ControlField
                isSelected={mode === 1}
                isDisabled={mode === null || savingMode || !!modeError}
                onSelectedChange={(selected) => void changeMode(selected)}
              >
                <View className="flex-1 gap-1">
                  <Typography.Heading className="text-base">Phê duyệt thủ công</Typography.Heading>
                  <Typography.Paragraph className="text-sm text-muted">
                    {mode === null
                      ? "Đang tải chế độ duyệt..."
                      : mode === 1
                        ? "Bạn duyệt từng yêu cầu"
                        : "Hệ thống tự động phê duyệt"}
                  </Typography.Paragraph>
                </View>
                <ControlField.Indicator>
                  <Switch />
                </ControlField.Indicator>
              </ControlField>
            </Card.Body>
          </Card>
          {modeError ? (
            <View className="gap-2">
              <Typography.Paragraph className="text-danger">{modeError}</Typography.Paragraph>
              <Button variant="secondary" onPress={() => void loadMode()}>
                <Button.Label>Thử lại</Button.Label>
              </Button>
            </View>
          ) : null}
        </>
      }
    />
  );
}
function RequestCard({ item, now }: { item: PendingDeliveryRequest; now: number }): JSX.Element {
  return (
    <Card>
      {item.parcelImageUrl ? (
        <ParcelImage
          uri={item.parcelImageUrl}
          className="h-40 w-full rounded-t-2xl bg-default"
          contentFit="cover"
          accessibilityLabel="Ảnh bưu kiện do shipper cung cấp"
        />
      ) : null}
      <Card.Header className="flex-row flex-wrap items-center justify-between gap-3">
        <View className="min-w-0 flex-1">
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
