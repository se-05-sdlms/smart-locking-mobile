import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Button, Card, Label, Spinner, TextArea, TextField, Typography } from "heroui-native";
import type { JSX } from "react";
import { useState } from "react";
import { Image, ScrollView, View } from "react-native";
import { SafeAreaView } from "@/components/ui/themed-safe-area-view";
import { GravityIcon } from "@/components/icons/gravity-icon";
import { FlowSteps, ScreenHeader } from "@/components/ui/resident-ui";
import { returnApi } from "@/features/returns/api";

export default function NewReturnScreen(): JSX.Element {
  const [photo, setPhoto] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const choosePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return setError("Cần quyền camera để chụp ảnh món đồ.");
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.75,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };
  const create = async () => {
    if (!photo) return setError("Hãy chụp ảnh món đồ trước.");
    setSaving(true);
    setError("");
    try {
      const url = await returnApi.uploadImage(photo);
      const created = await returnApi.create(url, note);
      router.replace({ pathname: "/returns/[id]", params: { id: created.id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tạo yêu cầu gửi đồ.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentContainerClassName="gap-5 px-5 pb-10 pt-4"
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader title="Tạo yêu cầu gửi đồ" />
        <FlowSteps labels={["Thông tin", "Gửi vào tủ", "Hoàn tất"]} active={0} />
        <View className="gap-2">
          <Typography.Paragraph className="font-medium">Ảnh món đồ</Typography.Paragraph>
          <Card>
            <Card.Body className="gap-3">
              {photo ? (
                <Image
                  source={{ uri: photo }}
                  className="h-52 w-full rounded-2xl"
                  resizeMode="cover"
                />
              ) : (
                <View className="h-40 items-center justify-center rounded-2xl bg-default">
                  <GravityIcon name="camera" size={38} />
                  <Typography.Paragraph className="mt-2 text-muted">
                    Chụp rõ món đồ cần gửi
                  </Typography.Paragraph>
                </View>
              )}
              <Button variant="secondary" onPress={() => void choosePhoto()}>
                <Button.Label>{photo ? "Chụp lại" : "Mở camera"}</Button.Label>
              </Button>
            </Card.Body>
          </Card>
        </View>
        <TextField>
          <Label>Ghi chú (tùy chọn)</Label>
          <TextArea
            value={note}
            onChangeText={setNote}
            placeholder="Ghi chú về món đồ..."
            maxLength={200}
          />
        </TextField>
        <Card className="bg-default">
          <Card.Body className="flex-row items-center gap-3 py-3">
            <GravityIcon name="building" />
            <View className="flex-1">
              <Typography.Paragraph className="text-sm text-muted">Tủ sử dụng</Typography.Paragraph>
              <Typography.Heading className="text-base">Tủ đã đăng ký của bạn</Typography.Heading>
            </View>
          </Card.Body>
        </Card>
        {error ? (
          <Typography.Paragraph className="text-danger">{error}</Typography.Paragraph>
        ) : null}
        <Button isDisabled={!photo || saving} onPress={() => void create()}>
          {saving ? <Spinner size="sm" color="current" /> : null}
          <Button.Label>Tìm ngăn trống</Button.Label>
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
