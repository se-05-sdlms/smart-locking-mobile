import { router } from "expo-router";
import { Button, Card, Skeleton, Typography } from "heroui-native";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import { Image, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GravityIcon } from "@/components/icons/gravity-icon";
import { ScreenHeader } from "@/components/ui/resident-ui";
import { deliveryRequestApi } from "@/features/delivery-requests/api";
import { formatCountdown } from "@/features/delivery-requests/countdown";
import type { PendingDeliveryRequest } from "@/features/delivery-requests/types";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" });

export function DeliveryRequestDetailScreen({ id }: { id: string }): JSX.Element {
  const [request, setRequest] = useState<PendingDeliveryRequest | null>(null);
  const [now, setNow] = useState(0);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void deliveryRequestApi
      .getPending()
      .then((items) => {
        setRequest(items.find((item) => item.requestId === id) ?? null);
        setNow(Date.now());
      })
      .catch((loadError: unknown) =>
        setError(loadError instanceof Error ? loadError.message : "Không thể tải yêu cầu.")
      )
      .finally(() => setLoading(false));
  }, [id]);

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
      router.replace("/");
    } catch (responseError) {
      setError(responseError instanceof Error ? responseError.message : "Không thể xử lý yêu cầu.");
    } finally {
      setAction(null);
    }
  }

  const expired = request ? new Date(request.approvalExpiresAt).getTime() <= now : false;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-4 px-5 pb-8 pt-4">
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
                Yêu cầu có thể đã được xử lý hoặc đã hết thời gian phê duyệt.
              </Typography.Paragraph>
              <Button variant="secondary" onPress={() => router.replace("/")}>
                <Button.Label>Về trang chủ</Button.Label>
              </Button>
            </Card.Body>
          </Card>
        ) : null}

        {request ? (
          <View className="gap-4">
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
            <Card>
              {request.parcelImageUrl ? (
                <Image
                  source={{ uri: request.parcelImageUrl }}
                  className="h-64 w-full rounded-t-2xl bg-default"
                  resizeMode="cover"
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
                  Cho phép để bưu kiện này được gửi vào tủ của bạn.
                </Typography.Paragraph>
                {error ? (
                  <Typography.Paragraph className="text-danger">{error}</Typography.Paragraph>
                ) : null}
                <View className="mt-2 flex-row gap-3">
                  <Button
                    className="flex-1"
                    variant="secondary"
                    isDisabled={expired || action !== null}
                    onPress={() => void respond("reject")}
                  >
                    <Button.Label>{action === "reject" ? "Đang từ chối" : "Từ chối"}</Button.Label>
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
