import { Button, Skeleton, Typography } from "heroui-native";
import type { JSX } from "react";
import { useEffect, useRef, useState } from "react";
import { ScrollView } from "react-native";
import { AuthField } from "@/components/auth/auth-field";
import { ActionError } from "@/components/ui/action-error";
import { ResidentForm } from "@/components/ui/resident-form";
import { ScreenHeader } from "@/components/ui/resident-ui";
import { SafeAreaView } from "@/components/ui/themed-safe-area-view";
import { residentAccountApi, type ResidentProfile } from "@/features/account/api";
import { profileErrors } from "@/features/account/validation";
import { invalidateMobileData } from "@/features/notifications/data-sync";

export default function AccountProfileScreen(): JSX.Element {
  const [profile, setProfile] = useState<ResidentProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [revision, setRevision] = useState(0);
  const pending = useRef(false);
  useEffect(() => {
    let active = true;
    void residentAccountApi
      .get()
      .then((value) => {
        if (!active) return;
        setProfile(value);
        setFullName(value.fullName);
        setDateOfBirth(value.dateOfBirth ?? "");
        setAvatarUrl(value.avatarUrl ?? "");
      })
      .catch((failure: unknown) => {
        if (active)
          setError(failure instanceof Error ? failure.message : "Không tải được thông tin.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [revision]);
  const save = async () => {
    if (pending.current || !profile) return;
    const invalid = profileErrors(fullName, dateOfBirth, avatarUrl);
    setErrors(invalid);
    setError("");
    setMessage("");
    if (Object.keys(invalid).length) return;
    pending.current = true;
    setSaving(true);
    try {
      const updated = await residentAccountApi.update({
        fullName: fullName.trim(),
        dateOfBirth: dateOfBirth || null,
        avatarUrl: avatarUrl.trim() || null,
      });
      setProfile(updated);
      setFullName(updated.fullName);
      setDateOfBirth(updated.dateOfBirth ?? "");
      setAvatarUrl(updated.avatarUrl ?? "");
      invalidateMobileData();
      setMessage("Đã lưu thông tin cá nhân.");
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Chưa lưu được thông tin. Dữ liệu trên máy chủ được giữ nguyên."
      );
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
          <ScreenHeader title="Thông tin cá nhân" />
          {loading ? <Skeleton className="h-48 rounded-xl" /> : null}
          {!loading && profile ? (
            <>
              <AuthField
                label="Họ và tên"
                icon="user"
                value={fullName}
                onChangeText={setFullName}
                editable={!saving}
                maxLength={150}
                error={errors.fullName}
              />
              <AuthField
                label="Ngày sinh (YYYY-MM-DD)"
                icon="clock"
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                editable={!saving}
                maxLength={10}
                placeholder="2000-01-31"
                error={errors.dateOfBirth}
              />
              <AuthField
                label="URL ảnh đại diện"
                icon="camera"
                value={avatarUrl}
                onChangeText={setAvatarUrl}
                editable={!saving}
                autoCapitalize="none"
                keyboardType="url"
                maxLength={2048}
                error={errors.avatarUrl}
              />
              <Typography.Paragraph className="text-muted">
                Liên hệ: {profile.phoneNumber || profile.email || "Chưa có"}. Tủ đăng ký và vai trò
                được quản lý bởi hệ thống.
              </Typography.Paragraph>
              <Button isDisabled={saving} onPress={() => void save()}>
                <Button.Label>{saving ? "Đang lưu..." : "Lưu thông tin"}</Button.Label>
              </Button>
            </>
          ) : null}
          {error ? (
            <ActionError
              message={error}
              onRetry={
                !profile
                  ? () => {
                      setLoading(true);
                      setError("");
                      setRevision((value) => value + 1);
                    }
                  : undefined
              }
            />
          ) : null}
          {message ? (
            <Typography.Paragraph accessibilityLiveRegion="polite" className="text-success">
              {message}
            </Typography.Paragraph>
          ) : null}
        </ScrollView>
      </ResidentForm>
    </SafeAreaView>
  );
}
