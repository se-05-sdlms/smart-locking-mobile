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
import { paymentApi } from "@/features/payments/api";
import { paymentState, type PaymentTransaction } from "@/features/payments/types";

export default function PaymentDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<PaymentTransaction | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const load = useCallback(async () => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const next = await paymentApi.get(id);
      setItem(next);
      if (paymentState(next.status).success) invalidateMobileData();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Không tải được giao dịch.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }, [id]);
  useFocusEffect(
    useCallback(() => {
      void load();
      const subscription = AppState.addEventListener("change", (state) => {
        if (state === "active") void load();
      });
      return () => subscription.remove();
    }, [load])
  );
  const state = item ? paymentState(item.status) : null;
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-5 px-5 pb-8 pt-4"
      >
        <ScreenHeader title="Chi tiết thanh toán" />
        {!item && !error ? <Skeleton className="h-48 rounded-xl" /> : null}
        {item && state ? (
          <Card>
            <Card.Body className="gap-3">
              <StatusBadge label={state.label} tone={state.tone} />
              <Typography.Heading>
                {new Intl.NumberFormat("vi-VN").format(item.amount)} {item.currency}
              </Typography.Heading>
              <Typography.Paragraph selectable>Mã giao dịch: {item.id}</Typography.Paragraph>
              <Typography.Paragraph>
                PayOS ·{" "}
                {new Intl.DateTimeFormat("vi-VN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(item.completedAt ?? item.requestedAt))}
              </Typography.Paragraph>
              {!state.success ? (
                <Typography.Paragraph className="text-muted">
                  Phí chỉ được ghi nhận đã thanh toán khi máy chủ xác nhận thành công.
                </Typography.Paragraph>
              ) : null}
            </Card.Body>
          </Card>
        ) : null}
        {error ? <ActionError title="Không tải được giao dịch" message={error} /> : null}
        <Button variant="secondary" isDisabled={busy} onPress={() => void load()}>
          <Button.Label>{busy ? "Đang cập nhật..." : "Cập nhật trạng thái"}</Button.Label>
        </Button>
        <Button variant="ghost" onPress={() => router.replace("/payments")}>
          <Button.Label>Lịch sử thanh toán</Button.Label>
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
