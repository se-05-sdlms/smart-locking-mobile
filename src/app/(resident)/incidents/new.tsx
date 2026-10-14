import { ResidentForm } from "@/components/ui/resident-form";
import { ParcelImage } from "@/components/ui/parcel-image";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Card, Chip, Label, Spinner, TextArea, TextField, Typography } from "heroui-native";
import type { JSX } from "react";
import { useEffect, useRef, useState } from "react";
import { Linking, ScrollView, View } from "react-native";
import { SafeAreaView } from "@/components/ui/themed-safe-area-view";
import { GravityIcon } from "@/components/icons/gravity-icon";
import { ScreenHeader } from "@/components/ui/resident-ui";
import { deliveryRequestApi } from "@/features/delivery-requests/api";
import { incidentApi } from "@/features/incidents/api";
import { returnApi } from "@/features/returns/api";

const categories = [
  { value: "Compartment", label: "Tủ/ngăn" },
  { value: "Parcel", label: "Bưu kiện" },
  { value: "Retrieval", label: "Nhận" },
  { value: "Return", label: "Gửi" },
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
  const [cameraBusy, setCameraBusy] = useState(false);
  const [cameraBlocked, setCameraBlocked] = useState(false);
  const cameraPending = useRef(false);
  useEffect(() => {
    void deliveryRequestApi
      .getProfile()
      .then((profile) => setLockerId(profile.registeredLockerId ?? ""))
      .catch(() => setError("Không thể xác định tủ đã đăng ký."));
  }, []);
  const choose = async () => {
    if (cameraPending.current || busy) return;
    cameraPending.current = true;
    setCameraBusy(true);
    setCameraBlocked(false);
    setError("");
    try {
      let permission = await ImagePicker.getCameraPermissionsAsync();
      if (!permission.granted && permission.canAskAgain)
        permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setCameraBlocked(!permission.canAskAgain);
        setError(
          permission.canAskAgain
            ? "Cần quyền camera để chụp ảnh bằng chứng. Nhấn Thêm ảnh để thử lại."
            : "Camera đã bị chặn. Hãy mở Cài đặt thiết bị và cho phép Boxora truy cập camera."
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.7 });
      if (!result.canceled && result.assets[0]) setPhoto(result.assets[0].uri);
    } catch {
      setError("Không thể mở camera. Kiểm tra quyền truy cập rồi thử lại.");
    } finally {
      cameraPending.current = false;
      setCameraBusy(false);
    }
  };
  const submit = async () => {
    if (busy || cameraPending.current) return;
    if (!lockerId)
      return setError("Chưa xác định được tủ đã đăng ký. Quay lại và mở báo cáo để thử lại.");
    if (!description.trim()) return setError("Hãy mô tả sự cố.");
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
        parcelId: params.parcelId,
        returnRequestId: params.returnId,
        paymentTransactionId: params.paymentId,
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
      <ResidentForm>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerClassName="gap-5 px-5 pb-10 pt-4"
          keyboardShouldPersistTaps="handled"
        >
          <ScreenHeader title="Báo cáo sự cố" />
          <View className="gap-2">
            {[categories.slice(0, 3), categories.slice(3)].map((row, index) => (
              <View key={index} className="flex-row gap-2">
                {row.map((item) => (
                  <Button
                    key={item.value}
                    className="min-w-0 flex-1"
                    size="sm"
                    variant={type === item.value ? "primary" : "secondary"}
                    onPress={() => setType(item.value)}
                  >
                    <Button.Label>{item.label}</Button.Label>
                  </Button>
                ))}
              </View>
            ))}
          </View>
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
                <ParcelImage uri={photo} className="h-40 w-full rounded-2xl" />
              ) : (
                <View className="h-28 items-center justify-center rounded-2xl bg-default">
                  <GravityIcon name="camera" size={30} />
                </View>
              )}
              <Button
                isDisabled={busy || cameraBusy}
                variant="secondary"
                onPress={() => void choose()}
              >
                <Button.Label>
                  {cameraBusy ? "Đang mở camera..." : photo ? "Chụp lại" : "Thêm ảnh bằng chứng"}
                </Button.Label>
              </Button>
            </Card.Body>
          </Card>
          {error ? (
            <Typography.Paragraph className="text-danger">{error}</Typography.Paragraph>
          ) : null}
          {cameraBlocked ? (
            <Button
              variant="secondary"
              onPress={() =>
                void Linking.openSettings().catch(() =>
                  setError("Không thể mở Cài đặt. Hãy mở Cài đặt thiết bị thủ công.")
                )
              }
            >
              <Button.Label>Mở Cài đặt thiết bị</Button.Label>
            </Button>
          ) : null}
          <Button
            isDisabled={busy || cameraBusy || !lockerId || !description.trim()}
            onPress={() => void submit()}
          >
            {busy ? <Spinner size="sm" color="current" /> : null}
            <Button.Label>Gửi báo cáo</Button.Label>
          </Button>
        </ScrollView>
      </ResidentForm>
    </SafeAreaView>
  );
}
