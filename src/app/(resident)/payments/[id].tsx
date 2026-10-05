import { router, useLocalSearchParams } from "expo-router";
import { Button, Card, Skeleton, Typography } from "heroui-native";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GravityIcon } from "@/components/icons/gravity-icon";
import { ScreenHeader } from "@/components/ui/resident-ui";
import { paymentApi } from "@/features/payments/api";
import type { PaymentTransaction } from "@/features/payments/types";

export default function PaymentDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<PaymentTransaction | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (id)
      void paymentApi
        .get(id)
        .then(setItem)
        .catch((e: unknown) =>
          setError(e instanceof Error ? e.message : "Không thể tải giao dịch.")
        );
  }, [id]);
  const success = item
    ? item.status === 1 ||
      String(item.status).toLowerCase() === "succeeded" ||
      String(item.status).toLowerCase() === "paid"
    : false;
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-5 px-5 pb-10 pt-4">
        <ScreenHeader title={success ? "Thanh toán thành công" : "Chi tiết thanh toán"} />
        {!item && !error ? <Skeleton className="h-96 rounded-3xl" /> : null}
        {item ? (
          <>
            <View className="items-center gap-3 pt-5">
              <View
                className={
                  success
                    ? "h-24 w-24 items-center justify-center rounded-full bg-success"
                    : "h-24 w-24 items-center justify-center rounded-full bg-warning"
                }
              >
                <GravityIcon
                  name={success ? "check" : "clock"}
                  size={50}
                  tone={success ? "success-foreground" : "warning-foreground"}
                />
              </View>
              <Typography.Heading className="text-2xl">
                {success ? "Đã thanh toán" : "Đang xử lý"}
              </Typography.Heading>
              <Typography.Heading className="text-4xl text-accent">
                {new Intl.NumberFormat("vi-VN").format(item.amount)}đ
              </Typography.Heading>
            </View>
            <Card>
              <Card.Body className="gap-3">
                <Meta label="Mã giao dịch" value={item.externalTransactionId ?? item.id} />
                <Meta label="Phương thức" value="PayOS" />
                <Meta
                  label="Thời gian"
                  value={new Intl.DateTimeFormat("vi-VN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(item.completedAt ?? item.requestedAt))}
                />
              </Card.Body>
            </Card>
            <Button onPress={() => router.replace("/")}>
              <Button.Label>{success ? "Nhận hàng" : "Về trang chủ"}</Button.Label>
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
function Meta({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <View className="flex-row justify-between gap-4">
      <Typography.Paragraph className="text-muted">{label}</Typography.Paragraph>
      <Typography.Paragraph className="flex-1 text-right" numberOfLines={1}>
        {value}
      </Typography.Paragraph>
    </View>
  );
}
