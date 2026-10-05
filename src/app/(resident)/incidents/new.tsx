import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Button, Card, Spinner, Typography } from "heroui-native";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import { Image, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GravityIcon } from "@/components/icons/gravity-icon";
import { deliveryRequestApi } from "@/features/delivery-requests/api";
import { incidentApi } from "@/features/incidents/api";
import { returnApi } from "@/features/returns/api";

const types = ["Locker", "Compartment", "Parcel", "Retrieval", "Return", "Other"];
export default function NewIncidentScreen(): JSX.Element {
  const [lockerId, setLockerId] = useState(""); const [type, setType] = useState("Locker"); const [title, setTitle] = useState(""); const [description, setDescription] = useState(""); const [photo, setPhoto] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  useEffect(() => { void deliveryRequestApi.getProfile().then(p => setLockerId(p.registeredLockerId ?? "")).catch(() => setError("Không thể xác định tủ đã đăng ký.")); }, []);
  const choose = async () => { const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: .7 }); if (!result.canceled) setPhoto(result.assets[0].uri); };
  const submit = async () => { if (!lockerId || !title.trim() || !description.trim()) return setError("Nhập tiêu đề và mô tả sự cố."); setBusy(true); setError(""); try { const evidenceUrl = photo ? await returnApi.uploadImage(photo) : undefined; const created = await incidentApi.create({ type, title, description, lockerId, evidenceUrl }); router.replace({ pathname: "/incidents/[id]", params: { id: created.id } }); } catch (e) { setError(e instanceof Error ? e.message : "Không thể gửi báo cáo."); } finally { setBusy(false); } };
  return <SafeAreaView className="flex-1 bg-background"><ScrollView contentContainerClassName="gap-4 px-5 pb-10 pt-4"><View className="flex-row items-center gap-3"><Button isIconOnly size="sm" variant="ghost" onPress={() => router.back()}><GravityIcon name="arrow-left" /></Button><Typography.Heading className="text-2xl">Báo cáo sự cố</Typography.Heading></View><Card><Card.Body className="gap-4"><Typography.Paragraph className="font-medium">Loại sự cố</Typography.Paragraph><View className="flex-row flex-wrap gap-2">{types.map(value => <Button key={value} size="sm" variant={type === value ? "primary" : "secondary"} onPress={() => setType(value)}><Button.Label>{value}</Button.Label></Button>)}</View><TextInput value={title} onChangeText={setTitle} placeholder="Tiêu đề" className="h-12 rounded-xl border border-default-200 px-4 text-foreground" /><TextInput value={description} onChangeText={setDescription} placeholder="Mô tả điều đã xảy ra" multiline className="min-h-32 rounded-xl border border-default-200 p-4 text-foreground" />{photo ? <Image source={{ uri: photo }} className="h-48 w-full rounded-2xl" /> : null}<Button variant="secondary" onPress={() => void choose()}><Button.Label>{photo ? "Chụp lại ảnh" : "Thêm ảnh bằng chứng"}</Button.Label></Button><Button isDisabled={busy} onPress={() => void submit()}>{busy ? <Spinner size="sm" color="current" /> : null}<Button.Label>Gửi báo cáo</Button.Label></Button></Card.Body></Card>{error ? <Typography.Paragraph className="text-danger">{error}</Typography.Paragraph> : null}</ScrollView></SafeAreaView>;
}
