import { router, useLocalSearchParams } from "expo-router";
import { Button, Checkbox, InputOTP, Label, LinkButton, Select, Typography } from "heroui-native";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { AuthField } from "@/components/auth/auth-field";
import { AuthScreen } from "@/components/auth/auth-screen";
import { GravityIcon } from "@/components/icons/gravity-icon";
import { authApi } from "@/features/auth/api";
import { useAuth } from "@/features/auth/auth-context";
import type { RegistrationLocker } from "@/features/auth/types";

const normalizePhone = (value: string): string => value.replace(/\s/g, "");
const isValidPhone = (value: string): boolean => /^0\d{9}$/.test(normalizePhone(value));
const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Đã xảy ra lỗi. Vui lòng thử lại.";

export function WelcomeScreen(): JSX.Element {
  return (
    <AuthScreen
      title="Nhận hàng an tâm cùng Boxora"
      description="Theo dõi bưu kiện, mở tủ và quản lý đơn giao ngay trên điện thoại."
    >
      <View className="gap-3">
        <Button size="lg" onPress={() => router.push("/login")}>
          <Button.Label>Đăng nhập</Button.Label>
          <GravityIcon name="arrow-right" tone="accent-foreground" />
        </Button>
        <Button size="lg" variant="secondary" onPress={() => router.push("/register")}>
          <Button.Label>Tạo tài khoản cư dân</Button.Label>
        </Button>
      </View>
    </AuthScreen>
  );
}

export function LoginScreen(): JSX.Element {
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(): Promise<void> {
    if (!isValidPhone(phone) || password.length < 8) {
      setError("Vui lòng nhập số điện thoại hợp lệ và mật khẩu từ 8 ký tự.");
      return;
    }

    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      await login(normalizePhone(phone), password);
      setMessage("Đăng nhập thành công.");
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScreen
      canGoBack
      title="Chào mừng trở lại"
      description="Đăng nhập để quản lý và nhận bưu kiện của bạn."
    >
      <View className="gap-4">
        <AuthField
          label="Số điện thoại"
          icon="phone"
          placeholder="0912 345 678"
          keyboardType="phone-pad"
          autoCapitalize="none"
          autoComplete="tel"
          returnKeyType="next"
          value={phone}
          onChangeText={setPhone}
          error={phone && !isValidPhone(phone) ? "Số điện thoại phải gồm 10 chữ số." : undefined}
        />
        <AuthField
          label="Mật khẩu"
          icon="lock"
          placeholder="Nhập mật khẩu"
          secureTextEntry
          autoComplete="current-password"
          returnKeyType="done"
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={() => void submit()}
          error={password && password.length < 8 ? "Mật khẩu phải có ít nhất 8 ký tự." : undefined}
        />
        <View className="-mt-1 flex-row justify-end">
          <LinkButton onPress={() => router.push("/forgot-password")}>Quên mật khẩu?</LinkButton>
        </View>
        {error ? (
          <Typography.Paragraph className="text-sm text-danger">{error}</Typography.Paragraph>
        ) : null}
        {message ? (
          <Typography.Paragraph className="text-sm text-success">{message}</Typography.Paragraph>
        ) : null}
        <Button size="lg" className="mt-1" isDisabled={submitting} onPress={() => void submit()}>
          <Button.Label>{submitting ? "Đang đăng nhập..." : "Đăng nhập"}</Button.Label>
          {!submitting && <GravityIcon name="arrow-right" tone="accent-foreground" />}
        </Button>
        <View className="mt-1 flex-row items-center justify-center gap-1">
          <Typography.Paragraph className="text-muted">Chưa có tài khoản?</Typography.Paragraph>
          <LinkButton onPress={() => router.push("/register")}>Đăng ký</LinkButton>
        </View>
      </View>
    </AuthScreen>
  );
}

export function RegisterScreen(): JSX.Element {
  const { setPendingRegistration } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [lockers, setLockers] = useState<RegistrationLocker[]>([]);
  const [locker, setLocker] = useState<{ value: string; label: string }>();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void authApi
      .getRegistrationLockers()
      .then(setLockers)
      .catch((loadError: unknown) => setError(getErrorMessage(loadError)));
  }, []);

  async function submit(): Promise<void> {
    if (fullName.trim().length < 2 || !isValidPhone(phone) || password.length < 8 || !locker) {
      setError("Vui lòng kiểm tra lại thông tin đăng ký.");
      return;
    }
    if (password !== confirmation) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const phoneNumber = normalizePhone(phone);
      await authApi.requestRegistrationOtp(phoneNumber);
      setPendingRegistration({
        phoneNumber,
        password,
        fullName: fullName.trim(),
        registeredLockerId: locker.value,
      });
      router.push({ pathname: "/verify-otp", params: { phone: phoneNumber, flow: "register" } });
    } catch (submitError) {
      setError(getErrorMessage(submitError));
      setSubmitting(false);
    }
  }

  return (
    <AuthScreen
      canGoBack
      title="Tạo tài khoản cư dân"
      description="Đăng ký bằng số điện thoại của bạn."
    >
      <View className="gap-4">
        <AuthField
          label="Họ và tên"
          icon="user"
          placeholder="Nguyễn Minh Anh"
          autoComplete="name"
          returnKeyType="next"
          value={fullName}
          onChangeText={setFullName}
          error={fullName && fullName.trim().length < 2 ? "Vui lòng nhập họ và tên." : undefined}
        />
        <AuthField
          label="Số điện thoại"
          icon="phone"
          placeholder="0912 345 678"
          keyboardType="phone-pad"
          autoCapitalize="none"
          autoComplete="tel"
          returnKeyType="next"
          value={phone}
          onChangeText={setPhone}
          error={phone && !isValidPhone(phone) ? "Số điện thoại phải gồm 10 chữ số." : undefined}
        />
        <AuthField
          label="Mật khẩu"
          icon="lock"
          placeholder="Tối thiểu 8 ký tự"
          secureTextEntry
          autoComplete="new-password"
          returnKeyType="next"
          value={password}
          onChangeText={setPassword}
          error={password && password.length < 8 ? "Mật khẩu phải có ít nhất 8 ký tự." : undefined}
        />
        <AuthField
          label="Xác nhận mật khẩu"
          icon="lock"
          placeholder="Nhập lại mật khẩu"
          secureTextEntry
          autoComplete="new-password"
          returnKeyType="done"
          value={confirmation}
          onChangeText={setConfirmation}
          error={
            confirmation && confirmation !== password ? "Mật khẩu xác nhận không khớp." : undefined
          }
        />
        <View className="gap-1">
          <Label className="font-medium">Locker đăng ký</Label>
          <Select presentation="bottom-sheet" value={locker} onValueChange={setLocker}>
            <Select.Trigger className="h-14 w-full rounded-2xl border border-border bg-field">
              <Select.Value
                placeholder={lockers.length ? "Chọn locker gần bạn" : "Đang tải locker..."}
              />
              <Select.TriggerIndicator />
            </Select.Trigger>
            <Select.Portal>
              <Select.Overlay />
              <Select.Content presentation="bottom-sheet">
                {lockers.map((item) => (
                  <Select.Item
                    key={item.id}
                    value={item.id}
                    label={`${item.code} · ${item.address}`}
                  >
                    <Select.ItemLabel />
                    <Select.ItemDescription>{item.address}</Select.ItemDescription>
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Portal>
          </Select>
        </View>
        <Checkbox className="items-start" isSelected={accepted} onSelectedChange={setAccepted}>
          <Checkbox.Indicator />
          <Typography.Paragraph className="flex-1">
            Tôi đồng ý với điều khoản sử dụng và chính sách bảo mật
          </Typography.Paragraph>
        </Checkbox>
        {error ? (
          <Typography.Paragraph className="text-sm text-danger">{error}</Typography.Paragraph>
        ) : null}
        <Button size="lg" isDisabled={!accepted || submitting} onPress={() => void submit()}>
          <Button.Label>{submitting ? "Đang tạo tài khoản..." : "Đăng ký"}</Button.Label>
        </Button>
        <View className="flex-row items-center justify-center gap-1">
          <Typography.Paragraph className="text-muted">Đã có tài khoản?</Typography.Paragraph>
          <LinkButton onPress={() => router.replace("/login")}>Đăng nhập</LinkButton>
        </View>
      </View>
    </AuthScreen>
  );
}

export function VerifyOtpScreen(): JSX.Element {
  const { pendingRegistration, register, setPendingReset } = useAuth();
  const { phone = "số điện thoại của bạn", flow } = useLocalSearchParams<{
    phone?: string;
    flow?: string;
  }>();
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(): Promise<void> {
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      if (flow === "reset") {
        setPendingReset({ phoneNumber: String(phone), otpCode: otp });
        router.replace("/reset-password");
      } else {
        if (!pendingRegistration)
          throw new Error("Thông tin đăng ký đã hết hạn. Vui lòng đăng ký lại.");
        await register(otp);
        setMessage("Đăng ký thành công.");
      }
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  async function resend(): Promise<void> {
    setError("");
    try {
      if (flow === "reset") await authApi.forgotPassword(String(phone));
      else await authApi.requestRegistrationOtp(String(phone));
      setMessage("Mã xác thực mới đã được gửi.");
    } catch (resendError) {
      setError(getErrorMessage(resendError));
    }
  }

  return (
    <AuthScreen canGoBack title="Xác thực SĐT" description={`Nhập mã đã được gửi đến ${phone}.`}>
      <View className="items-center gap-7">
        <InputOTP
          maxLength={6}
          value={otp}
          onChange={setOtp}
          inputMode="numeric"
          textInputProps={{ accessibilityLabel: "Mã xác thực 6 chữ số" }}
        >
          <InputOTP.Group>
            {Array.from({ length: 6 }, (_, index) => (
              <InputOTP.Slot key={index} index={index} />
            ))}
          </InputOTP.Group>
        </InputOTP>
        {error ? (
          <Typography.Paragraph className="text-sm text-danger">{error}</Typography.Paragraph>
        ) : null}
        {message ? (
          <Typography.Paragraph className="text-sm text-success">{message}</Typography.Paragraph>
        ) : null}
        <View className="items-center gap-1">
          <Typography.Paragraph className="text-muted">Bạn chưa nhận được mã?</Typography.Paragraph>
          <LinkButton onPress={() => void resend()}>Gửi lại mã</LinkButton>
        </View>
        <Button
          className="w-full"
          size="lg"
          isDisabled={otp.length !== 6 || submitting}
          onPress={() => void submit()}
        >
          <Button.Label>{submitting ? "Đang xác thực..." : "Xác nhận"}</Button.Label>
        </Button>
      </View>
    </AuthScreen>
  );
}

export function ForgotPasswordScreen(): JSX.Element {
  const { setPendingReset } = useAuth();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(): Promise<void> {
    if (!isValidPhone(phone)) return;
    setSubmitting(true);
    setError("");
    try {
      const phoneNumber = normalizePhone(phone);
      await authApi.forgotPassword(phoneNumber);
      setPendingReset({ phoneNumber });
      router.push({ pathname: "/verify-otp", params: { phone: phoneNumber, flow: "reset" } });
    } catch (submitError) {
      setError(getErrorMessage(submitError));
      setSubmitting(false);
    }
  }

  return (
    <AuthScreen
      canGoBack
      title="Quên mật khẩu?"
      description="Nhập số điện thoại để nhận mã xác thực gồm 6 chữ số."
    >
      <View className="gap-6">
        <AuthField
          label="Số điện thoại"
          icon="phone"
          placeholder="0912 345 678"
          keyboardType="phone-pad"
          autoCapitalize="none"
          autoComplete="tel"
          returnKeyType="done"
          value={phone}
          onChangeText={setPhone}
          onSubmitEditing={() => void submit()}
          error={phone && !isValidPhone(phone) ? "Số điện thoại phải gồm 10 chữ số." : undefined}
        />
        {error ? (
          <Typography.Paragraph className="text-sm text-danger">{error}</Typography.Paragraph>
        ) : null}
        <Button
          size="lg"
          isDisabled={!isValidPhone(phone) || submitting}
          onPress={() => void submit()}
        >
          <Button.Label>{submitting ? "Đang gửi mã..." : "Gửi mã xác thực"}</Button.Label>
        </Button>
      </View>
    </AuthScreen>
  );
}

export function ResetPasswordScreen(): JSX.Element {
  const { pendingReset, setPendingReset } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(): Promise<void> {
    if (password.length < 8 || password !== confirmation) return;
    if (!pendingReset?.otpCode) {
      setError("Phiên đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu mã mới.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await authApi.resetPassword(pendingReset.phoneNumber, pendingReset.otpCode, password);
      setPendingReset(null);
      setMessage("Đổi mật khẩu thành công.");
      router.replace("/login");
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScreen
      canGoBack
      title="Tạo mật khẩu mới"
      description="Mật khẩu mới phải có ít nhất 8 ký tự."
    >
      <View className="gap-5">
        <AuthField
          label="Mật khẩu mới"
          icon="lock"
          placeholder="Tối thiểu 8 ký tự"
          secureTextEntry
          autoComplete="new-password"
          returnKeyType="next"
          value={password}
          onChangeText={setPassword}
          error={password && password.length < 8 ? "Mật khẩu phải có ít nhất 8 ký tự." : undefined}
        />
        <AuthField
          label="Xác nhận mật khẩu"
          icon="lock"
          placeholder="Nhập lại mật khẩu"
          secureTextEntry
          autoComplete="new-password"
          returnKeyType="done"
          value={confirmation}
          onChangeText={setConfirmation}
          onSubmitEditing={() => void submit()}
          error={
            confirmation && confirmation !== password ? "Mật khẩu xác nhận không khớp." : undefined
          }
        />
        {message ? (
          <Typography.Paragraph className="text-sm text-success">{message}</Typography.Paragraph>
        ) : null}
        {error ? (
          <Typography.Paragraph className="text-sm text-danger">{error}</Typography.Paragraph>
        ) : null}
        <Button
          size="lg"
          isDisabled={password.length < 8 || confirmation !== password || submitting}
          onPress={() => void submit()}
        >
          <Button.Label>{submitting ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}</Button.Label>
        </Button>
      </View>
    </AuthScreen>
  );
}
