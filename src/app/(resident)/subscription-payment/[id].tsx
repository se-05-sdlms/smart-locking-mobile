import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Button, Skeleton, Typography } from "heroui-native";
import { useCallback, useRef, useState } from "react";
import { ScrollView } from "react-native";

import { ActionError } from "@/components/ui/action-error";
import { ScreenHeader } from "@/components/ui/resident-ui";
import { SafeAreaView } from "@/components/ui/themed-safe-area-view";
import { accountPackageApi } from "@/features/account-packages/api";
import { readSubscriptionCheckout } from "@/features/account-packages/storage";
import type { ResidentSubscription, SubscriptionCheckout } from "@/features/account-packages/types";
import { useAuth } from "@/features/auth/auth-context";
import { usePaymentPolling } from "@/features/payments/use-payment-polling";
import { VietQr } from "@/features/payments/viet-qr";

export default function SubscriptionPaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<ResidentSubscription | null>(null);
  const [checkout, setCheckout] = useState<SubscriptionCheckout | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const refresh = useCallback(async () => {
    if (!user || pending.current) return;
    pending.current = true;
    setBusy(true);
    try {
      const history = await accountPackageApi.getHistory();
      const item = history.find((entry) => entry.id === id);
      if (!item) throw new Error("Không tìm thấy giao dịch gói dịch vụ.");
      setSubscription(item);
      if (item.status === "PendingPayment" && !item.paidAt) {
        const saved = await readSubscriptionCheckout(user.id, id);
        setCheckout(saved);
        if (!saved?.qrCode?.trim() || saved.amount !== item.price) {
          setCheckout(null);
          throw new Error("Không tải được mã VietQR cho giao dịch này.");
        }
      }
      setError("");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Chưa cập nhật được thanh toán.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }, [id, user]);
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );
  const paid = Boolean(subscription?.paidAt);
  const awaitingPayment = !paid && subscription?.status === "PendingPayment";
  usePaymentPolling(awaitingPayment, refresh);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-5 px-5 pb-8 pt-4">
        <ScreenHeader title={paid ? "Thanh toán thành công" : "Thanh toán gói dịch vụ"} />
        {!subscription && !error ? <Skeleton className="h-48 rounded-xl" /> : null}
        {paid ? (
          <Typography.Paragraph>Đã thanh toán gói {subscription?.planName}.</Typography.Paragraph>
        ) : null}
        {awaitingPayment && checkout?.qrCode ? (
          <VietQr code={checkout.qrCode} amount={checkout.amount} />
        ) : null}
        {subscription && !paid && !awaitingPayment ? (
          <Typography.Paragraph>
            Giao dịch đã kết thúc. Xem chi tiết trong Gói dịch vụ.
          </Typography.Paragraph>
        ) : null}
        {error ? <ActionError title="Chưa cập nhật được thanh toán" message={error} /> : null}
        {!paid ? (
          <Button variant="secondary" isDisabled={busy} onPress={() => void refresh()}>
            <Button.Label>Kiểm tra trạng thái</Button.Label>
          </Button>
        ) : null}
        <Button onPress={() => router.replace("/account-package")}>
          <Button.Label>Gói dịch vụ</Button.Label>
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
