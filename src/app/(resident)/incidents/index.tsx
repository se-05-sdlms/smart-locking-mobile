import { router } from "expo-router";
import { Button, Spinner, Typography } from "heroui-native";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GravityIcon } from "@/components/icons/gravity-icon";
import { incidentApi, type IncidentItem } from "@/features/incidents/api";

export default function IncidentListScreen(): JSX.Element {
  const [items, setItems] = useState<IncidentItem[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { void incidentApi.getMine().then(setItems).catch((e: unknown) => setError(e instanceof Error ? e.message : "Không thể tải sự cố.")).finally(() => setLoading(false)); }, []);
  return <SafeAreaView className="flex-1 bg-background"><ScrollView contentContainerClassName="gap-4 px-5 pb-10 pt-4"><View className="flex-row items-center gap-3"><Button isIconOnly size="sm" variant="ghost" onPress={() => router.back()}><GravityIcon name="arrow-left" /></Button><View className="flex-1"><Typography.Heading className="text-2xl">Sự cố của tôi</Typography.Heading><Typography.Paragraph className="text-sm text-muted">Theo dõi phản hồi từ nhân viên vận hành.</Typography.Paragraph></View></View><Button onPress={() => router.push("/incidents/new")}><Button.Label>Báo cáo sự cố mới</Button.Label></Button>{loading ? <Spinner /> : null}{error ? <Typography.Paragraph className="text-danger">{error}</Typography.Paragraph> : null}{items.map(item => <Button key={item.id} variant="secondary" onPress={() => router.push({ pathname: "/incidents/[id]", params: { id: item.id } })}><View className="flex-1 items-start"><Typography.Heading className="text-base">{item.title}</Typography.Heading><Typography.Paragraph className="text-sm text-muted">{item.lockerCode} · {item.status}</Typography.Paragraph></View><GravityIcon name="arrow-right" /></Button>)}</ScrollView></SafeAreaView>;
}
