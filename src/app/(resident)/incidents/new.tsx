import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import {
  Button,
  Card,
  Chip,
  Label,
  Spinner,
  Tabs,
  TextArea,
  TextField,
  Typography,
} from "heroui-native";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import { Image, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GravityIcon } from "@/components/icons/gravity-icon";
import { ScreenHeader } from "@/components/ui/resident-ui";
import { deliveryRequestApi } from "@/features/delivery-requests/api";
import { incidentApi } from "@/features/incidents/api";
import { returnApi } from "@/features/returns/api";

const categories = [
  { value: "Compartment", label: "Tủ / Ngăn" },
  { value: "Parcel", label: "Bưu kiện" },
  { value: "Retrieval", label: "Nhận hàng" },
  { value: "Return", label: "Gửi đồ" },
  { value: "Payment", label: "Thanh toán" },
  { value: "Other", label: "Khác" },
];
export default function NewIncidentScreen(): JSX.Element {
  const params = useLocalSearchParams<{
    parcelId?: string;
    returnId?: string;
    paymentId?: string;
  }>();
  const relatedId = params.parcelId ?? params.returnId ?? params.paymentId;
  const [lockerId, setLockerId] = useState("");
  const [type, setType] = useState(
    params.parcelId
      ? "Parcel"
      : params.returnId
        ? "Return"
        : params.paymentId
          ? "Payment"
          : "Compartment"
  );
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    void deliveryRequestApi
      .getProfile()
      .then((profile) => setLockerId(profile.registeredLockerId ?? ""))
      .catch(() => setError("Không thể xác định tủ đã đăng ký."));
  }, []);
  const choose = async () => {
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };
  const submit = async () => {
    if (!lockerId || !description.trim()) return setError("Hãy mô tả sự cố.");
    setBusy(true);
    setError("");
    try {
      const evidenceUrl = photo ? await returnApi.uploadImage(photo) : undefined;
      const label = categories.find((item) => item.value === type)?.label ?? "Khác";
      const created = await incidentApi.create({
        type,
        title: `Sự cố ${label}`,
        description,
        lockerId,
        evidenceUrl,
      });
      router.replace({ pathname: "/incidents/[id]", params: { id: created.id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể gửi báo cáo.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentContainerClassName="gap-5 px-5 pb-10 pt-4"
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader title="Báo cáo sự cố" />
        <Tabs value={type} onValueChange={setType}>
          <Tabs.List>
            <Tabs.ScrollView>
              <Tabs.Indicator />
              {categories.map((item) => (
                <Tabs.Trigger key={item.value} value={item.value}>
                  <Tabs.Label>{item.label}</Tabs.Label>
                </Tabs.Trigger>
              ))}
            </Tabs.ScrollView>
          </Tabs.List>
        </Tabs>
        {relatedId ? (
          <View className="gap-2">
            <Typography.Paragraph className="text-sm font-medium">
              Bưu kiện liên quan
            </Typography.Paragraph>
            <Chip color="accent" variant="soft">
              {relatedId}
            </Chip>
          </View>
        ) : null}
        <TextField isRequired isInvalid={Boolean(error && !description.trim())}>
          <Label>Mô tả chi tiết</Label>
          <TextArea
            value={description}
            onChangeText={setDescription}
            placeholder="Mô tả sự cố của bạn..."
            maxLength={500}
          />
          <Typography.Paragraph className="text-right text-xs text-muted">
            {description.length}/500
          </Typography.Paragraph>
        </TextField>
        <Card>
          <Card.Body className="gap-3">
            {photo ? (
              <Image source={{ uri: photo }} className="h-40 w-full rounded-2xl" />
            ) : (
              <View className="h-28 items-center justify-center rounded-2xl bg-default">
                <GravityIcon name="camera" size={30} />
              </View>
            )}
            <Button variant="secondary" onPress={() => void choose()}>
              <Button.Label>{photo ? "Chụp lại" : "Thêm ảnh bằng chứng"}</Button.Label>
            </Button>
          </Card.Body>
        </Card>
        {error ? (
          <Typography.Paragraph className="text-danger">{error}</Typography.Paragraph>
        ) : null}
        <Button isDisabled={busy} onPress={() => void submit()}>
          {busy ? <Spinner size="sm" color="current" /> : null}
          <Button.Label>Gửi báo cáo</Button.Label>
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
