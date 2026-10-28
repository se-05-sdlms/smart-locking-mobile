import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Button, Card, Input, Label, Spinner, TextField, Typography } from "heroui-native";
import type { JSX } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AppState, ScrollView, View } from "react-native";
import { AuthField } from "@/components/auth/auth-field";
import { ActionError } from "@/components/ui/action-error";
import { ResidentFeed } from "@/components/ui/resident-feed";
import { ResidentForm } from "@/components/ui/resident-form";
import { ScreenHeader } from "@/components/ui/resident-ui";
import { SafeAreaView } from "@/components/ui/themed-safe-area-view";
import { residentAccountApi } from "@/features/account/api";
import {
  accountChangesApi,
  changeStatus,
  type AccountChangeBlocker,
  type LockerChangeEligibility,
} from "@/features/account/changes-api";
import { authApi } from "@/features/auth/api";
import { useAuth } from "@/features/auth/auth-context";
import type { RegistrationLocker } from "@/features/auth/types";
import { useResidentFeed } from "@/features/navigation/use-resident-feed";
import { invalidateMobileData, useMobileDataRevision } from "@/features/notifications/data-sync";
import { ApiError } from "@/lib/api-client";

function failureMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "auth/invalid_credentials") return "Mật khẩu hiện tại chưa đúng.";
    if (error.code === "auth/invalid_otp")
      return "Mã OTP không đúng, đã dùng hoặc đã hết hạn. Hãy yêu cầu mã mới.";
    if (error.code === "sms/unavailable")
      return "Chưa gửi được SMS xác minh. Vui lòng thử lại khi dịch vụ hoạt động.";
    if (error.code === "account-change/phone-unavailable")
      return "Số điện thoại mới đã được sử dụng.";
    if (error.code === "account-change/pending")
      return "Bạn đã có yêu cầu cùng loại đang chờ. Mở lịch sử để xem hoặc hủy trước khi gửi yêu cầu khác.";
    if (error.code === "account-change/otp-cooldown")
      return "Vui lòng chờ một phút trước khi gửi lại OTP.";
    if (error.code === "account-change/otp-limit")
      return "Bạn đã yêu cầu quá nhiều OTP. Vui lòng thử lại sau.";
    if (error.status === 401)
      return "Phiên xác thực đã hết hiệu lực. Nếu đổi số đã được duyệt, hãy đăng nhập lại bằng số mới.";
  }
  return "Chưa xác nhận được kết quả do kết nối hoặc dịch vụ. Kiểm tra lịch sử trước khi gửi lại; tài khoản chỉ đổi khi máy chủ xác nhận.";
}
function date(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value)
  );
}
const blockerLabels: Record<string, string> = {
  Parcel:
    "Kiện hàng chưa hoàn tất lấy hàng/chuyển đến địa chỉ thu hồi của tủ, mã mở ngăn còn hiệu lực hoặc còn phí cần thanh toán.",
  Delivery:
    "Yêu cầu giao còn chờ duyệt, chưa hoàn tất hoặc ngăn/phiên mở cửa chưa được giải phóng.",
  Return: "Hàng gửi trả, chờ shipper lấy hoặc ngăn/phiên mở cửa chưa hoàn tất.",
  OverduePayment: "Thanh toán phí quá hạn đang chờ hoặc chưa rõ kết quả.",
  Subscription: "Gói có thanh toán chờ/chưa rõ kết quả hoặc cần tra soát quyền lợi đã mua.",
  Reconciliation: "Hồ sơ tra soát thanh toán chưa kết thúc.",
  Locker: "Tủ đích chưa đủ điều kiện đăng ký hoặc trùng với tủ hiện tại.",
  PhoneVerification: "Số mới cần xác minh lại hoặc đã được tài khoản khác sử dụng.",
  Account: "Thông tin tài khoản đã đổi sau lúc gửi yêu cầu. Hủy và tạo yêu cầu mới.",
  AccessSession:
    "Phiên mở ngăn chưa xác nhận đóng. Hãy liên hệ nhân viên vận hành để xác nhận trạng thái ngăn.",
};
function openBlocker(blocker: AccountChangeBlocker): void {
  if (blocker.kind === "Parcel")
    router.push({ pathname: "/parcels/[id]", params: { id: blocker.id } });
  else if (blocker.kind === "Delivery")
    router.push({ pathname: "/delivery-requests/[id]", params: { id: blocker.id } });
  else if (blocker.kind === "Return")
    router.push({ pathname: "/returns/[id]", params: { id: blocker.id } });
  else if (blocker.kind === "OverduePayment")
    router.push({ pathname: "/payments/[id]", params: { id: blocker.id } });
  else if (blocker.kind === "Subscription") router.push("/account-package");
  else if (blocker.kind === "Reconciliation")
    router.push({ pathname: "/payment-reconciliations/[id]", params: { id: blocker.id } });
}
function Blockers({ items }: { items: AccountChangeBlocker[] }): JSX.Element {
  return (
    <View className="gap-3">
      {items.map((item, index) => (
        <Card key={`${item.kind}-${item.id}-${index}`}>
          <Card.Body className="gap-2">
            <Typography.Paragraph>{blockerLabels[item.kind] ?? item.message}</Typography.Paragraph>
            <Typography.Paragraph className="text-xs text-muted" selectable>
              Mã hồ sơ: {item.id}
            </Typography.Paragraph>
            {[
              "Parcel",
              "Delivery",
              "Return",
              "OverduePayment",
              "Subscription",
              "Reconciliation",
            ].includes(item.kind) ? (
              <Button variant="secondary" onPress={() => openBlocker(item)}>
                <Button.Label>Mở hồ sơ cần xử lý</Button.Label>
              </Button>
            ) : null}
          </Card.Body>
        </Card>
      ))}
    </View>
  );
}
function useRefresh<T>(fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const generation = useRef(0),
    pending = useRef(false);
  const revision = useMobileDataRevision();
  const load = useCallback(async () => {
    if (pending.current) return;
    pending.current = true;
    const token = ++generation.current;
    setLoading(true);
    setError("");
    try {
      const value = await fetcher();
      if (token === generation.current) setData(value);
    } catch (error) {
      if (token === generation.current) setError(failureMessage(error));
    } finally {
      if (token === generation.current) {
        pending.current = false;
        setLoading(false);
      }
    }
  }, [fetcher]);
  useFocusEffect(
    useCallback(() => {
      void revision;
      void load();
      const timer = setInterval(() => {
        if (AppState.currentState === "active") void load();
      }, 15000);
      const subscription = AppState.addEventListener("change", (state) => {
        if (state === "active") void load();
      });
      return () => {
        clearInterval(timer);
        subscription.remove();
        generation.current++;
        pending.current = false;
      };
    }, [load, revision])
  );
  const apply = useCallback((value: T) => {
    // A confirmed mutation supersedes any older refresh still in flight.
    generation.current++;
    pending.current = false;
    setData(value);
    setError("");
    setLoading(false);
  }, []);
  return { data, error, loading, load, apply };
}

export function AccountChangesScreen(): JSX.Element {
  const { user } = useAuth();
  return <ChangesList key={user?.id ?? "signed-out"} />;
}
function ChangesList(): JSX.Element {
  const feed = useResidentFeed(accountChangesApi.list);
  const refresh = feed.refresh;
  useFocusEffect(
    useCallback(() => {
      const timer = setInterval(() => {
        if (AppState.currentState === "active") refresh();
      }, 15000);
      const listener = AppState.addEventListener("change", (state) => {
        if (state === "active") refresh();
      });
      return () => {
        clearInterval(timer);
        listener.remove();
      };
    }, [refresh])
  );
  return (
    <ResidentFeed
      {...feed}
      onRefresh={feed.refresh}
      onLoadMore={feed.loadMore}
      onRetryMore={feed.retryMore}
      header={
        <>
          <ScreenHeader title="Thay đổi tài khoản" />
          <Typography.Paragraph className="text-muted">
            Đổi tủ hoặc số điện thoại cần quản trị viên duyệt. Hồ sơ và quyền lợi đã mua được giữ
            nguyên.
          </Typography.Paragraph>
          <Button onPress={() => router.push("/account-changes/new")}>
            <Button.Label>Tạo yêu cầu thay đổi</Button.Label>
          </Button>
        </>
      }
      empty="Bạn chưa gửi yêu cầu thay đổi tài khoản."
      icon="user"
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Card className="mb-3">
          <Card.Body className="gap-2">
            <Typography.Heading className="text-base">
              {item.kind === "Locker"
                ? `Đổi tủ · ${item.targetLockerCode ?? "Tủ đích"}`
                : `Đổi số · ${item.newPhoneNumber}`}
            </Typography.Heading>
            <Typography.Paragraph>{changeStatus[item.status]}</Typography.Paragraph>
            <Typography.Paragraph className="text-sm text-muted">
              {date(item.updatedAt)}
            </Typography.Paragraph>
            <Button
              variant="secondary"
              onPress={() =>
                router.push({ pathname: "/account-changes/[id]", params: { id: item.id } })
              }
            >
              <Button.Label>Xem yêu cầu</Button.Label>
            </Button>
          </Card.Body>
        </Card>
      )}
    />
  );
}

export function NewAccountChangeScreen(): JSX.Element {
  const { user } = useAuth();
  return <NewChange key={user?.id ?? "signed-out"} />;
}
function NewChange(): JSX.Element {
  const fetchOptions = useCallback(async () => {
    const [lockers, profile] = await Promise.all([
      authApi.getRegistrationLockers(),
      residentAccountApi.get(),
    ]);
    return {
      lockers: lockers.filter((locker) => locker.id !== profile.registeredLockerId),
      profile,
    };
  }, []);
  const options = useRefresh(fetchOptions);
  const [kind, setKind] = useState<"Locker" | "Phone">("Locker");
  const [target, setTarget] = useState<RegistrationLocker | null>(null);
  const [eligibility, setEligibility] = useState<LockerChangeEligibility | null>(null);
  const [checking, setChecking] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const pending = useRef(false),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!target || kind !== "Locker") return;
    let active = true;
    void Promise.resolve().then(async () => {
      if (!active) return;
      setEligibility(null);
      setChecking(true);
      try {
        const value = await accountChangesApi.eligibility(target.id);
        if (active) setEligibility(value);
      } catch (error) {
        if (active) setError(failureMessage(error));
      } finally {
        if (active) setChecking(false);
      }
    });
    return () => {
      active = false;
    };
  }, [target, options.data, kind]);
  const currentEligibility =
    eligibility?.targetLockerId === target?.id &&
    options.data?.lockers.some((locker) => locker.id === target?.id)
      ? eligibility
      : null;
  const validPhone = /^0[0-9]{9}$/.test(phone.trim());
  const remaining = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
  const send = async (sendOtp: boolean) => {
    if (pending.current) return;
    if (kind === "Phone" && (!validPhone || !password)) {
      setError("Nhập số mới gồm 10 chữ số bắt đầu bằng 0 và mật khẩu hiện tại.");
      return;
    }
    if (
      !sendOtp &&
      (!reason.trim() || (kind === "Phone" && (!otpRequested || !/^\d{6}$/.test(otp))))
    ) {
      setError(
        kind === "Phone" ? "Nhập lý do và mã OTP 6 chữ số đã gửi tới số mới." : "Nhập lý do đổi tủ."
      );
      return;
    }
    if (
      !sendOtp &&
      kind === "Locker" &&
      (!target || checking || !currentEligibility || options.error)
    ) {
      setError("Chọn tủ đích và tải điều kiện trước khi gửi.");
      return;
    }
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      if (sendOtp) {
        await accountChangesApi.requestOtp(phone.trim(), password);
        if (!mounted.current) return;
        setOtpRequested(true);
        setOtp("");
        setCooldownUntil(Date.now() + 60000);
      } else {
        const item =
          kind === "Locker"
            ? await accountChangesApi.locker(target!.id, reason.trim())
            : await accountChangesApi.phone(phone.trim(), password, otp, reason.trim());
        if (!mounted.current) return;
        setPassword("");
        setOtp("");
        invalidateMobileData();
        router.replace({ pathname: "/account-changes/[id]", params: { id: item.id } });
      }
    } catch (error) {
      if (mounted.current) setError(failureMessage(error));
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ResidentForm>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="gap-4 px-5 pb-8 pt-4"
        >
          <ScreenHeader title="Tạo yêu cầu thay đổi" />
          <View className="flex-row gap-3">
            {(["Locker", "Phone"] as const).map((value) => (
              <Button
                key={value}
                className="flex-1"
                variant={kind === value ? "primary" : "secondary"}
                isDisabled={busy}
                onPress={() => {
                  setKind(value);
                  setError("");
                }}
              >
                <Button.Label>{value === "Locker" ? "Đổi tủ" : "Đổi số"}</Button.Label>
              </Button>
            ))}
          </View>
          <Typography.Paragraph className="text-muted">
            Tài khoản chỉ thay đổi sau khi quản trị viên duyệt. Không tự chuyển hàng hoặc mua lại
            gói.
          </Typography.Paragraph>
          {kind === "Locker" ? (
            <>
              <Typography.Heading className="text-lg">Chọn tủ đích</Typography.Heading>
              {options.loading && !options.data ? <Spinner /> : null}
              {options.error ? (
                <ActionError message={options.error} onRetry={() => void options.load()} />
              ) : null}
              {options.data?.lockers.length === 0 ? (
                <Typography.Paragraph>Chưa có tủ khác đủ điều kiện đăng ký.</Typography.Paragraph>
              ) : null}
              {options.data?.lockers.map((locker) => (
                <Button
                  key={locker.id}
                  variant={target?.id === locker.id ? "primary" : "secondary"}
                  isDisabled={busy || Boolean(options.error)}
                  onPress={() => {
                    if (target?.id === locker.id) return;
                    setTarget(locker);
                    setEligibility(null);
                    setChecking(true);
                    setError("");
                  }}
                >
                  <Button.Label>
                    {locker.code} · {locker.address}
                  </Button.Label>
                </Button>
              ))}
              {checking ? <Spinner /> : null}
              {currentEligibility ? (
                <>
                  <Typography.Paragraph>
                    {currentEligibility.canApply
                      ? "Hiện đủ điều kiện. Máy chủ sẽ kiểm tra lại lúc duyệt."
                      : "Các hồ sơ dưới đây cần được giải quyết trước khi quản trị viên có thể áp dụng."}
                  </Typography.Paragraph>
                  <Blockers items={currentEligibility.blockers} />
                </>
              ) : null}
            </>
          ) : (
            <>
              <AuthField
                label="Số điện thoại mới"
                icon="phone"
                value={phone}
                maxLength={10}
                keyboardType="phone-pad"
                editable={!busy}
                onChangeText={(value) => {
                  setPhone(value.replace(/\D/g, ""));
                  setOtpRequested(false);
                  setOtp("");
                }}
              />
              <AuthField
                label="Mật khẩu hiện tại"
                icon="lock"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                editable={!busy}
                autoComplete="current-password"
              />
              <Button
                variant="secondary"
                isDisabled={busy || !validPhone || !password || remaining > 0}
                onPress={() => void send(true)}
              >
                <Button.Label>
                  {remaining ? `Gửi lại sau ${remaining}s` : "Gửi OTP tới số mới"}
                </Button.Label>
              </Button>
              {otpRequested ? (
                <>
                  <Typography.Paragraph className="text-muted">
                    Đã gửi yêu cầu SMS. Mã có hiệu lực 10 phút; yêu cầu vẫn cần quản trị viên duyệt
                    trong 24 giờ sau xác minh.
                  </Typography.Paragraph>
                  <AuthField
                    label="OTP số điện thoại mới"
                    icon="lock"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={otp}
                    onChangeText={(value) => setOtp(value.replace(/\D/g, ""))}
                    editable={!busy}
                    autoComplete="sms-otp"
                  />
                </>
              ) : null}
              <Typography.Paragraph className="text-muted">
                Khi được duyệt, phiên đăng nhập cũ sẽ hết hiệu lực. Hãy đăng nhập lại bằng số mới;
                thông báo và tài khoản vẫn thuộc về bạn. Hàng đang giao/giữ trong tủ, hàng gửi trả
                và mã mở tủ còn hiệu lực cần hoàn tất trước khi áp dụng số mới.
              </Typography.Paragraph>
            </>
          )}
          <TextField>
            <Label>Lý do thay đổi</Label>
            <Input
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={2000}
              value={reason}
              onChangeText={setReason}
              editable={!busy}
            />
          </TextField>
          {error ? <ActionError message={error} /> : null}
          <Button
            isDisabled={
              busy ||
              !reason.trim() ||
              (kind === "Locker"
                ? !currentEligibility || checking || Boolean(options.error)
                : !otpRequested || otp.length !== 6)
            }
            onPress={() => void send(false)}
          >
            <Button.Label>{busy ? "Đang gửi..." : "Gửi quản trị viên"}</Button.Label>
          </Button>
          <Button variant="tertiary" onPress={() => router.push("/account-changes")}>
            <Button.Label>Kiểm tra yêu cầu đã gửi</Button.Label>
          </Button>
        </ScrollView>
      </ResidentForm>
    </SafeAreaView>
  );
}

export function AccountChangeDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  return <ChangeDetail key={`${user?.id}:${id}`} id={id} />;
}
function ChangeDetail({ id }: { id: string }): JSX.Element {
  const fetcher = useCallback(() => accountChangesApi.get(id), [id]);
  const detail = useRefresh(fetcher);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const pending = useRef(false),
    notified = useRef(false),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const item = detail.data;
  useEffect(() => {
    if (item?.status === "Applied" && !notified.current) {
      notified.current = true;
      invalidateMobileData();
    }
  }, [item?.status]);
  const cancel = async () => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const updated = await accountChangesApi.cancel(id);
      if (mounted.current) {
        detail.apply(updated);
        invalidateMobileData();
      }
    } catch (error) {
      if (mounted.current) setError(failureMessage(error));
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-4 px-5 pb-8 pt-4">
        <ScreenHeader title="Chi tiết yêu cầu" />
        {detail.loading && !item ? <Spinner /> : null}
        {detail.error ? (
          <ActionError message={detail.error} onRetry={() => void detail.load()} />
        ) : null}
        {item ? (
          <>
            <Typography.Heading className="text-xl">
              {item.kind === "Locker" ? "Đổi tủ đăng ký" : "Đổi số điện thoại"}
            </Typography.Heading>
            <Typography.Paragraph>{changeStatus[item.status]}</Typography.Paragraph>
            <Typography.Paragraph>
              {item.kind === "Locker"
                ? `Tủ đích: ${item.targetLockerCode ?? item.targetLockerId}`
                : `Số mới: ${item.newPhoneNumber}`}
            </Typography.Paragraph>
            <Typography.Paragraph selectable>Mã yêu cầu: {item.id}</Typography.Paragraph>
            <Typography.Paragraph>Đã gửi: {date(item.createdAt)}</Typography.Paragraph>
            <Typography.Paragraph>Lý do: {item.reason}</Typography.Paragraph>
            {item.reviewReason ? (
              <Typography.Paragraph>Quản trị viên: {item.reviewReason}</Typography.Paragraph>
            ) : null}
            {item.appliedAt ? (
              <Typography.Paragraph>Hiệu lực từ: {date(item.appliedAt)}</Typography.Paragraph>
            ) : null}
            <Typography.Paragraph className="text-muted">
              Đổi tủ không chuyển vị trí hàng. Quyền lợi đã mua và hồ sơ cũ được giữ nguyên.
            </Typography.Paragraph>
            {item.kind === "Phone" && item.phoneVerificationExpiresAt ? (
              <Typography.Paragraph className="text-muted">
                Xác minh số mới dùng để duyệt đến: {date(item.phoneVerificationExpiresAt)}. Nếu hết
                hạn, mở tạo yêu cầu và xác minh lại cùng số để gia hạn yêu cầu đang chờ.
              </Typography.Paragraph>
            ) : null}
            {item.kind === "Phone" ? (
              <Typography.Paragraph className="text-muted">
                Sau khi áp dụng, hãy đăng nhập lại bằng số mới nếu phiên hiện tại kết thúc.
              </Typography.Paragraph>
            ) : null}
            <Blockers items={item.blockers} />
            {item.status === "Submitted" ? (
              <Button
                variant="danger-soft"
                isDisabled={busy || detail.loading || Boolean(detail.error)}
                onPress={() =>
                  Alert.alert("Hủy yêu cầu?", "Thông tin tài khoản hiện tại được giữ nguyên.", [
                    { text: "Giữ yêu cầu", style: "cancel" },
                    { text: "Hủy yêu cầu", style: "destructive", onPress: () => void cancel() },
                  ])
                }
              >
                <Button.Label>{busy ? "Đang hủy..." : "Hủy yêu cầu"}</Button.Label>
              </Button>
            ) : null}
            <Typography.Heading className="text-lg">Lịch sử xử lý</Typography.Heading>
            {item.history.map((event) => (
              <Card key={event.id}>
                <Card.Body className="gap-1">
                  <Typography.Paragraph>
                    {(
                      {
                        Submitted: "Đã gửi yêu cầu",
                        PhoneReverified: "Đã xác minh lại số mới",
                        ApprovalBlocked: "Chưa đủ điều kiện duyệt",
                        Applied: "Đã áp dụng",
                        Rejected: "Đã từ chối",
                        Cancelled: "Đã hủy",
                      } as Record<string, string>
                    )[event.action] ?? event.action}
                  </Typography.Paragraph>
                  <Typography.Paragraph className="text-sm text-muted">
                    {date(event.createdAt)}
                  </Typography.Paragraph>
                  {["ApprovalBlocked", "Applied", "Rejected"].includes(event.action) ? (
                    <Typography.Paragraph>{event.message}</Typography.Paragraph>
                  ) : null}
                </Card.Body>
              </Card>
            ))}
          </>
        ) : null}
        {error ? <ActionError message={error} /> : null}
        <Button
          variant="secondary"
          isDisabled={detail.loading || busy}
          onPress={() => void detail.load()}
        >
          <Button.Label>Cập nhật kết quả</Button.Label>
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
