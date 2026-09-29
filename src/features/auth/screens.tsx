import { router, useLocalSearchParams } from "expo-router";
import { Button, Checkbox, InputOTP, LinkButton, Typography } from "heroui-native";
import type { JSX } from "react";
import { useState } from "react";
import { View } from "react-native";

import { AuthField } from "@/components/auth/auth-field";
import { AuthScreen } from "@/components/auth/auth-screen";
import { GravityIcon } from "@/components/icons/gravity-icon";

const wait = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));
const normalizePhone = (value: string): string => value.replace(/\s/g, "");
const isValidPhone = (value: string): boolean => /^0\d{9}$/.test(normalizePhone(value));

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
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(): Promise<void> {
    if (!isValidPhone(phone) || password.length < 8) {
      setError("Vui lòng nhập số điện thoại hợp lệ và mật khẩu từ 8 ký tự.");
      return;
    }

    setError("");
    setSubmitting(true);
    await wait(400);
    router.replace("/home");
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
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(): Promise<void> {
    if (fullName.trim().length < 2 || !isValidPhone(phone) || password.length < 8) {
      setError("Vui lòng kiểm tra lại thông tin đăng ký.");
      return;
    }
    if (password !== confirmation) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setError("");
    setSubmitting(true);
    await wait(400);
    router.push({
      pathname: "/verify-otp",
      params: { phone: normalizePhone(phone), flow: "register" },
    });
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
    await wait(400);
    if (otp === "000000") {
      setSubmitting(false);
      setError("Mã xác thực không đúng hoặc đã hết hạn.");
      return;
    }
    setMessage("Xác thực thành công.");
    await wait(350);
    if (flow === "reset") {
      router.replace("/reset-password");
    } else {
      router.replace("/login");
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
          <LinkButton onPress={() => setMessage("Mã xác thực mới đã được gửi.")}>
            Gửi lại mã
          </LinkButton>
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
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(): Promise<void> {
    if (!isValidPhone(phone)) return;
    setSubmitting(true);
    await wait(400);
    router.push({
      pathname: "/verify-otp",
      params: { phone: normalizePhone(phone), flow: "reset" },
    });
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
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(): Promise<void> {
    if (password.length < 8 || password !== confirmation) return;
    setSubmitting(true);
    await wait(400);
    setMessage("Đổi mật khẩu thành công.");
    await wait(350);
    router.replace("/login");
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
