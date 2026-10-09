import * as Linking from "expo-linking";
import { useLocalSearchParams } from "expo-router";
import { Button, Card, Skeleton, Spinner, Typography } from "heroui-native";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "@/components/ui/themed-safe-area-view";
import { ScreenHeader } from "@/components/ui/resident-ui";
import { parcelApi } from "@/features/parcels/api";
import type { ParcelDetail } from "@/features/parcels/types";
import { paymentApi } from "@/features/payments/api";

export default function PaymentScreen(): JSX.Element {
  const { parcelId } = useLocalSearchParams<{ parcelId: string }>();
  const [parcel, setParcel] = useState<ParcelDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    void parcelApi
      .getDetail(String(parcelId))
      .then(setParcel)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Không thể tải phí quá hạn.")
      )
      .finally(() => setLoading(false));
  }, [parcelId]);
  const pay = async () => {
    if (!parcel?.overdueChargeId) return setError("Khoản phí chưa sẵn sàng để thanh toán.");
    setPaying(true);
    setError("");
    try {
      const transaction = await paymentApi.create(parcel.overdueChargeId);
      await Linking.openURL(transaction.checkoutUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể mở PayOS.");
    } finally {
      setPaying(false);
    }
  };
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-5 px-5 pb-10 pt-4">
        <ScreenHeader title="Thanh toán phí quá hạn" />
        {loading ? <Skeleton className="h-80 rounded-3xl" /> : null}
        {parcel ? (
          <>
            <Card>
              <Card.Body className="gap-4">
                <Typography.Heading className="text-lg">{parcel.parcelCode}</Typography.Heading>
                <Meta
                  label="Phí quá hạn"
                  value={`${new Intl.NumberFormat("vi-VN").format(parcel.overdueAmount ?? 0)}đ`}
                  emphasize
                />
                <Meta
                  label="Hạn nhận"
                  value={new Intl.DateTimeFormat("vi-VN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(parcel.pickupDueAt))}
                />
                <Meta
                  label="Tổng thanh toán"
                  value={`${new Intl.NumberFormat("vi-VN").format(parcel.overdueAmount ?? 0)}đ`}
                  emphasize
                />
                <Meta label="Cổng thanh toán" value="PayOS" />
              </Card.Body>
            </Card>
            <Button isDisabled={paying || !parcel.overdueChargeId} onPress={() => void pay()}>
              {paying ? <Spinner size="sm" color="current" /> : null}
              <Button.Label>Thanh toán với PayOS</Button.Label>
            </Button>
          </>
        ) : null}
        {error ? (
          <Typography.Paragraph className="text-danger">{error}</Typography.Paragraph>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
function Meta({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}): JSX.Element {
  return (
    <View className="flex-row items-center justify-between gap-4">
      <Typography.Paragraph className="text-muted">{label}</Typography.Paragraph>
      <Typography.Paragraph className={emphasize ? "font-bold text-danger" : "font-medium"}>
        {value}
      </Typography.Paragraph>
    </View>
  );
}
