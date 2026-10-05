import { router } from "expo-router";
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
import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GravityIcon, type GravityIconName } from "@/components/icons/gravity-icon";
import { useAuth } from "@/features/auth/auth-context";
import { deliveryRequestApi } from "@/features/delivery-requests/api";
import type {
  DeliveryApprovalMode,
  ResidentApprovalProfile,
} from "@/features/delivery-requests/types";

export default function ProfileScreen(): JSX.Element {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<ResidentApprovalProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    void deliveryRequestApi
      .getProfile()
      .then(setProfile)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Không thể tải tài khoản."));
  }, []);
  const changeApproval = async (automatic: boolean) => {
    setSaving(true);
    setError("");
    try {
      setProfile(
        await deliveryRequestApi.updateApprovalMode((automatic ? 0 : 1) as DeliveryApprovalMode)
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể lưu thay đổi.");
    } finally {
      setSaving(false);
    }
  };
  const name = profile?.fullName || "Cư dân";
  const initials = name
    .split(" ")
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <ScrollView contentContainerClassName="gap-6 px-5 pb-6 pt-4">
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
          <FlatRow icon="user" title="Thông tin cá nhân" />
          <Separator />
          <FlatRow
            icon="building"
            title="Tủ của tôi"
            description={profile?.registeredLockerId ? "Đã liên kết" : "Chưa liên kết"}
          />
        </Section>
        <Section title="Tùy chọn nhận hàng">
          <ControlField
            className="px-1 py-3"
            isSelected={profile?.deliveryApprovalMode === 0}
            isDisabled={!profile || saving}
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
          <Separator />
          <FlatRow
            icon="receipt"
            title="Lịch sử thanh toán"
            onPress={() => router.push("/payments")}
          />
        </Section>
        <Section title="Ứng dụng">
          <FlatRow icon="settings" title="Cài đặt" onPress={() => router.push("/settings")} />
        </Section>
        {error ? (
          <Typography.Paragraph className="text-danger">{error}</Typography.Paragraph>
        ) : null}
        <Button variant="ghost" className="self-start" onPress={() => void logout()}>
          <Button.Label className="text-danger">Đăng xuất</Button.Label>
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }): JSX.Element {
  return (
    <View className="gap-2">
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
  return (
    <ListGroup.Item onPress={onPress}>
      <ListGroup.ItemPrefix>
        <GravityIcon name={icon} size={20} />
      </ListGroup.ItemPrefix>
      <ListGroup.ItemContent>
        <ListGroup.ItemTitle>{title}</ListGroup.ItemTitle>
        {description ? <ListGroup.ItemDescription>{description}</ListGroup.ItemDescription> : null}
      </ListGroup.ItemContent>
      {onPress ? <ListGroup.ItemSuffix /> : null}
    </ListGroup.Item>
  );
}
