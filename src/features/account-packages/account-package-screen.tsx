import * as Linking from "expo-linking";
import { useFocusEffect } from "expo-router";
import { Button, Card, Spinner, Typography } from "heroui-native";
import type { JSX } from "react";
import { useCallback, useRef, useState } from "react";
import { AppState, ScrollView, View } from "react-native";

import { ScreenHeader } from "@/components/ui/resident-ui";
import { SafeAreaView } from "@/components/ui/themed-safe-area-view";
import { accountPackageApi } from "@/features/account-packages/api";
import {
  PackageBenefit,
  PackagePicker,
  formatPackagePrice,
} from "@/features/account-packages/package-picker";
import { readPreferredPackage, savePreferredPackage } from "@/features/account-packages/storage";
import type { ResidentSubscription, SubscriptionCheckout } from "@/features/account-packages/types";
import { usePackagePlans } from "@/features/account-packages/use-package-plans";
import { useAuth } from "@/features/auth/auth-context";
import { useMobileDataRevision } from "@/features/notifications/data-sync";

const formatDate = (value: string): string =>
  new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(value));

const statusLabel = (subscription: ResidentSubscription): string => {
  if (subscription.status === "PendingPayment") return "Chờ thanh toán";
  if (subscription.status === "Active") {
    if (new Date(subscription.endDate).getTime() <= Date.now()) return "Đã hết hạn";
    return new Date(subscription.startDate).getTime() > Date.now()
      ? "Chờ đến ngày hiệu lực"
      : "Đang sử dụng";
  }
  if (subscription.status === "Expired") return "Đã hết hạn";
  if (subscription.status === "Cancelled") return "Đã hủy";
  return subscription.status;
};

export function AccountPackageScreen(): JSX.Element {
  const { user } = useAuth();
  const packages = usePackagePlans();
  const dataRevision = useMobileDataRevision();
  const [revision, setRevision] = useState(0);
  const [current, setCurrent] = useState<ResidentSubscription | null>(null);
  const [history, setHistory] = useState<ResidentSubscription[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [paying, setPaying] = useState(false);
  const [checkouts, setCheckouts] = useState<Record<string, SubscriptionCheckout>>({});
  const selectionLoadedFor = useRef<string | null>(null);
  const paymentInFlight = useRef(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    let request = 0;
    const load = async () => {
      if (!user) return;
      const id = ++request;
      setLoading(true);
      setLoadError("");
      try {
        const [subscription, subscriptions, preference] = await Promise.all([
          accountPackageApi.getCurrent(),
          accountPackageApi.getHistory(),
          readPreferredPackage(user.id).catch(() => null),
        ]);
        if (!active || id !== request) return;
        setCurrent(subscription);
        setHistory(subscriptions);
        if (selectionLoadedFor.current !== user.id) {
          setSelectedId(preference);
          selectionLoadedFor.current = user.id;
        }
        setCheckouts((previous) => Object.fromEntries(
          Object.entries(previous).filter(([, payment]) => !subscriptions.some(
            (item) => item.id === payment.subscriptionId && item.status !== "PendingPayment"
          ))
        ));
      } catch (e) {
        if (active && id === request) {
          setLoadError(e instanceof Error ? e.message : "Không thể tải gói tài khoản.");
        }
      } finally {
        if (active && id === request) setLoading(false);
      }
    };
    void load();
    const listener = AppState.addEventListener("change", (state) => {
      if (state === "active") void load();
    });
    return () => {
      active = false;
      listener.remove();
    };
  }, [user, dataRevision, revision]));

  const currentPlan = packages.plans.find((plan) => plan.id === current?.planId);
  const selectedPlan = packages.plans.find((plan) => plan.id === selectedId);
  const checkout = selectedPlan ? checkouts[selectedPlan.id] : undefined;

  const pay = async () => {
    if (!selectedPlan || !user || selectedPlan.price <= 0 || paymentInFlight.current) return;
    paymentInFlight.current = true;
    setPaying(true);
    setPaymentError("");
    try {
      const payment = checkout ?? (await accountPackageApi.subscribe(selectedPlan.id));
      // Reuse the created link if opening PayOS fails or the user returns without paying.
      setCheckouts((previous) => ({ ...previous, [selectedPlan.id]: payment }));
      if (!/^https?:\/\//i.test(payment.checkoutUrl)) {
        throw new Error("Đường dẫn thanh toán không hợp lệ.");
      }
      await savePreferredPackage(user.id, selectedPlan.id).catch(() => undefined);
      await Linking.openURL(payment.checkoutUrl);
    } catch (e) {
      setPaymentError(e instanceof Error ? e.message : "Không thể mở thanh toán gói tài khoản.");
    } finally {
      paymentInFlight.current = false;
      setPaying(false);
      setRevision((value) => value + 1);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-5 px-5 pb-10 pt-4">
        <ScreenHeader title="Gói tài khoản" />
        {loading ? <Spinner /> : null}
        {loadError ? (
          <View className="gap-2">
            <Typography.Paragraph className="text-danger">{loadError}</Typography.Paragraph>
            <Button
              variant="secondary"
              isDisabled={loading || paying}
              onPress={() => setRevision((value) => value + 1)}
            >
              <Button.Label>Tải lại gói tài khoản</Button.Label>
            </Button>
          </View>
        ) : !loading ? (
          <Card>
            <Card.Body className="gap-3">
              <Typography.Paragraph className="text-sm text-muted">
                Gói đang sử dụng
              </Typography.Paragraph>
              <Typography.Heading className="text-xl">
                {current?.planName ?? "Gói Cơ bản"}
              </Typography.Heading>
              {current ? (
                <>
                  <Typography.Paragraph className="font-semibold text-accent">
                    {formatPackagePrice(current.price)}
                  </Typography.Paragraph>
                  <Typography.Paragraph className="text-sm text-muted">
                    {formatDate(current.startDate)} – {formatDate(current.endDate)}
                  </Typography.Paragraph>
                </>
              ) : (
                <Typography.Paragraph className="text-sm text-muted">
                  Bạn chưa có gói bổ sung đang hiệu lực.
                </Typography.Paragraph>
              )}
              <PackageBenefit
                icon="box"
                text={currentPlan
                  ? `Tối đa ${currentPlan.maxActiveParcels} bưu kiện cùng lúc`
                  : current
                    ? "Thông tin hạn mức gói hiện tại chưa được cung cấp"
                    : "Hạn mức theo chính sách hiện hành của tủ"}
              />
              <PackageBenefit
                icon="clock"
                text="Thời gian lưu miễn phí theo chính sách tủ. Xem hạn nhận cụ thể trong chi tiết từng bưu kiện."
              />
            </Card.Body>
          </Card>
        ) : null}
        <PackagePicker
          plans={packages.plans}
          selectedId={selectedPlan?.id ?? null}
          onSelect={(id) => {
            setSelectedId(id);
            setPaymentError("");
          }}
          loading={packages.loading}
          error={packages.error}
          onRetry={packages.reload}
          disabled={paying}
        />
        {selectedPlan ? (
          <View className="gap-3">
            <Typography.Paragraph className="text-sm text-muted">
              Gói chỉ có hiệu lực sau khi hệ thống xác nhận thanh toán. Nếu đang có gói,
              gói mới bắt đầu sau khi thời hạn các gói đã thanh toán kết thúc.
            </Typography.Paragraph>
            {selectedPlan.price > 0 ? (
              <Button
                isDisabled={paying || loading || !!loadError || packages.loading}
                onPress={() => void pay()}
              >
                {paying ? <Spinner size="sm" color="current" /> : null}
                <Button.Label>
                  {paying ? "Đang mở thanh toán..." : checkout
                    ? "Mở lại thanh toán PayOS"
                    : `Đăng ký · ${formatPackagePrice(selectedPlan.price)}`}
                </Button.Label>
              </Button>
            ) : (
              <Typography.Paragraph className="text-sm text-muted">
                Gói miễn phí hiện chưa hỗ trợ kích hoạt trực tiếp. Bạn vẫn sử dụng gói hiện tại.
              </Typography.Paragraph>
            )}
          </View>
        ) : (
          <Typography.Paragraph className="text-sm text-muted">
            Gói Cơ bản là lựa chọn mặc định khi chưa có gói bổ sung. Chọn mục này không hủy hoặc thay đổi gói đang hiệu lực.
          </Typography.Paragraph>
        )}
        {paymentError ? (
          <Typography.Paragraph className="text-danger">{paymentError}</Typography.Paragraph>
        ) : null}
        {!loading && !loadError ? (
          <View className="gap-3">
            <View className="flex-row items-center gap-2">
              <Typography.Heading className="flex-1 text-lg">
                Lịch sử đăng ký gói
              </Typography.Heading>
              <Button
                size="sm"
                variant="ghost"
                isDisabled={paying}
                onPress={() => setRevision((value) => value + 1)}
              >
                <Button.Label>Cập nhật</Button.Label>
              </Button>
            </View>
            {history.length ? history.map((item) => (
              <Card key={item.id}>
                <Card.Body className="gap-2">
                  <Typography.Heading className="text-base">{item.planName}</Typography.Heading>
                  <Typography.Paragraph className="text-sm text-accent">
                    {statusLabel(item)}
                  </Typography.Paragraph>
                  <PackageBenefit icon="credit-card" text={formatPackagePrice(item.price)} />
                  {item.status !== "PendingPayment" ? (
                    <Typography.Paragraph className="text-sm text-muted">
                      {formatDate(item.startDate)} – {formatDate(item.endDate)}
                    </Typography.Paragraph>
                  ) : (
                    <Typography.Paragraph className="text-sm text-muted">
                      Chưa kích hoạt. Thời hạn được xác định sau khi xác nhận thanh toán.
                    </Typography.Paragraph>
                  )}
                </Card.Body>
              </Card>
            )) : (
              <Typography.Paragraph className="text-sm text-muted">
                Bạn chưa đăng ký gói bổ sung.
              </Typography.Paragraph>
            )}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
