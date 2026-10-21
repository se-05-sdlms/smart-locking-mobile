import { ActionError } from "@/components/ui/action-error";
import * as Linking from "expo-linking";
import { useFocusEffect } from "expo-router";
import { Button, Skeleton, Spinner, Surface, Typography } from "heroui-native";
import type { JSX } from "react";
import { useCallback, useRef, useState } from "react";
import { Alert, FlatList, View } from "react-native";

import { ScreenHeader } from "@/components/ui/resident-ui";
import { SafeAreaView } from "@/components/ui/themed-safe-area-view";
import { accountPackageApi } from "@/features/account-packages/api";
import {
  PackageBenefit,
  PackagePicker,
  formatPackagePrice,
} from "@/features/account-packages/package-picker";
import {
  readPreferredPackage,
  readSubscriptionCheckout,
  savePreferredPackage,
  saveSubscriptionCheckout,
} from "@/features/account-packages/storage";
import type { ResidentSubscription, SubscriptionCheckout } from "@/features/account-packages/types";
import { usePackagePlans } from "@/features/account-packages/use-package-plans";
import { useAuth } from "@/features/auth/auth-context";
import { useMobileDataRevision } from "@/features/notifications/data-sync";

const formatDate = (value: string): string =>
  new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(value));

const confirmPrice = (previous: number, amount: number): Promise<boolean> => {
  if (previous === amount) return Promise.resolve(true);
  return new Promise((resolve) =>
    Alert.alert(
      "Xác nhận số tiền thanh toán",
      `Số tiền đã thay đổi từ ${formatPackagePrice(previous)} thành ${formatPackagePrice(amount)}. Bạn có muốn tiếp tục?`,
      [
        { text: "Để sau", style: "cancel", onPress: () => resolve(false) },
        { text: `Tiếp tục · ${formatPackagePrice(amount)}`, onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    )
  );
};

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

  useFocusEffect(
    useCallback(() => {
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
          const restored = await Promise.all(
            subscriptions
              .filter((item) => item.status === "PendingPayment")
              .map((item) => readSubscriptionCheckout(user.id, item.id))
          );
          if (!active || id !== request) return;
          setCurrent(subscription);
          setHistory(subscriptions);
          if (selectionLoadedFor.current !== user.id) {
            setSelectedId(preference);
            selectionLoadedFor.current = user.id;
          }
          setCheckouts((previous) => {
            const pending = Object.fromEntries(
              Object.entries(previous).filter(([subscriptionId]) =>
                subscriptions.some(
                  (item) => item.id === subscriptionId && item.status === "PendingPayment"
                )
              )
            );
            restored.forEach((payment) => {
              if (payment) pending[payment.subscriptionId] = payment;
            });
            return pending;
          });
        } catch (e) {
          if (active && id === request) {
            setLoadError(e instanceof Error ? e.message : "Không thể tải gói tài khoản.");
          }
        } finally {
          if (active && id === request) setLoading(false);
        }
      };
      void load();
      return () => {
        active = false;
      };
    }, [user, dataRevision, revision])
  );

  const currentPlan = packages.plans.find((plan) => plan.id === current?.planId);
  const selectedPlan = packages.plans.find((plan) => plan.id === selectedId);
  const selectedPending = history.find(
    (item) => item.planId === selectedId && item.status === "PendingPayment"
  );

  const activateFreePlan = async () => {
    if (!selectedPlan || selectedPlan.price !== 0 || !user || paymentInFlight.current) return;
    paymentInFlight.current = true;
    setPaying(true);
    setPaymentError("");
    try {
      await accountPackageApi.subscribe(selectedPlan.id);
      await savePreferredPackage(user.id, selectedPlan.id).catch(() => undefined);
    } catch (e) {
      setPaymentError(e instanceof Error ? e.message : "Không thể kích hoạt gói miễn phí.");
    } finally {
      paymentInFlight.current = false;
      setPaying(false);
      setRevision((value) => value + 1);
    }
  };

  const pay = async (
    planId = selectedPlan?.id,
    displayedAmount = selectedPending?.price ?? selectedPlan?.price,
    resumeSubscriptionId = selectedPending?.id
  ) => {
    if (!planId || displayedAmount === undefined || !user || paymentInFlight.current) return;
    paymentInFlight.current = true;
    setPaying(true);
    setPaymentError("");
    try {
      // Check server history before every POST, including after a previous ambiguous timeout.
      const [plans, subscriptions] = await Promise.all([
        packages.refresh(),
        accountPackageApi.getHistory(),
      ]);
      setHistory(subscriptions);
      const pending = subscriptions.find(
        (item) =>
          item.status === "PendingPayment" &&
          (resumeSubscriptionId ? item.id === resumeSubscriptionId : item.planId === planId)
      );
      let payment: SubscriptionCheckout;
      let expectedAmount = displayedAmount;
      if (pending) {
        const saved =
          checkouts[pending.id] ?? (await readSubscriptionCheckout(user.id, pending.id));
        if (!saved) {
          throw new Error(
            "Gói này đã có giao dịch chờ thanh toán. Hãy mở lại trên thiết bị đã tạo giao dịch hoặc liên hệ hỗ trợ để khôi phục liên kết. Không tạo thêm giao dịch mới."
          );
        }
        if (saved.amount !== pending.price) {
          throw new Error(
            "Số tiền giao dịch lưu trên thiết bị không khớp với hệ thống. Vui lòng liên hệ hỗ trợ."
          );
        }
        payment = saved;
      } else {
        if (resumeSubscriptionId) {
          throw new Error(
            "Giao dịch không còn chờ thanh toán. Hãy cập nhật để xem trạng thái mới nhất."
          );
        }
        const plan = plans.find((item) => item.id === planId);
        if (!plan || plan.price <= 0) {
          throw new Error("Gói không còn hỗ trợ đăng ký trả phí. Vui lòng chọn lại gói.");
        }
        if (!(await confirmPrice(displayedAmount, plan.price))) return;
        expectedAmount = plan.price;
        payment = await accountPackageApi.subscribe(plan.id);
      }
      setCheckouts((previous) => ({ ...previous, [payment.subscriptionId]: payment }));
      if (!/^https?:\/\//i.test(payment.checkoutUrl)) {
        throw new Error("Đường dẫn thanh toán không hợp lệ.");
      }
      if (!Number.isSafeInteger(payment.amount) || payment.amount <= 0) {
        throw new Error("Số tiền thanh toán không hợp lệ.");
      }
      // Persist before opening the provider; storage failure must not create another checkout.
      await saveSubscriptionCheckout(user.id, payment);
      if (!(await confirmPrice(expectedAmount, payment.amount))) return;
      await savePreferredPackage(user.id, planId).catch(() => undefined);
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
      <FlatList
        data={!loading && !loadError ? history : []}
        keyExtractor={(item) => item.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }}
        initialNumToRender={8}
        renderItem={({ item }) => (
          <View className="border-b border-separator py-4">
            <View className="gap-2">
              <Typography.Heading className="text-base">{item.planName}</Typography.Heading>
              <Typography.Paragraph className="text-sm text-link">
                {statusLabel(item)}
              </Typography.Paragraph>
              <PackageBenefit icon="credit-card" text={formatPackagePrice(item.price)} />
              {item.status !== "PendingPayment" ? (
                <Typography.Paragraph className="text-sm text-muted">
                  {formatDate(item.startDate)} – {formatDate(item.endDate)}
                </Typography.Paragraph>
              ) : (
                <>
                  <Typography.Paragraph className="text-sm text-muted">
                    Chưa kích hoạt. Thời hạn được xác định sau khi xác nhận thanh toán.
                  </Typography.Paragraph>
                  <Button
                    size="sm"
                    variant="secondary"
                    isDisabled={paying || packages.loading}
                    onPress={() => void pay(item.planId, item.price, item.id)}
                  >
                    <Button.Label>Mở lại thanh toán</Button.Label>
                  </Button>
                </>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          !loading && !loadError ? (
            <Typography.Paragraph className="py-5 text-muted">
              Bạn chưa đăng ký gói bổ sung.
            </Typography.Paragraph>
          ) : null
        }
        ListHeaderComponent={
          <View className="gap-5">
            <ScreenHeader title="Gói tài khoản" />
            {loading ? <Skeleton className="h-32 rounded-xl" /> : null}
            {loadError ? (
              <ActionError
                title="Không thể tải gói đang sử dụng"
                message={loadError}
                busy={loading || paying}
                onRetry={() => setRevision((value) => value + 1)}
              />
            ) : !loading ? (
              <Surface variant="secondary" className="gap-2 rounded-xl p-4">
                <Typography.Paragraph className="text-sm text-muted">
                  Gói đang sử dụng
                </Typography.Paragraph>
                <Typography.Heading className="text-xl">
                  {current?.planName ?? "Gói Cơ bản"}
                </Typography.Heading>
                {current ? (
                  <>
                    <Typography.Paragraph className="font-semibold text-link">
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
                  icon="package"
                  text={
                    currentPlan
                      ? `Tối đa ${currentPlan.maxActiveParcels} bưu kiện cùng lúc`
                      : current
                        ? "Thông tin hạn mức gói hiện tại chưa được cung cấp"
                        : "Hạn mức theo chính sách hiện hành của tủ"
                  }
                />
              </Surface>
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
                  Gói chỉ có hiệu lực sau khi hệ thống xác nhận thanh toán. Nếu đang có gói, gói mới
                  bắt đầu sau khi thời hạn các gói đã thanh toán kết thúc.
                </Typography.Paragraph>
                {selectedPlan.price > 0 || selectedPending ? (
                  <Button
                    isDisabled={paying || loading || !!loadError || packages.loading}
                    onPress={() => void pay()}
                  >
                    {paying ? <Spinner size="sm" color="current" /> : null}
                    <Button.Label>
                      {paying
                        ? "Đang mở thanh toán..."
                        : selectedPending
                          ? `Mở lại thanh toán · ${formatPackagePrice(selectedPending.price)}`
                          : `Đăng ký · ${formatPackagePrice(selectedPlan.price)}`}
                    </Button.Label>
                  </Button>
                ) : (
                  <Button
                    isDisabled={paying || loading || !!loadError || packages.loading}
                    onPress={() => void activateFreePlan()}
                  >
                    {paying ? <Spinner size="sm" color="current" /> : null}
                    <Button.Label>{paying ? "Đang kích hoạt..." : "Kích hoạt gói miễn phí"}</Button.Label>
                  </Button>
                )}
              </View>
            ) : (
              <Typography.Paragraph className="text-sm text-muted">
                Gói Cơ bản là lựa chọn mặc định khi chưa có gói bổ sung. Chọn mục này không hủy hoặc
                thay đổi gói đang hiệu lực.
              </Typography.Paragraph>
            )}
            {paymentError ? (
              <ActionError title="Chưa mở được thanh toán" message={paymentError} />
            ) : null}
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
          </View>
        }
      />
    </SafeAreaView>
  );
}
