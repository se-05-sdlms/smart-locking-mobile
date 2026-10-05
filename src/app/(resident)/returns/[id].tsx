import { router, useLocalSearchParams } from "expo-router";
import { Button, Card, Spinner, Typography } from "heroui-native";
import type { JSX } from "react";
import { useCallback, useEffect, useState } from "react";
import { Image, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GravityIcon } from "@/components/icons/gravity-icon";
import { returnApi } from "@/features/returns/api";
import type { ReturnRequestItem } from "@/features/returns/types";

const statusLabels = ["Mới tạo", "Đã cấp ngăn", "Đang chờ shipper", "Shipper đã lấy", "Đã hủy", "Hết hạn", "Thất bại"];

export default function ReturnDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>(); const [item, setItem] = useState<ReturnRequestItem | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const load = useCallback(async () => { if (!id) return; try { setItem(await returnApi.get(id)); } catch (e) { setError(e instanceof Error ? e.message : "Không thể tải yêu cầu."); } }, [id]);
  useEffect(() => { if (id) void returnApi.get(id).then(setItem).catch((e: unknown) => setError(e instanceof Error ? e.message : "Không thể tải yêu cầu.")); }, [id]);
  const run = async (action: "open" | "deposit") => { if (!id) return; setBusy(true); setError(""); try { if (action === "open") await returnApi.allocateAndOpen(id); else await returnApi.confirmDeposit(id); await load(); } catch (e) { setError(e instanceof Error ? e.message : "Không thể thực hiện thao tác."); } finally { setBusy(false); } };
  return <SafeAreaView className="flex-1 bg-background"><ScrollView contentContainerClassName="gap-5 px-5 pb-10 pt-4">
    <View className="flex-row items-center gap-3"><Button isIconOnly size="sm" variant="ghost" onPress={() => router.back()}><GravityIcon name="arrow-left" /></Button><Typography.Heading className="text-2xl">Chi tiết hàng gửi</Typography.Heading></View>
    {!item ? <Spinner /> : <><Image source={{ uri: item.imageUrl }} className="h-72 w-full rounded-3xl" resizeMode="cover" />
      <Card><Card.Body className="gap-2"><Typography.Heading className="text-xl">{item.lockerCode}</Typography.Heading><Typography.Paragraph className="text-muted">{item.lockerAddress}</Typography.Paragraph><Typography.Paragraph>Trạng thái: {statusLabels[item.status]}</Typography.Paragraph>{item.compartmentCode ? <Typography.Heading className="text-2xl text-warning">Ngăn {item.compartmentCode}</Typography.Heading> : null}</Card.Body></Card>
      {item.status === 0 ? <Card className="border border-warning/30"><Card.Body className="gap-3"><Typography.Heading className="text-lg">2 · Mở một ngăn trống</Typography.Heading><Typography.Paragraph className="text-muted">Đứng cạnh tủ rồi bấm mở. Hệ thống tự chọn ngăn, bạn không cần nhập mã đơn.</Typography.Paragraph><Button isDisabled={busy} onPress={() => void run("open")}><Button.Label>Tìm ngăn trống và mở</Button.Label></Button></Card.Body></Card> : null}
      {item.status === 1 ? <Card className="border border-success/30"><Card.Body className="gap-3"><Typography.Heading className="text-lg">3 · Bỏ đồ vào ngăn {item.compartmentCode}</Typography.Heading><Typography.Paragraph className="text-muted">Đặt kiện vào tủ, đóng kín cửa rồi xác nhận.</Typography.Paragraph><Button isDisabled={busy} onPress={() => void run("deposit")}><Button.Label>Tôi đã bỏ đồ và đóng cửa</Button.Label></Button></Card.Body></Card> : null}
      {item.status === 2 ? <Card className="border border-success/30"><Card.Body className="items-center gap-3 py-6"><Typography.Paragraph className="text-muted">Mã shipper lấy hàng</Typography.Paragraph><Typography.Heading className="font-mono text-5xl tracking-[8px]">{item.pickupCode}</Typography.Heading><Typography.Paragraph className="text-center text-muted">Đưa 6 số này cho shipper. Mã chỉ dùng một lần tại tủ {item.lockerCode}.</Typography.Paragraph></Card.Body></Card> : null}
      {item.status === 3 ? <Card><Card.Body className="items-center gap-3 py-6"><Typography.Heading className="text-xl text-success">Shipper đã lấy hàng</Typography.Heading><Typography.Paragraph className="text-center text-muted">Ngăn tủ đã được giải phóng.</Typography.Paragraph></Card.Body></Card> : null}
    </>}
    {error ? <Typography.Paragraph className="text-danger">{error}</Typography.Paragraph> : null}
  </ScrollView></SafeAreaView>;
}
