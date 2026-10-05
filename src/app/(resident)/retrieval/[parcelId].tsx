import { router, useLocalSearchParams } from "expo-router";
import { Button, Card, Skeleton, Typography } from "heroui-native";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import { Image, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GravityIcon } from "@/components/icons/gravity-icon";
import { FlowSteps, IncidentAction, ScreenHeader } from "@/components/ui/resident-ui";
import { parcelApi } from "@/features/parcels/api";
import type { ParcelDetail } from "@/features/parcels/types";

type Step = "ready" | "opened" | "completed";
const labels = ["Sẵn sàng", "Mở ngăn", "Hoàn tất"];

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
    void parcelApi
      .getDetail(id)
      .then(setParcel)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Không thể tải bưu kiện."))
      .finally(() => setLoading(false));
  }, [id]);
  const unlock = async () => {
    setSubmitting(true);
    setError("");
    try {
      const response = await parcelApi.unlockPickup(id);
      if (response.result !== "Succeeded")
        throw new Error(response.failureReason ?? "Không thể mở ngăn.");
      setAccessEventId(response.accessEventId);
      setStep("opened");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể mở ngăn.");
    } finally {
      setSubmitting(false);
    }
  };
  const confirm = async () => {
    if (!accessEventId) return;
    setSubmitting(true);
    setError("");
    try {
      await parcelApi.confirmPickup(id, accessEventId);
      setStep("completed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cửa ngăn chưa đóng.");
    } finally {
      setSubmitting(false);
    }
  };
  const active = step === "ready" ? 0 : step === "opened" ? 1 : 2;
  return (
    <SafeAreaView className="flex-1 bg-background px-5 py-4">
      <ScreenHeader
        title={
          step === "ready"
            ? "Sẵn sàng mở ngăn"
            : step === "opened"
              ? "Ngăn đã mở"
              : "Hoàn tất nhận hàng"
        }
      />
      {loading ? <Skeleton className="mt-6 h-96 rounded-3xl" /> : null}
      {!loading && parcel ? (
        <View className="flex-1 gap-5 pt-5">
          <FlowSteps labels={labels} active={active} />
          {step === "ready" ? (
            <>
              <Card>
                <Card.Body className="flex-row items-center gap-3">
                  <View className="h-20 w-20 items-center justify-center rounded-2xl bg-accent-soft">
                    {parcel.parcelImageUrl ? (
                      <Image
                        source={{ uri: parcel.parcelImageUrl }}
                        className="h-20 w-20 rounded-2xl"
                      />
                    ) : (
                      <GravityIcon name="package" size={36} tone="accent" />
                    )}
                  </View>
                  <View className="flex-1 gap-1">
                    <Typography.Heading className="text-lg">{parcel.parcelCode}</Typography.Heading>
                    <Typography.Paragraph>{parcel.lockerCode}</Typography.Paragraph>
                    <Typography.Paragraph className="text-muted">
                      Ngăn {parcel.compartmentCode}
                    </Typography.Paragraph>
                  </View>
                </Card.Body>
              </Card>
              <Card className="bg-accent/5">
                <Card.Body className="flex-row items-center gap-3 py-3">
                  <GravityIcon name="building" tone="accent" />
                  <Typography.Paragraph className="flex-1">
                    Hãy đến đúng tủ trước khi mở ngăn.
                  </Typography.Paragraph>
                </Card.Body>
              </Card>
            </>
          ) : null}
          {step === "opened" ? (
            <View className="items-center gap-4">
              <View className="w-full items-center justify-center rounded-3xl bg-default py-10">
                <GravityIcon name="lock" size={56} tone="success" />
              </View>
              <Typography.Heading className="text-2xl">
                Ngăn {parcel.compartmentCode} đã mở
              </Typography.Heading>
              <Typography.Paragraph className="text-center text-muted">
                Lấy bưu kiện và đóng cửa ngăn tủ.
              </Typography.Paragraph>
            </View>
          ) : null}
          {step === "completed" ? (
            <View className="items-center gap-4 pt-6">
              <View className="h-24 w-24 items-center justify-center rounded-full bg-success">
                <GravityIcon name="check" size={54} tone="success-foreground" />
              </View>
              <Typography.Heading className="text-3xl">Đã nhận bưu kiện</Typography.Heading>
              <Card className="w-full">
                <Card.Body className="items-center gap-1">
                  <Typography.Heading className="text-lg">{parcel.parcelCode}</Typography.Heading>
                  <Typography.Paragraph className="text-muted">
                    Ngăn {parcel.compartmentCode} đã được đóng và hoàn tất.
                  </Typography.Paragraph>
                </Card.Body>
              </Card>
            </View>
          ) : null}
          {error ? (
            <Typography.Paragraph className="text-center text-danger">{error}</Typography.Paragraph>
          ) : null}
          <View className="mt-auto gap-1 pb-2">
            {step === "ready" ? (
              <Button isDisabled={submitting} onPress={() => void unlock()}>
                <Button.Label>
                  {submitting ? "Đang mở ngăn..." : `Mở ngăn ${parcel.compartmentCode}`}
                </Button.Label>
              </Button>
            ) : null}
            {step === "opened" ? (
              <Button isDisabled={submitting} onPress={() => void confirm()}>
                <Button.Label>
                  {submitting ? "Đang kiểm tra cửa..." : "Đã lấy hàng và đóng cửa"}
                </Button.Label>
              </Button>
            ) : null}
            {step === "completed" ? (
              <Button onPress={() => router.replace("/")}>
                <Button.Label>Về trang chủ</Button.Label>
              </Button>
            ) : null}
            {step !== "completed" ? (
              <IncidentAction
                onPress={() =>
                  router.push({ pathname: "/incidents/new", params: { parcelId: parcel.id } })
                }
              />
            ) : null}
          </View>
        </View>
      ) : null}
      {!loading && !parcel ? (
        <Typography.Paragraph className="mt-6 text-danger">{error}</Typography.Paragraph>
      ) : null}
    </SafeAreaView>
  );
}
