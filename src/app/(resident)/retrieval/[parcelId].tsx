import { router, useLocalSearchParams } from "expo-router";
import { Button, Card, Skeleton, Typography } from "heroui-native";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GravityIcon } from "@/components/icons/gravity-icon";
import { parcelApi } from "@/features/parcels/api";
import type { ParcelDetail } from "@/features/parcels/types";

type Step = "ready" | "opened" | "completed";

export default function RetrievalScreen(): JSX.Element {
  const { parcelId } = useLocalSearchParams<{ parcelId: string }>();
  const id = String(parcelId);
  const [parcel, setParcel] = useState<ParcelDetail>();
  const [accessEventId, setAccessEventId] = useState("");
  const [step, setStep] = useState<Step>("ready");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void parcelApi.getDetail(id)
      .then(setParcel)
      .catch((loadError: unknown) =>
        setError(loadError instanceof Error ? loadError.message : "Không thể tải bưu kiện."))
      .finally(() => setLoading(false));
  }, [id]);

  async function unlock(): Promise<void> {
    setSubmitting(true);
    setError("");
    try {
      const response = await parcelApi.unlockPickup(id);
      if (response.result !== "Succeeded") throw new Error(response.failureReason ?? "Không thể mở ngăn.");
      setAccessEventId(response.accessEventId);
      setStep("opened");
    } catch (unlockError) {
      setError(unlockError instanceof Error ? unlockError.message : "Không thể mở ngăn.");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirm(): Promise<void> {
    if (!accessEventId) return;
    setSubmitting(true);
    setError("");
    try {
      await parcelApi.confirmPickup(id, accessEventId);
      setStep("completed");
    } catch (confirmError) {
      setError(confirmError instanceof Error ? confirmError.message : "Cửa ngăn chưa đóng.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background px-5 py-5">
      <Button isIconOnly variant="secondary" accessibilityLabel="Quay lại" onPress={() => router.back()}>
        <GravityIcon name="arrow-left" />
      </Button>
      {loading ? <Skeleton className="mt-5 h-96 rounded-2xl" /> : null}
      {!loading && parcel ? (
        <View className="flex-1 gap-5 pt-6">
          <View className="items-center gap-2">
            <GravityIcon name={step === "completed" ? "package" : "lock"} size={52} tone="accent" />
            <Typography.Heading className="text-center text-3xl">
              {step === "ready" ? "Nhận bưu kiện" : step === "opened" ? `Ngăn ${parcel.compartmentCode} đã mở` : "Đã nhận hàng"}
            </Typography.Heading>
            <Typography.Paragraph className="text-center text-muted">
              {step === "ready"
                ? "Đứng gần locker rồi nhấn mở ngăn."
                : step === "opened"
                  ? "Lấy kiện hàng ra và đóng kín cửa ngăn."
                  : "Bưu kiện đã được chuyển vào lịch sử nhận hàng."}
            </Typography.Paragraph>
          </View>

          <Card>
            <Card.Body className="gap-3">
              <Info label="Mã kiện" value={parcel.parcelCode} />
              <Info label="Locker" value={`${parcel.lockerCode} · ${parcel.lockerAddress}`} />
              <Info label="Ngăn" value={parcel.compartmentCode} />
            </Card.Body>
          </Card>

          {error ? <Typography.Paragraph className="text-center text-danger">{error}</Typography.Paragraph> : null}
          <View className="mt-auto gap-3 pb-4">
            {step === "ready" ? (
              <Button isDisabled={submitting} onPress={() => void unlock()}>
                <GravityIcon name="lock" tone="accent-foreground" />
                <Button.Label>{submitting ? "Đang mở ngăn..." : `Mở ngăn ${parcel.compartmentCode}`}</Button.Label>
              </Button>
            ) : null}
            {step === "opened" ? (
              <Button isDisabled={submitting} onPress={() => void confirm()}>
                <Button.Label>{submitting ? "Đang kiểm tra cửa..." : "Tôi đã lấy hàng và đóng cửa"}</Button.Label>
              </Button>
            ) : null}
            {step === "completed" ? (
              <Button onPress={() => router.replace("/(resident)/(tabs)")}>
                <Button.Label>Hoàn tất</Button.Label>
              </Button>
            ) : null}
          </View>
        </View>
      ) : null}
      {!loading && !parcel ? <Typography.Paragraph className="mt-6 text-danger">{error}</Typography.Paragraph> : null}
    </SafeAreaView>
  );
}

function Info({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <View className="gap-1">
      <Typography.Paragraph className="text-xs text-muted">{label}</Typography.Paragraph>
      <Typography.Paragraph>{value}</Typography.Paragraph>
    </View>
  );
}
