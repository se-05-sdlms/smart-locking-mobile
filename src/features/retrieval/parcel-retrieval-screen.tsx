import { router } from "expo-router";
import { Button, Card, Skeleton, Spinner, Typography } from "heroui-native";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GravityIcon } from "@/components/icons/gravity-icon";
import { parcelApi } from "@/features/parcels/api";
import type { ParcelDetail } from "@/features/parcels/types";
import { retrievalApi } from "@/features/retrieval/api";

type RetrievalPhase = "idle" | "opening" | "retrieved" | "failed";

export function ParcelRetrievalScreen({ parcelId }: { parcelId: string }): JSX.Element {
  const [parcel, setParcel] = useState<ParcelDetail | null>(null);
  const [phase, setPhase] = useState<RetrievalPhase>("idle");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void parcelApi
      .getDetail(parcelId)
      .then(setParcel)
      .catch((loadError: unknown) =>
        setError(loadError instanceof Error ? loadError.message : "Không thể tải bưu kiện.")
      )
      .finally(() => setLoading(false));
  }, [parcelId]);

  useEffect(() => {
    if (phase !== "opening") return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const deadline = Date.now() + 30_000;

    const poll = async (): Promise<void> => {
      try {
        const next = await parcelApi.getDetail(parcelId);
        if (cancelled) return;
        setParcel(next);
        if (next.status === "Retrieved") {
          setPhase("retrieved");
          return;
        }
      } catch {
        // Keep the command state visible while a transient poll fails.
      }
      if (!cancelled && Date.now() < deadline) {
        timer = setTimeout(() => void poll(), 2000);
      } else if (!cancelled) {
        setError("Chưa nhận được xác nhận từ locker. Hãy kiểm tra cửa ngăn hoặc thử lại.");
        setPhase("failed");
      }
    };

    timer = setTimeout(() => void poll(), 2000);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [parcelId, phase]);

  async function unlock(): Promise<void> {
    setPhase("opening");
    setError("");
    try {
      const result = await retrievalApi.unlockParcel(parcelId);
      if (result.result !== "Succeeded") {
        setError(result.failureReason ?? "Locker chưa thể mở ngăn.");
        setPhase("failed");
      }
    } catch (unlockError) {
      setError(unlockError instanceof Error ? unlockError.message : "Không thể mở ngăn locker.");
      setPhase("failed");
    }
  }

  const paymentRequired = parcel?.overdueChargeStatus === "Outstanding";
  const canRetrieve = parcel?.status === "Stored" || parcel?.status === "Overdue";

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-4 px-5 pb-8 pt-4">
        <Button
          isIconOnly
          size="sm"
          variant="tertiary"
          accessibilityLabel="Quay lại"
          onPress={() => router.back()}
        >
          <GravityIcon name="arrow-left" />
        </Button>
        <View className="gap-1">
          <Typography.Heading className="text-3xl">Nhận bưu kiện</Typography.Heading>
          <Typography.Paragraph className="text-muted">
            Đứng gần locker và đảm bảo khu vực cửa ngăn đang an toàn.
          </Typography.Paragraph>
        </View>

        {loading ? <Skeleton className="h-72 rounded-2xl" /> : null}
        {parcel ? (
          <Card>
            <Card.Header>
              <Card.Title>{parcel.parcelCode}</Card.Title>
            </Card.Header>
            <Card.Body className="gap-3">
              <InfoRow label="Locker" value={`${parcel.lockerCode} · ${parcel.lockerAddress}`} />
              <InfoRow label="Ngăn" value={parcel.compartmentCode} />
              {paymentRequired ? (
                <View className="gap-3 rounded-2xl bg-danger-soft p-4">
                  <Typography.Heading className="text-base text-danger">
                    Cần thanh toán phí quá hạn
                  </Typography.Heading>
                  <Typography.Paragraph className="text-sm text-danger">
                    Hoàn tất thanh toán PayOS trước khi mở ngăn lấy hàng.
                  </Typography.Paragraph>
                  <Button onPress={() => router.replace(`/payment/${parcel.id}`)}>
                    <Button.Label>Đi đến thanh toán</Button.Label>
                  </Button>
                </View>
              ) : null}
            </Card.Body>
          </Card>
        ) : null}

        {phase === "opening" ? (
          <Card>
            <Card.Body className="items-center gap-3 py-8">
              <Spinner size="lg" />
              <Typography.Heading className="text-lg">Đang mở ngăn locker</Typography.Heading>
              <Typography.Paragraph className="text-center text-muted">
                Lệnh đã được gửi. Lấy bưu kiện rồi đóng cửa ngăn để hệ thống xác nhận.
              </Typography.Paragraph>
            </Card.Body>
          </Card>
        ) : null}

        {phase === "retrieved" ? (
          <Card>
            <Card.Body className="items-center gap-3 py-8">
              <GravityIcon name="check-circle" size={44} tone="success" />
              <Typography.Heading className="text-lg">Đã nhận bưu kiện</Typography.Heading>
              <Typography.Paragraph className="text-center text-muted">
                Cửa ngăn đã đóng và lịch sử bưu kiện đã được cập nhật.
              </Typography.Paragraph>
              <Button onPress={() => router.replace("/")}>
                <Button.Label>Về trang chủ</Button.Label>
              </Button>
            </Card.Body>
          </Card>
        ) : null}

        {error ? (
          <Typography.Paragraph className="text-danger">{error}</Typography.Paragraph>
        ) : null}
        {!loading && parcel && canRetrieve && !paymentRequired && phase !== "retrieved" ? (
          <Button isDisabled={phase === "opening"} onPress={() => void unlock()}>
            <GravityIcon name="unlock" tone="accent-foreground" />
            <Button.Label>
              {phase === "opening" ? "Đang gửi lệnh" : "Mở ngăn lấy hàng"}
            </Button.Label>
          </Button>
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
