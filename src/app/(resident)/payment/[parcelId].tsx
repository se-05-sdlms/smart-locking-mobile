import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Button, Card, Skeleton, Typography } from "heroui-native";
import type { JSX } from "react";
import { useCallback, useRef, useState } from "react";
import { AppState, ScrollView } from "react-native";
import { ActionError } from "@/components/ui/action-error";
import { ScreenHeader } from "@/components/ui/resident-ui";
import { SafeAreaView } from "@/components/ui/themed-safe-area-view";
import { StatusBadge } from "@/components/ui/status-badge";
import { invalidateMobileData } from "@/features/notifications/data-sync";
import { parcelApi } from "@/features/parcels/api";
import type { ParcelDetail } from "@/features/parcels/types";
import { paymentApi } from "@/features/payments/api";
import { paymentState, type PaymentTransaction } from "@/features/payments/types";
import { usePaymentPolling } from "@/features/payments/use-payment-polling";
import { VietQr } from "@/features/payments/viet-qr";

export default function PaymentScreen(): JSX.Element {
  const { parcelId } = useLocalSearchParams<{ parcelId: string }>();
  const [parcel, setParcel] = useState<ParcelDetail | null>(null);
  const [transaction, setTransaction] = useState<PaymentTransaction | null>(null);
  const transactionId = useRef<string | null>(null);
  const pending = useRef(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const [detail, payment] = await Promise.all([
        parcelApi.getDetail(parcelId),
        transactionId.current ? paymentApi.get(transactionId.current) : Promise.resolve(null),
      ]);
      setParcel(detail);
      setTransaction(payment);
      if (payment && paymentState(payment.status).success) invalidateMobileData();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Chưa cập nhật được thanh toán.");
    } finally {
      pending.current = false;
      setLoading(false);
      setBusy(false);
    }
  }, [parcelId]);
  useFocusEffect(
    useCallback(() => {
      void refresh();
      const subscription = AppState.addEventListener("change", (state) => {
        if (state === "active") void refresh();
      });
      return () => subscription.remove();
    }, [refresh])
  );
  const pay = async () => {
    if (pending.current || !parcel?.overdueChargeId) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const created = await paymentApi.create(parcel.overdueChargeId);
      transactionId.current = created.id;
      setTransaction(created);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Không thể tạo mã VietQR.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  const paid = parcel?.overdueChargeStatus === "Paid";
  const state = transaction ? paymentState(transaction.status) : null;
  const qrExpired = transaction
    ? Date.now() >= Date.parse(transaction.requestedAt) + 15 * 60_000
    : false;
  const pendingId = state?.pending ? transaction?.id : undefined;
  const checkPayment = useCallback(async () => {
    if (!pendingId || pending.current) return;
    pending.current = true;
    try {
      const payment = await paymentApi.get(pendingId);
      setTransaction(payment);
      setError("");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Chưa cập nhật được thanh toán.");
    } finally {
      pending.current = false;
    }
  }, [pendingId]);
  usePaymentPolling(Boolean(pendingId), checkPayment);
  const succeededId = state?.success ? transaction?.id : undefined;
  useFocusEffect(useCallback(() => {
    if (!succeededId) return;
    invalidateMobileData();
    router.replace({ pathname: "/payments/[id]", params: { id: succeededId } });
  }, [succeededId]));
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-5 px-5 pb-8 pt-4"
      >
        <ScreenHeader title="Thanh toán phí quá hạn" />
        {loading ? <Skeleton className="h-48 rounded-xl" /> : null}
        {parcel ? (
          <>
            <Card>
              <Card.Body className="gap-3">
                <Typography.Heading>{parcel.parcelCode}</Typography.Heading>
                <Typography.Paragraph>
                  Phí quá hạn:{" "}
                  {new Intl.NumberFormat("vi-VN").format(
                    transaction?.amount ?? parcel.overdueAmount ?? 0
                  )}{" "}
                  {transaction?.currency ?? parcel.currency ?? "VND"}
                </Typography.Paragraph>
                <StatusBadge
                  label={paid ? "Đã thanh toán phí" : (state?.label ?? "Chưa thanh toán")}
                  tone={paid ? "success" : (state?.tone ?? "warning")}
                />
              </Card.Body>
            </Card>
            {paid && (parcel.status === "Stored" || parcel.status === "Overdue") ? (
              <Button
                isDisabled={busy || !!error}
                onPress={() =>
                  router.replace({ pathname: "/retrieval/[parcelId]", params: { parcelId } })
                }
              >
                <Button.Label>Tiếp tục nhận hàng</Button.Label>
              </Button>
            ) : null}
            {state?.pending && !qrExpired && transaction?.qrCode ? (
              <VietQr code={transaction.qrCode} amount={transaction.amount} />
            ) : null}
            {state?.pending && (qrExpired || !transaction?.qrCode) ? (
              <Typography.Paragraph className="text-muted">
                Mã VietQR hiện không khả dụng. Bạn có thể yêu cầu mã mới sau khi giao dịch cũ hết hạn.
              </Typography.Paragraph>
            ) : null}
            {!paid && parcel.overdueChargeId && !state?.success && (qrExpired || !transaction?.qrCode) ? (
              <Button isDisabled={busy} onPress={() => void pay()}>
                <Button.Label>{busy ? "Đang xử lý..." : "Hiện mã VietQR"}</Button.Label>
              </Button>
            ) : null}
            {!paid && !parcel.overdueChargeId ? (
              <Typography.Paragraph className="text-muted">
                Khoản phí chưa sẵn sàng để thanh toán.
              </Typography.Paragraph>
            ) : null}
          </>
        ) : null}
        {error ? <ActionError title="Chưa cập nhật được thanh toán" message={error} /> : null}
        <Button variant="secondary" isDisabled={busy} onPress={() => void refresh()}>
          <Button.Label>{busy ? "Đang kiểm tra..." : "Kiểm tra trạng thái"}</Button.Label>
        </Button>
        {transaction ? (
          <Button
            variant="secondary"
            onPress={() =>
              router.push({ pathname: "/payments/[id]", params: { id: transaction.id } })
            }
          >
            <Button.Label>Chi tiết giao dịch</Button.Label>
          </Button>
        ) : null}
        <Button variant="ghost" onPress={() => router.push("/payments")}>
          <Button.Label>Lịch sử thanh toán</Button.Label>
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
