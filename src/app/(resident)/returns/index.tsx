import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Button, Card, PressableFeedback, Spinner, Typography } from "heroui-native";
import type { JSX } from "react";
import { useCallback, useEffect, useState } from "react";
import { Image, RefreshControl, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GravityIcon } from "@/components/icons/gravity-icon";
import { returnApi } from "@/features/returns/api";
import type { ReturnRequestItem } from "@/features/returns/types";

const statusLabels = ["Mới tạo", "Đã cấp ngăn", "Đang chờ shipper", "Shipper đã lấy", "Đã hủy", "Hết hạn", "Thất bại"];

export default function ReturnsScreen(): JSX.Element {
  const [items, setItems] = useState<ReturnRequestItem[]>([]); const [photo, setPhoto] = useState(""); const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  const load = useCallback(async () => { try { setItems(await returnApi.getMine()); } catch (e) { setError(e instanceof Error ? e.message : "Không thể tải hàng gửi."); } finally { setLoading(false); } }, []);
  useEffect(() => { void returnApi.getMine().then(setItems).catch((e: unknown) => setError(e instanceof Error ? e.message : "Không thể tải hàng gửi.")).finally(() => setLoading(false)); }, []);
  const choosePhoto = async () => { const permission = await ImagePicker.requestCameraPermissionsAsync(); if (!permission.granted) return setError("Cần quyền camera để chụp ảnh kiện hàng."); const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.75, allowsEditing: true, aspect: [1, 1] }); if (!result.canceled) setPhoto(result.assets[0].uri); };
  const create = async () => { if (!photo) return setError("Bạn phải chụp ảnh kiện hàng trước."); setSaving(true); setError(""); try { const url = await returnApi.uploadImage(photo); const created = await returnApi.create(url, note); router.push({ pathname: "/returns/[id]", params: { id: created.id } }); } catch (e) { setError(e instanceof Error ? e.message : "Không thể tạo yêu cầu gửi đồ."); } finally { setSaving(false); } };
  return <SafeAreaView className="flex-1 bg-background"><ScrollView contentContainerClassName="gap-5 px-5 pb-10 pt-4" refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}>
    <View className="flex-row items-center gap-3"><Button isIconOnly size="sm" variant="ghost" onPress={() => router.back()}><GravityIcon name="arrow-left" /></Button><View className="flex-1"><Typography.Heading className="text-2xl">Gửi đồ qua tủ</Typography.Heading><Typography.Paragraph className="text-sm text-muted">Chụp ảnh → mở ngăn → nhận mã shipper.</Typography.Paragraph></View></View>
    <Card className="border border-warning/30"><Card.Header><Card.Title>1 · Chụp ảnh kiện hàng</Card.Title></Card.Header><Card.Body className="gap-4">
      {photo ? <Image source={{ uri: photo }} className="h-56 w-full rounded-2xl" resizeMode="cover" /> : <View className="h-40 items-center justify-center rounded-2xl bg-default-100"><GravityIcon name="package" size={40} /><Typography.Paragraph className="mt-2 text-muted">Ảnh là bắt buộc</Typography.Paragraph></View>}
      <Button variant="secondary" onPress={() => void choosePhoto()}><Button.Label>{photo ? "Chụp lại" : "Mở camera"}</Button.Label></Button>
      <TextInput value={note} onChangeText={setNote} placeholder="Ghi chú về đồ gửi (không bắt buộc)" className="min-h-12 rounded-xl border border-default-200 px-4 text-foreground" />
      <Button isDisabled={!photo || saving} onPress={() => void create()}>{saving ? <Spinner size="sm" color="current" /> : null}<Button.Label>Tạo yêu cầu và tìm ngăn</Button.Label></Button>
    </Card.Body></Card>
    {error ? <Typography.Paragraph className="text-danger">{error}</Typography.Paragraph> : null}
    <Typography.Heading className="text-xl">Đã gửi gần đây</Typography.Heading>
    {items.map(item => <PressableFeedback key={item.id} onPress={() => router.push({ pathname: "/returns/[id]", params: { id: item.id } })}><Card><Card.Body className="flex-row items-center gap-3"><Image source={{ uri: item.imageUrl }} className="h-16 w-16 rounded-xl" /><View className="flex-1"><Typography.Heading className="text-base">{item.lockerCode} · {item.compartmentCode ? `Ngăn ${item.compartmentCode}` : "Chưa cấp ngăn"}</Typography.Heading><Typography.Paragraph className="text-sm text-muted">{statusLabels[item.status]}</Typography.Paragraph></View><GravityIcon name="arrow-right" /></Card.Body></Card></PressableFeedback>)}
  </ScrollView></SafeAreaView>;
}
