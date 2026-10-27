import { LockerSupportCard } from "@/features/support/locker-support-card";
import { ParcelImage } from "@/components/ui/parcel-image";
import { router, useFocusEffect } from "expo-router";
import { Button, Card, Skeleton, Typography } from "heroui-native";
import type { JSX } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, ScrollView, View } from "react-native";
import { SafeAreaView } from "@/components/ui/themed-safe-area-view";

import { GravityIcon } from "@/components/icons/gravity-icon";
import { ScreenHeader } from "@/components/ui/resident-ui";
import { deliveryRequestApi } from "@/features/delivery-requests/api";
import { formatCountdown } from "@/features/delivery-requests/countdown";
import { invalidateMobileData, useMobileDataRevision } from "@/features/notifications/data-sync";
import type { ResidentDeliveryRequest } from "@/features/delivery-requests/types";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" });

export function DeliveryRequestDetailScreen({ id }: { id: string }): JSX.Element {
  const [request, setRequest] = useState<ResidentDeliveryRequest | null>(null);
  const [now, setNow] = useState(0);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState("");

  const revision = useMobileDataRevision();
  const generation = useRef(0);
  const load = useCallback(async () => {
    const run = ++generation.current;
    try {
      const current = await deliveryRequestApi.getDetail(id);
      if (run !== generation.current) return;
      setRequest(current);
      setError("");
      setNow(Date.now());
    } catch (loadError) {
      if (run !== generation.current) return;
      // Never leave stale approval controls usable after an unsuccessful refresh.
      setRequest(null);
      setError(loadError instanceof Error ? loadError.message : "Không thể tải yêu cầu.");
    } finally {
      if (run === generation.current) setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void load();
      const timer = setInterval(() => {
        if (AppState.currentState === "active") void load();
      }, 10000);
      return () => {
        clearInterval(timer);
        generation.current++;
      };
    }, [load])
  );

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load, revision]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function respond(nextAction: "approve" | "reject"): Promise<void> {
    if (!request) return;
    setAction(nextAction);
    setError("");
    try {
      if (nextAction === "approve") await deliveryRequestApi.approve(request.requestId);
      else await deliveryRequestApi.reject(request.requestId);
      invalidateMobileData();
      await load();
    } catch (responseError) {
      await load();
      invalidateMobileData();
      setError(
        responseError instanceof Error
          ? responseError.message
          : "Không thể xử lý yêu cầu. Trạng thái đã được tải lại."
      );
    } finally {
      setAction(null);
    }
  }

  const expired =
    request?.status === "PendingApproval" && request.approvalExpiresAt
      ? new Date(request.approvalExpiresAt).getTime() <= now
      : false;
  const canRespond = request?.requestId === id && request?.status === "PendingApproval" && !expired;
  const statusMessage =
    request?.status === "Cancelled"
      ? "Shipper đã hủy yêu cầu giao trước khi được phê duyệt. Bạn không cần phản hồi."
      : request?.status === "Rejected"
        ? "Yêu cầu này đã bị từ chối."
        : request?.status === "Expired" || expired
          ? "Yêu cầu đã hết thời gian phê duyệt."
          : request?.status === "Approved" || request?.status === "Allocated"
            ? "Yêu cầu đã được phê duyệt. Shipper tiếp tục giao hàng vào tủ."
            : request?.status === "Deposited"
              ? "Shipper đã hoàn tất gửi kiện hàng vào tủ."
              : "Yêu cầu không còn chờ phê duyệt.";

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-4 px-5 pb-8 pt-4"
      >
        <ScreenHeader title="Xác nhận bưu kiện đến" />

        {loading ? <Skeleton className="h-96 rounded-2xl" /> : null}
        {!loading && !request ? (
          <Card>
            <Card.Body className="items-center gap-3 py-10">
              <GravityIcon name="clock" size={40} />
              <Typography.Heading className="text-lg">
                Yêu cầu không còn hiệu lực
              </Typography.Heading>
              <Typography.Paragraph className="text-center text-muted">
                {error || "Không thể xác định trạng thái yêu cầu. Vui lòng tải lại."}
              </Typography.Paragraph>
              <Button variant="secondary" onPress={() => void load()}>
                <Button.Label>Tải lại trạng thái</Button.Label>
              </Button>
              <Button variant="secondary" onPress={() => router.replace("/")}>
                <Button.Label>Về trang chủ</Button.Label>
              </Button>
            </Card.Body>
          </Card>
        ) : null}

        {request ? (
          <View className="gap-4">
            <LockerSupportCard lockerCode={request.lockerCode} reference={request.requestId} />
            {canRespond && request.approvalExpiresAt ? (
              <Card className="border border-danger/20 bg-danger/5">
                <Card.Body className="flex-row items-center gap-3 py-3">
                  <GravityIcon name="clock" tone="danger" />
                  <View className="flex-1">
                    <Typography.Heading className="text-danger">
                      {expired
                        ? "Đã hết hạn"
                        : `Còn lại ${formatCountdown(request.approvalExpiresAt, now)}`}
                    </Typography.Heading>
                    <Typography.Paragraph className="text-sm text-danger">
                      Phản hồi trước {dateFormatter.format(new Date(request.approvalExpiresAt))}
                    </Typography.Paragraph>
                  </View>
                </Card.Body>
              </Card>
            ) : (
              <Card>
                <Card.Body className="gap-2">
                  <Card.Title>
                    {request.status === "Cancelled" ? "Shipper đã hủy giao" : "Trạng thái yêu cầu"}
                  </Card.Title>
                  <Typography.Paragraph>{statusMessage}</Typography.Paragraph>
                </Card.Body>
              </Card>
            )}
            <Card>
              {request.parcelImageUrl ? (
                <ParcelImage
                  uri={request.parcelImageUrl}
                  className="h-64 w-full rounded-t-2xl bg-default"
                  contentFit="cover"
                  accessibilityLabel="Ảnh bưu kiện"
                />
              ) : (
                <View className="h-48 items-center justify-center gap-2 bg-default">
                  <GravityIcon name="package" size={40} />
                  <Typography.Paragraph className="text-muted">
                    Không có ảnh bưu kiện
                  </Typography.Paragraph>
                </View>
              )}
              <Card.Header className="flex-row items-center justify-between gap-3">
                <View className="flex-1">
                  <Card.Title>Locker {request.lockerCode}</Card.Title>
                  <Typography.Paragraph className="text-muted">
                    {request.lockerAddress}
                  </Typography.Paragraph>
                </View>
              </Card.Header>
              <Card.Body className="gap-3">
                <InfoRow
                  label="Tủ nhận"
                  value={`${request.lockerCode} · ${request.lockerAddress}`}
                />
                <InfoRow
                  label="Yêu cầu lúc"
                  value={dateFormatter.format(new Date(request.createdAt))}
                />
                <Typography.Paragraph className="rounded-2xl bg-default px-4 py-3 text-sm text-muted">
                  {canRespond ? "Cho phép để bưu kiện này được gửi vào tủ của bạn." : statusMessage}
                </Typography.Paragraph>
                {error ? (
                  <Typography.Paragraph className="text-danger">{error}</Typography.Paragraph>
                ) : null}
                {canRespond ? (
                  <View className="mt-2 flex-row gap-3">
                    <Button
                      className="flex-1"
                      variant="secondary"
                      isDisabled={expired || action !== null}
                      onPress={() => void respond("reject")}
                    >
                      <Button.Label>
                        {action === "reject" ? "Đang từ chối" : "Từ chối"}
                      </Button.Label>
                    </Button>
                    <Button
                      className="flex-1"
                      isDisabled={expired || action !== null}
                      onPress={() => void respond("approve")}
                    >
                      <Button.Label>
                        {action === "approve" ? "Đang xử lý" : "Cho phép gửi vào tủ"}
                      </Button.Label>
                    </Button>
                  </View>
                ) : null}
              </Card.Body>
            </Card>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <View className="flex-row justify-between gap-4">
      <Typography.Paragraph className="text-muted">{label}</Typography.Paragraph>
      <Typography.Paragraph className="flex-1 text-right">{value}</Typography.Paragraph>
    </View>
  );
}
