import { Button, Typography } from "heroui-native";
import type { JSX } from "react";
import { useRef, useState } from "react";
import { ScrollView } from "react-native";
import { AuthField } from "@/components/auth/auth-field";
import { ActionError } from "@/components/ui/action-error";
import { ResidentForm } from "@/components/ui/resident-form";
import { ScreenHeader } from "@/components/ui/resident-ui";
import { SafeAreaView } from "@/components/ui/themed-safe-area-view";
import { passwordErrors } from "@/features/account/validation";
import { useAuth } from "@/features/auth/auth-context";

export default function AccountSecurityScreen(): JSX.Element {
  const { changePassword } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  const save = async () => {
    if (pending.current) return;
    const invalid = passwordErrors(current, next, confirm);
    setErrors(invalid);
    setError("");
    setMessage("");
    if (Object.keys(invalid).length) return;
    pending.current = true;
    setSaving(true);
    try {
      await changePassword(current, next);
      setCurrent("");
      setNext("");
      setConfirm("");
      setMessage(
        "Đã đổi mật khẩu. Các phiên đăng nhập khác đã bị thu hồi; bạn có thể đăng nhập bằng mật khẩu mới."
      );
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Chưa đổi được mật khẩu.");
    } finally {
      pending.current = false;
      setSaving(false);
    }
  };
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ResidentForm>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
          contentContainerClassName="gap-5 px-5 pb-8 pt-4"
        >
          <ScreenHeader title="Bảo mật tài khoản" />
          <AuthField
            label="Mật khẩu hiện tại"
            icon="lock"
            secureTextEntry
            value={current}
            onChangeText={setCurrent}
            editable={!saving}
            autoCapitalize="none"
            autoComplete="current-password"
            error={errors.current}
          />
          <AuthField
            label="Mật khẩu mới"
            icon="lock"
            secureTextEntry
            value={next}
            onChangeText={setNext}
            editable={!saving}
            autoCapitalize="none"
            autoComplete="new-password"
            error={errors.next}
          />
          <AuthField
            label="Xác nhận mật khẩu mới"
            icon="lock"
            secureTextEntry
            value={confirm}
            onChangeText={setConfirm}
            editable={!saving}
            autoCapitalize="none"
            autoComplete="new-password"
            error={errors.confirm}
          />
          {error ? <ActionError message={error} /> : null}
          {message ? (
            <Typography.Paragraph accessibilityLiveRegion="polite" className="text-success">
              {message}
            </Typography.Paragraph>
          ) : null}
          <Button isDisabled={saving} onPress={() => void save()}>
            <Button.Label>{saving ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}</Button.Label>
          </Button>
        </ScrollView>
      </ResidentForm>
    </SafeAreaView>
  );
}
