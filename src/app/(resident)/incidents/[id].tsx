import { router, useLocalSearchParams } from "expo-router";
import { Button, Card, Spinner, Typography } from "heroui-native";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import { Image, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GravityIcon } from "@/components/icons/gravity-icon";
import { incidentApi, type IncidentDetail } from "@/features/incidents/api";

export default function IncidentDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>(); const [item, setItem] = useState<IncidentDetail | null>(null); const [error, setError] = useState("");
  useEffect(() => { if (id) void incidentApi.get(id).then(setItem).catch((e: unknown) => setError(e instanceof Error ? e.message : "Không thể tải sự cố.")); }, [id]);
  return <SafeAreaView className="flex-1 bg-background"><ScrollView contentContainerClassName="gap-4 px-5 pb-10 pt-4"><View className="flex-row items-center gap-3"><Button isIconOnly size="sm" variant="ghost" onPress={() => router.back()}><GravityIcon name="arrow-left" /></Button><Typography.Heading className="text-2xl">Chi tiết sự cố</Typography.Heading></View>{!item ? <Spinner /> : <Card><Card.Body className="gap-3"><Typography.Heading className="text-xl">{item.title}</Typography.Heading><Typography.Paragraph>{item.description}</Typography.Paragraph><Typography.Paragraph className="font-medium">Trạng thái: {item.status}</Typography.Paragraph>{item.resolutionSummary ? <Typography.Paragraph className="text-success">Kết quả: {item.resolutionSummary}</Typography.Paragraph> : null}{item.evidenceUrl ? <Image source={{ uri: item.evidenceUrl }} className="h-56 w-full rounded-2xl" /> : null}</Card.Body></Card>}{error ? <Typography.Paragraph className="text-danger">{error}</Typography.Paragraph> : null}</ScrollView></SafeAreaView>;
}
