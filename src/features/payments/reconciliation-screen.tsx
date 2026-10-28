import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  Button,
  Card,
  Input,
  Label,
  ListGroup,
  Skeleton,
  TextField,
  Typography,
} from "heroui-native";
import { useCallback, useRef, useState, type JSX } from "react";
import { AppState, ScrollView, View } from "react-native";
import { ActionError } from "@/components/ui/action-error";
import { ResidentFeed } from "@/components/ui/resident-feed";
import { ScreenHeader } from "@/components/ui/resident-ui";
import { SafeAreaView } from "@/components/ui/themed-safe-area-view";
import { useAuth } from "@/features/auth/auth-context";
import { useResidentFeed } from "@/features/navigation/use-resident-feed";
import { invalidateMobileData, useMobileDataRevision } from "@/features/notifications/data-sync";
import {
  reconciliationApi,
  reconciliationLabel,
  type PaymentKind,
  type PaymentLookup,
  type PaymentReconciliation,
} from "@/features/payments/reconciliation-api";

const date = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value)
  );
const guidance =
  "Giữ mã tra soát để theo dõi. Không thanh toán thêm khi kết quả giao dịch chưa rõ.";
const paymentLabels: Record<string, string> = {
  Success: "Đã thanh toán",
  Pending: "Chờ xác nhận",
  Failed: "Thất bại",
  Cancelled: "Đã hủy",
};

export function ReconciliationListScreen(): JSX.Element {
  const { user } = useAuth();
  return <ReconciliationListContent key={user?.id} />;
}

function ReconciliationListContent(): JSX.Element {
  const feed = useResidentFeed(reconciliationApi.list);
  const refreshFeed = feed.refresh;
  useFocusEffect(
    useCallback(() => {
      const subscription = AppState.addEventListener("change", (state) => {
        if (state === "active") refreshFeed();
      });
      return () => subscription.remove();
    }, [refreshFeed])
  );
  return (
    <ResidentFeed
      {...feed}
      onRefresh={feed.refresh}
      onLoadMore={feed.loadMore}
      onRetryMore={feed.retryMore}
      header={
        <>
          <ScreenHeader title="Tra soát thanh toán" />
          <Typography.Paragraph className="text-muted">{guidance}</Typography.Paragraph>
        </>
      }
      empty="Bạn chưa gửi yêu cầu tra soát. Mở giao dịch thanh toán hoặc lịch sử gói để gửi phản ánh."
      icon="receipt"
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ListGroup variant="transparent">
          <ListGroup.Item
            accessibilityRole="button"
            onPress={() =>
              router.push({ pathname: "/payment-reconciliations/[id]", params: { id: item.id } })
            }
          >
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>{item.reference}</ListGroup.ItemTitle>
              <ListGroup.ItemDescription>
                {reconciliationLabel(item.status)} · {date(item.updatedAt)}
              </ListGroup.ItemDescription>
              <Typography.Paragraph numberOfLines={2}>{item.reason}</Typography.Paragraph>
            </ListGroup.ItemContent>
          </ListGroup.Item>
        </ListGroup>
      )}
    />
  );
}

export function ReconciliationDetailScreen(): JSX.Element {
  const params = useLocalSearchParams<{ id?: string; kind?: string; paymentId?: string }>();
  const kind: PaymentKind | null =
    params.kind === "Subscription" || params.kind === "Overdue" ? params.kind : null;
  const caseId = params.id && params.id !== "new" ? params.id : null;
  const { user } = useAuth();
  const revision = useMobileDataRevision();
  const [item, setItem] = useState<PaymentReconciliation | null>(null);
  const [payment, setPayment] = useState<PaymentLookup | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const generation = useRef(0);
  const posting = useRef(false);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const lastContext = useRef<string | null>(null);
  const context = `${user?.id}:${caseId}:${kind}:${params.paymentId}`;
  const visible = loadedFor === context;

  useFocusEffect(
    useCallback(() => {
      // Both revisions intentionally trigger a fresh server read while focused.
      void revision;
      void refresh;
      let active = true;
      const token = ++generation.current;
      let pending = false;
      if (lastContext.current !== context) {
        setReason("");
        lastContext.current = context;
      }
      const load = async () => {
        if (!user || pending || posting.current) return;
        pending = true;
        try {
          let next: PaymentReconciliation | null = null;
          let transaction: PaymentLookup | null = null;
          if (caseId) {
            next = await reconciliationApi.get(caseId);
            transaction = await reconciliationApi.payment(next.kind, next.paymentId);
          } else if (kind && params.paymentId) {
            transaction = await reconciliationApi.payment(kind, params.paymentId);
            if (transaction.reconciliationId)
              next = await reconciliationApi.get(transaction.reconciliationId);
          } else
            throw new Error("Giao dịch tra soát không hợp lệ. Hãy mở lại từ lịch sử thanh toán.");
          if (!active || token !== generation.current) return;
          setLoadedFor(context);
          setPayment(transaction);
          setItem(next);
          setError("");
        } catch (failure) {
          if (active && token === generation.current) {
            setError(failure instanceof Error ? failure.message : "Không tải được hồ sơ tra soát.");
            // Stale payment state must not offer a new case for another route/account.
            setPayment(null);
          }
        } finally {
          pending = false;
          if (active && token === generation.current) setLoading(false);
        }
      };
      setLoading(true);
      void load();
      const subscription = AppState.addEventListener("change", (state) => {
        if (state === "active") void load();
      });
      const timer = setInterval(() => {
        if (AppState.currentState === "active") void load();
      }, 15000);
      return () => {
        active = false;
        generation.current++;
        clearInterval(timer);
        subscription.remove();
      };
    }, [user, caseId, kind, params.paymentId, context, revision, refresh])
  );

  const submit = async () => {
    if (
      !visible ||
      !payment ||
      item ||
      posting.current ||
      !reason.trim() ||
      reason.trim().length > 2000
    )
      return;
    posting.current = true;
    const token = generation.current;
    setSending(true);
    setError("");
    try {
      const next = await reconciliationApi.create(payment.kind, payment.id, reason.trim());
      if (token !== generation.current) return;
      setItem(next);
      router.replace({ pathname: "/payment-reconciliations/[id]", params: { id: next.id } });
      invalidateMobileData();
    } catch (failure) {
      if (token === generation.current)
        setError(
          `${failure instanceof Error ? failure.message : "Chưa gửi được yêu cầu."} Bạn có thể thử lại; cùng giao dịch sẽ dùng cùng một hồ sơ.`
        );
    } finally {
      posting.current = false;
      setSending(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-5 px-5 pb-10 pt-4"
      >
        <ScreenHeader title="Tra soát thanh toán" />
        {loading && !visible ? <Skeleton className="h-40 rounded-xl" /> : null}
        {visible && payment ? (
          <Card>
            <Card.Body className="gap-2">
              <Typography.Heading>
                {payment.kind === "Subscription"
                  ? "Thanh toán gói tài khoản"
                  : "Thanh toán phí quá hạn"}
              </Typography.Heading>
              <Typography.Paragraph>
                {new Intl.NumberFormat("vi-VN").format(payment.amount)} {payment.currency}
              </Typography.Paragraph>
              <Typography.Paragraph selectable>
                Mã đơn: {payment.orderCode ?? payment.id}
              </Typography.Paragraph>
              <Typography.Paragraph>
                Hệ thống: {paymentLabels[payment.status] ?? payment.status}
              </Typography.Paragraph>
            </Card.Body>
          </Card>
        ) : null}
        {visible && item ? (
          <>
            <Card>
              <Card.Body className="gap-3">
                <Typography.Heading selectable>{item.reference}</Typography.Heading>
                <Typography.Paragraph className="font-semibold text-link">
                  {reconciliationLabel(item.status)}
                </Typography.Paragraph>
                <Typography.Paragraph>{item.reason}</Typography.Paragraph>
                {item.response ? (
                  <Typography.Paragraph selectable>{item.response}</Typography.Paragraph>
                ) : null}
                <Typography.Paragraph className="text-muted">{item.nextStep}</Typography.Paragraph>
                {item.providerCheckedAt ? (
                  <Typography.Paragraph className="text-sm text-muted">
                    Đối chiếu gần nhất: {date(item.providerCheckedAt)}
                  </Typography.Paragraph>
                ) : null}
              </Card.Body>
            </Card>
            <Typography.Heading>Lịch sử xử lý</Typography.Heading>
            {item.history.map((entry) => (
              <View key={entry.id} className="gap-1 border-b border-separator pb-4">
                <Typography.Paragraph className="font-semibold">
                  {reconciliationLabel(entry.status)}
                </Typography.Paragraph>
                <Typography.Paragraph>{entry.message}</Typography.Paragraph>
                <Typography.Paragraph className="text-sm text-muted">
                  {date(entry.createdAt)}
                </Typography.Paragraph>
              </View>
            ))}
          </>
        ) : visible && payment && payment.amount > 0 && payment.orderCode ? (
          <>
            <TextField isRequired isDisabled={sending}>
              <Label>Nội dung cần đối chiếu</Label>
              <Input
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="min-h-28"
                maxLength={2000}
                value={reason}
                onChangeText={setReason}
                placeholder="Ví dụ: tài khoản đã trừ tiền nhưng giao dịch vẫn chờ xác nhận"
              />
            </TextField>
            <Button isDisabled={sending || loading || !reason.trim()} onPress={() => void submit()}>
              <Button.Label>{sending ? "Đang gửi..." : "Gửi yêu cầu tra soát"}</Button.Label>
            </Button>
          </>
        ) : null}
        <Typography.Paragraph className="text-muted">{guidance}</Typography.Paragraph>
        {error ? <ActionError message={error} /> : null}
        <Button
          variant="secondary"
          isDisabled={sending}
          onPress={() => setRefresh((value) => value + 1)}
        >
          <Button.Label>Cập nhật trạng thái</Button.Label>
        </Button>
        <Button variant="ghost" onPress={() => router.push("/payment-reconciliations")}>
          <Button.Label>Lịch sử tra soát của tôi</Button.Label>
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
