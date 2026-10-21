import { router, useFocusEffect } from "expo-router";
import {
  Avatar,
  Button,
  ControlField,
  ListGroup,
  Separator,
  Spinner,
  Switch,
  Typography,
} from "heroui-native";
import type { JSX, ReactNode } from "react";
import { useCallback, useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "@/components/ui/themed-safe-area-view";

import { ActionError } from "@/components/ui/action-error";
import { GravityIcon, type GravityIconName } from "@/components/icons/gravity-icon";
import { accountPackageApi } from "@/features/account-packages/api";
import { useAuth } from "@/features/auth/auth-context";
import { useMobileDataRevision } from "@/features/notifications/data-sync";
import { deliveryRequestApi } from "@/features/delivery-requests/api";
import type {
  DeliveryApprovalMode,
  ResidentApprovalProfile,
} from "@/features/delivery-requests/types";

export default function ProfileScreen(): JSX.Element {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<ResidentApprovalProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const logoutPending = useRef(false);
  const [error, setError] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const profilePending = useRef(false);
  const approvalPending = useRef(false);
  const [packageName, setPackageName] = useState("Đang tải gói tài khoản...");
  const dataRevision = useMobileDataRevision();
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setPackageName("Đang tải gói tài khoản...");
      void accountPackageApi
        .getCurrent()
        .then((subscription) => {
          if (active) setPackageName(subscription?.planName ?? "Gói Cơ bản");
        })
        .catch(() => {
          if (active) setPackageName("Không thể tải gói hiện tại · Nhấn để thử lại");
        });
      return () => {
        active = false;
      };
    }, [user?.id, dataRevision])
  );
  const loadProfile = useCallback(async () => {
    if (profilePending.current) return;
    profilePending.current = true;
    setProfileLoading(true);
    setError("");
    try {
      setProfile(await deliveryRequestApi.getProfile());
    } catch (error) {
      setError(error instanceof Error ? error.message : "Không thể tải tài khoản.");
    } finally {
      profilePending.current = false;
      setProfileLoading(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile])
  );
  const changeApproval = async (automatic: boolean) => {
    if (approvalPending.current || profilePending.current || !profile) return;
    approvalPending.current = true;
    setSaving(true);
    setError("");
    try {
      setProfile(
        await deliveryRequestApi.updateApprovalMode((automatic ? 0 : 1) as DeliveryApprovalMode)
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể lưu thay đổi.");
    } finally {
      approvalPending.current = false;
      setSaving(false);
    }
  };
  const name = profile?.fullName || "Cư dân";
  const signOut = async () => {
    if (logoutPending.current) return;
    logoutPending.current = true;
    setLoggingOut(true);
    setError("");
    try {
      await logout();
    } catch {
      setError(
        "Chưa đăng xuất an toàn được. Vui lòng kiểm tra kết nối và bấm Đăng xuất để thử lại."
      );
    } finally {
      logoutPending.current = false;
      setLoggingOut(false);
    }
  };
  const initials = name
    .split(" ")
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-4 px-5 pb-5 pt-4"
      >
        <Typography.Heading className="text-3xl">Tài khoản</Typography.Heading>
        <View className="flex-row items-center gap-4">
          <Avatar size="lg" variant="soft" color="accent">
            <Avatar.Fallback>{initials}</Avatar.Fallback>
          </Avatar>
          <View className="flex-1">
            <Typography.Heading className="text-xl">{name}</Typography.Heading>
            <Typography.Paragraph className="text-muted">
              {profile?.phoneNumber || user?.phoneNumber || user?.email}
            </Typography.Paragraph>
          </View>
        </View>
        <Section title="Tài khoản">
          <FlatRow
            icon="user"
            title="Thông tin cá nhân"
            onPress={() => router.push("/account-profile")}
            description={
              profile?.phoneNumber ||
              user?.phoneNumber ||
              user?.email ||
              "Chưa có thông tin liên hệ"
            }
          />
          <Separator />
          <FlatRow
            icon="package"
            title="Gói tài khoản"
            description={packageName}
            onPress={() => router.push("/account-package")}
          />
          <Separator />
          <FlatRow
            icon="building"
            title="Tủ của tôi"
            description={profile?.registeredLockerId ? "Đã liên kết" : "Chưa liên kết"}
          />
        </Section>
        <Section title="Bảo mật">
          <FlatRow
            icon="lock"
            title="Đổi mật khẩu"
            onPress={() => router.push("/account-security")}
          />
        </Section>
        <Section title="Tùy chọn nhận hàng">
          <ControlField
            className="px-1 py-2"
            isSelected={profile?.deliveryApprovalMode === 0}
            isDisabled={!profile || saving || profileLoading}
            onSelectedChange={(selected) => void changeApproval(selected)}
          >
            <View className="flex-1 gap-1">
              <Typography.Heading className="text-base">Xác nhận hàng đến</Typography.Heading>
              <Typography.Paragraph className="text-sm text-muted">
                {profile?.deliveryApprovalMode === 0 ? "Tự động" : "Thủ công"}
              </Typography.Paragraph>
            </View>
            <ControlField.Indicator>
              {saving ? <Spinner size="sm" /> : <Switch />}
            </ControlField.Indicator>
          </ControlField>
        </Section>
        <Section title="Hoạt động">
          <FlatRow
            icon="alert-circle"
            title="Sự cố của tôi"
            onPress={() => router.push("/incidents")}
          />
        </Section>
        <Section title="Ứng dụng">
          <FlatRow icon="settings" title="Cài đặt" onPress={() => router.push("/settings")} />
        </Section>
        {error ? (
          <ActionError
            title="Chưa cập nhật được tài khoản"
            message={error}
            busy={profileLoading || saving}
            onRetry={() => void loadProfile()}
          />
        ) : null}
        <Button
          variant="ghost"
          className="min-h-12 self-start"
          isDisabled={loggingOut}
          onPress={() => void signOut()}
        >
          <Button.Label className="text-danger">
            {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
          </Button.Label>
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }): JSX.Element {
  return (
    <View className="gap-1">
      <Typography.Paragraph className="text-sm font-semibold text-muted">
        {title}
      </Typography.Paragraph>
      <ListGroup variant="transparent">{children}</ListGroup>
    </View>
  );
}
function FlatRow({
  icon,
  title,
  description,
  onPress,
}: {
  icon: GravityIconName;
  title: string;
  description?: string;
  onPress?: () => void;
}): JSX.Element {
  if (!onPress)
    return (
      <View
        accessible
        accessibilityRole="text"
        accessibilityLabel={`${title}${description ? `: ${description}` : ""}`}
        className="flex-row items-start gap-3 px-1 py-3"
      >
        <GravityIcon name={icon} size={18} tone="muted" />
        <View className="min-w-0 flex-1 gap-1">
          <Typography.Paragraph className="text-sm text-muted">{title}</Typography.Paragraph>
          {description ? (
            <Typography.Paragraph selectable className="text-sm">
              {description}
            </Typography.Paragraph>
          ) : null}
        </View>
      </View>
    );
  return (
    <ListGroup.Item
      onPress={onPress}
      className="min-h-12"
      accessibilityRole="button"
      accessibilityLabel={`${title}${description ? `, ${description}` : ""}`}
    >
      <ListGroup.ItemPrefix>
        <GravityIcon name={icon} size={20} />
      </ListGroup.ItemPrefix>
      <ListGroup.ItemContent>
        <ListGroup.ItemTitle>{title}</ListGroup.ItemTitle>
        {description ? <ListGroup.ItemDescription>{description}</ListGroup.ItemDescription> : null}
      </ListGroup.ItemContent>
      <ListGroup.ItemSuffix>
        <GravityIcon name="chevron-right" size={18} />
      </ListGroup.ItemSuffix>
    </ListGroup.Item>
  );
}
