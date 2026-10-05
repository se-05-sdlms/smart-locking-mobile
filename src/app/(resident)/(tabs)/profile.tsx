import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { Button, Card, ControlField, Spinner, Switch, Typography } from "heroui-native";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Uniwind, useUniwind } from "uniwind";

import { GravityIcon } from "@/components/icons/gravity-icon";
import { ResidentTabBar } from "@/components/resident-tab-scaffold";
import { useAuth } from "@/features/auth/auth-context";
import { deliveryRequestApi } from "@/features/delivery-requests/api";
import type { DeliveryApprovalMode, ResidentApprovalProfile } from "@/features/delivery-requests/types";

export default function ProfileScreen(): JSX.Element {
  const { user, logout } = useAuth();
  const { theme } = useUniwind();
  const [profile, setProfile] = useState<ResidentApprovalProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { void deliveryRequestApi.getProfile().then(setProfile).catch((e: unknown) => setError(e instanceof Error ? e.message : "Không thể tải cài đặt.")); }, []);
  const changeApproval = async (automatic: boolean) => {
    setSaving(true); setError("");
    try { setProfile(await deliveryRequestApi.updateApprovalMode((automatic ? 0 : 1) as DeliveryApprovalMode)); }
    catch (e) { setError(e instanceof Error ? e.message : "Không thể lưu cài đặt."); }
    finally { setSaving(false); }
  };
  const changeTheme = async (dark: boolean) => { const next = dark ? "dark" : "light"; Uniwind.setTheme(next); await SecureStore.setItemAsync("boxora-theme", next); };

  return <View style={{ flex: 1 }}>
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-4 px-5 pb-10 pt-4">
        <View className="gap-1"><Typography.Heading className="text-3xl">Tài khoản</Typography.Heading><Typography.Paragraph className="text-muted">Thông tin và cách tủ xử lý hàng gửi đến.</Typography.Paragraph></View>
        <Card><Card.Body className="gap-2"><Typography.Heading className="text-xl">{profile?.fullName || "Cư dân"}</Typography.Heading><Typography.Paragraph className="text-muted">{profile?.phoneNumber || user?.phoneNumber || user?.email}</Typography.Paragraph></Card.Body></Card>
        <Card><Card.Header><Card.Title>Cài đặt giao hàng</Card.Title></Card.Header><Card.Body className="gap-4">
          <ControlField isSelected={profile?.deliveryApprovalMode === 0} isDisabled={!profile || saving} onSelectedChange={(selected) => void changeApproval(selected)}>
            <View className="flex-1 gap-1"><Typography.Heading className="text-base">Tự động duyệt shipper</Typography.Heading><Typography.Paragraph className="text-sm text-muted">Mặc định tắt. Khi bật, shipper được cấp ngăn mà không chờ bạn.</Typography.Paragraph></View><ControlField.Indicator>{saving ? <Spinner size="sm" /> : <Switch />}</ControlField.Indicator>
          </ControlField>
          <ControlField isSelected={theme === "dark"} onSelectedChange={(selected) => void changeTheme(selected)}>
            <View className="flex-1 gap-1"><Typography.Heading className="text-base">Giao diện tối</Typography.Heading><Typography.Paragraph className="text-sm text-muted">Chuyển giữa nền sáng và nền tối.</Typography.Paragraph></View><ControlField.Indicator><Switch /></ControlField.Indicator>
          </ControlField>
        </Card.Body></Card>
        {error ? <Typography.Paragraph className="text-danger">{error}</Typography.Paragraph> : null}
        <Button variant="secondary" onPress={() => router.push("/incidents")}><GravityIcon name="alert-circle" /><Button.Label>Sự cố của tôi</Button.Label><GravityIcon name="arrow-right" /></Button>
        <Button variant="secondary" onPress={() => router.push("/returns")}><GravityIcon name="package" /><Button.Label>Hàng tôi gửi qua tủ</Button.Label><GravityIcon name="arrow-right" /></Button>
        <Button variant="secondary" onPress={() => void logout()}><GravityIcon name="arrow-left" /><Button.Label>Đăng xuất</Button.Label></Button>
      </ScrollView>
    </SafeAreaView>
    <ResidentTabBar />
  </View>;
}
