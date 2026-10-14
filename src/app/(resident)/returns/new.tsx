import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import {
  Button,
  Card,
  Description,
  FieldError,
  Label,
  Spinner,
  Surface,
  TextArea,
  TextField,
  Typography,
} from "heroui-native";
import type { JSX } from "react";
import { useRef, useState } from "react";
import { Linking, ScrollView, View } from "react-native";
import { ResidentForm } from "@/components/ui/resident-form";
import { ParcelImage } from "@/components/ui/parcel-image";
import { SafeAreaView } from "@/components/ui/themed-safe-area-view";
import { ActionError } from "@/components/ui/action-error";
import { GravityIcon } from "@/components/icons/gravity-icon";
import { FlowSteps, ScreenHeader } from "@/components/ui/resident-ui";
import { returnApi } from "@/features/returns/api";

export default function NewReturnScreen(): JSX.Element {
  const [photo, setPhoto] = useState("");
  const [note, setNote] = useState("");
  const [stage, setStage] = useState<"idle" | "uploading" | "creating">("idle");
  const [photoError, setPhotoError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [cameraBusy, setCameraBusy] = useState(false);
  const [cameraBlocked, setCameraBlocked] = useState(false);
  const cameraPending = useRef(false),
    createPending = useRef(false);
  const uploaded = useRef<{ uri: string; url: string } | null>(null);
  const saving = stage !== "idle";
  const choosePhoto = async () => {
    if (cameraPending.current || createPending.current) return;
    cameraPending.current = true;
    setCameraBusy(true);
    setPhotoError("");
    setCameraBlocked(false);
    try {
      let permission = await ImagePicker.getCameraPermissionsAsync();
      if (!permission.granted && permission.canAskAgain)
        permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setCameraBlocked(!permission.canAskAgain);
        setPhotoError(
          permission.canAskAgain
            ? "Cần quyền camera để chụp ảnh món đồ. Nhấn Mở camera để thử lại."
            : "Camera đã bị chặn. Cho phép Boxora dùng camera trong Cài đặt thiết bị."
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.75,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (!result.canceled && result.assets[0]) {
        setPhoto(result.assets[0].uri);
        uploaded.current = null;
        setSubmitError("");
      }
    } catch {
      setPhotoError("Không thể mở camera. Kiểm tra quyền truy cập rồi thử lại.");
    } finally {
      cameraPending.current = false;
      setCameraBusy(false);
    }
  };
  const create = async () => {
    if (createPending.current || cameraPending.current) return;
    if (!photo) {
      setPhotoError("Hãy chụp ảnh món đồ trước khi tìm ngăn trống.");
      return;
    }
    createPending.current = true;
    setSubmitError("");
    setPhotoError("");
    try {
      let url = uploaded.current?.uri === photo ? uploaded.current.url : null;
      if (!url) {
        setStage("uploading");
        url = await returnApi.uploadImage(photo);
        uploaded.current = { uri: photo, url };
      }
      setStage("creating");
      const created = await returnApi.create(url, note);
      router.replace({ pathname: "/returns/[id]", params: { id: created.id } });
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Không thể tạo yêu cầu gửi đồ. Ảnh và ghi chú được giữ lại; bạn có thể thử lại."
      );
    } finally {
      createPending.current = false;
      setStage("idle");
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
          <ScreenHeader title="Tạo yêu cầu gửi đồ" />
          <FlowSteps labels={["Thông tin", "Gửi vào tủ", "Hoàn tất"]} active={0} />
          <View className="gap-2">
            <Typography.Paragraph nativeID="return-photo-label" className="font-medium">
              Ảnh món đồ
            </Typography.Paragraph>
            <Card className="border border-border shadow-none">
              <Card.Body className="gap-3">
                {photo ? (
                  <ParcelImage
                    uri={photo}
                    accessibilityLabel="Ảnh món đồ bạn sẽ gửi"
                    className="h-52 w-full rounded-xl"
                    contentFit="cover"
                  />
                ) : (
                  <View className="h-36 items-center justify-center rounded-xl bg-surface-secondary">
                    <GravityIcon name="camera" size={36} />
                    <Typography.Paragraph className="mt-2 px-3 text-center text-sm text-muted">
                      Chụp rõ món đồ cần gửi
                    </Typography.Paragraph>
                  </View>
                )}
                <Button
                  variant="secondary"
                  className="min-h-12"
                  isDisabled={saving || cameraBusy}
                  onPress={() => void choosePhoto()}
                >
                  <Button.Label>
                    {cameraBusy ? "Đang mở camera..." : photo ? "Chụp lại" : "Mở camera"}
                  </Button.Label>
                </Button>
              </Card.Body>
            </Card>
            <FieldError isInvalid={!!photoError} textProps={{ accessibilityRole: "alert" }}>
              {photoError}
            </FieldError>
            {cameraBlocked ? (
              <Button
                variant="secondary"
                className="min-h-12"
                onPress={() =>
                  void Linking.openSettings().catch(() =>
                    setPhotoError("Không thể mở Cài đặt. Hãy mở Cài đặt thiết bị thủ công.")
                  )
                }
              >
                <Button.Label>Mở Cài đặt thiết bị</Button.Label>
              </Button>
            ) : null}
          </View>
          <TextField>
            <Label>Ghi chú (tùy chọn)</Label>
            <TextArea
              value={note}
              editable={!saving}
              onChangeText={setNote}
              placeholder="Ghi chú về món đồ..."
              maxLength={200}
            />
            <Description>{note.length}/200 ký tự</Description>
          </TextField>
          <Surface variant="secondary" className="flex-row items-center gap-3 rounded-xl px-4 py-3">
            <GravityIcon name="building" tone="muted" />
            <View className="min-w-0 flex-1">
              <Typography.Paragraph className="text-xs text-muted">Tủ sử dụng</Typography.Paragraph>
              <Typography.Paragraph className="text-sm font-medium">
                Tủ đã đăng ký của bạn
              </Typography.Paragraph>
            </View>
          </Surface>
          {submitError ? (
            <ActionError
              title="Chưa tạo được yêu cầu gửi đồ"
              message={submitError}
              busy={saving}
              onRetry={() => void create()}
            />
          ) : null}
          <Button
            className="min-h-12"
            isDisabled={saving || cameraBusy}
            onPress={() => void create()}
          >
            {saving ? <Spinner size="sm" color="current" /> : null}
            <Button.Label>
              {stage === "uploading"
                ? "Đang tải ảnh..."
                : stage === "creating"
                  ? "Đang tạo yêu cầu..."
                  : "Tìm ngăn trống"}
            </Button.Label>
          </Button>
        </ScrollView>
      </ResidentForm>
    </SafeAreaView>
  );
}
