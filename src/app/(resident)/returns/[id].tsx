import { ParcelImage } from "@/components/ui/parcel-image";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Card, Spinner, Typography } from "heroui-native";
import type { JSX } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, ScrollView, Share, View } from "react-native";
import { SafeAreaView } from "@/components/ui/themed-safe-area-view";
import { GravityIcon } from "@/components/icons/gravity-icon";
import { FlowSteps, IncidentAction, ScreenHeader } from "@/components/ui/resident-ui";
import { returnApi } from "@/features/returns/api";
import type { ReturnRequestItem } from "@/features/returns/types";
import { unlockViaBluetooth } from "@/features/bluetooth/unlock";

export default function ReturnDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<ReturnRequestItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const bluetoothRun = useRef<AbortController | null>(null);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") bluetoothRun.current?.abort();
    });
    return () => {
      subscription.remove();
      bluetoothRun.current?.abort();
    };
  }, []);
  const load = useCallback(async () => {
    if (!id) return;
    try {
      setItem(await returnApi.get(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tải yêu cầu.");
    }
  }, [id]);
  useEffect(() => {
    const task = setTimeout(() => void load(), 0);
    return () => clearTimeout(task);
  }, [load]);
  const run = async (action: "open" | "deposit") => {
    if (!id) return;
    setBusy(true);
    setError("");
    try {
      if (action === "open") await returnApi.allocateAndOpen(id);
      else {
        const current = await returnApi.get(id);
        if (current.status !== 2) {
          throw new Error("Hệ thống chưa ghi nhận cửa đã đóng. Vui lòng chờ vài giây rồi thử lại.");
        }
        setItem(current);
        return;
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể thực hiện thao tác.");
    } finally {
      setBusy(false);
    }
  };
  const bluetoothOpen = async () => {
    if (!id) return;
    const run = new AbortController();
    bluetoothRun.current = run;
    setBusy(true);
    setError("");
    try {
      await unlockViaBluetooth("R", id, run.signal);
    } catch (e) {
      if (!run.signal.aborted)
        setError(e instanceof Error ? e.message : "Chưa xác nhận được lệnh Bluetooth.");
    } finally {
      // Preparation may already have allocated the return even if BLE failed.
      if (!run.signal.aborted) await load();
      bluetoothRun.current = null;
      setBusy(false);
    }
  };
  const active = !item || item.status === 0 ? 0 : item.status === 1 ? 1 : 2;
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-5 px-5 pb-10 pt-4"
      >
        <ScreenHeader
          title={
            item?.status === 2
              ? "Mã lấy đồ"
              : item?.status === 1
                ? "Đặt đồ vào ngăn"
                : "Gửi đồ vào tủ"
          }
        />
        {!item ? (
          <Spinner />
        ) : (
          <>
            <FlowSteps labels={["Thông tin", "Gửi vào tủ", "Hoàn tất"]} active={active} />
            {item.status === 0 ? (
              <>
                <ParcelImage
                  uri={item.imageUrl}
                  className="h-44 w-full rounded-3xl bg-default"
                  contentFit="cover"
                />
                <Card>
                  <Card.Body className="gap-3">
                    <Info label="Tủ sử dụng" value={`${item.lockerCode} · ${item.lockerAddress}`} />
                    <Typography.Paragraph className="text-muted">
                      Hệ thống sẽ tìm ngăn trống và mở ngay trên tủ đã đăng ký.
                    </Typography.Paragraph>
                    <Button isDisabled={busy} onPress={() => void run("open")}>
                      <Button.Label>
                        {busy ? "Đang tìm ngăn..." : "Tìm ngăn trống và mở"}
                      </Button.Label>
                    </Button>
                    <Button
                      variant="secondary"
                      isDisabled={busy}
                      onPress={() => void bluetoothOpen()}
                    >
                      <Button.Label>Mở qua Bluetooth khi ở gần tủ</Button.Label>
                    </Button>
                    <Typography.Paragraph className="text-xs text-muted">
                      Điện thoại cần Internet để kiểm tra quyền. Bluetooth chỉ khả dụng khi chính
                      sách cho phép.
                    </Typography.Paragraph>
                  </Card.Body>
                </Card>
              </>
            ) : null}
            {item.status === 1 ? (
              <>
                <View className="items-center gap-3 rounded-3xl bg-default py-8">
                  <GravityIcon name="lock" size={48} tone="success" />
                  <Typography.Heading className="text-2xl">
                    Kiểm tra ngăn {item.compartmentCode}
                  </Typography.Heading>
                  <Typography.Paragraph className="text-muted">
                    Nếu cửa đã mở, hãy đặt đồ vào ngăn và đóng cửa. Chờ máy chủ ghi nhận sau khi tủ
                    kết nối lại.
                  </Typography.Paragraph>
                </View>
                <Button isDisabled={busy} onPress={() => void run("deposit")}>
                  <Button.Label>
                    {busy ? "Đang kiểm tra cửa..." : "Đã đặt đồ và đóng cửa"}
                  </Button.Label>
                </Button>
                <Button variant="secondary" isDisabled={busy} onPress={() => void bluetoothOpen()}>
                  <Button.Label>Thử mở lại qua Bluetooth</Button.Label>
                </Button>
                <IncidentAction
                  onPress={() =>
                    router.push({ pathname: "/incidents/new", params: { returnId: item.id } })
                  }
                />
              </>
            ) : null}
            {item.status === 2 ? (
              <View className="items-center gap-4">
                <View className="h-20 w-20 items-center justify-center rounded-full bg-success">
                  <GravityIcon name="check" size={42} tone="success-foreground" />
                </View>
                <Typography.Heading className="text-center text-2xl">
                  Đã gửi đồ vào ngăn {item.compartmentCode}
                </Typography.Heading>
                <Typography.Paragraph className="text-warning">Chờ lấy</Typography.Paragraph>
                <Card className="w-full">
                  <Card.Body className="items-center gap-3 py-6">
                    <Typography.Paragraph className="text-muted">Mã lấy đồ</Typography.Paragraph>
                    <Typography.Heading className="font-mono text-5xl tracking-[8px]">
                      {item.pickupCode}
                    </Typography.Heading>
                    <Button
                      variant="secondary"
                      onPress={() =>
                        void Share.share({ message: `Mã lấy đồ Boxora: ${item.pickupCode}` })
                      }
                    >
                      <GravityIcon name="share" />
                      <Button.Label>Chia sẻ mã</Button.Label>
                    </Button>
                    <Typography.Paragraph className="text-center text-xs text-muted">
                      Chỉ chia sẻ mã này với người đến lấy đồ.
                    </Typography.Paragraph>
                  </Card.Body>
                </Card>
                <Button className="w-full" onPress={() => router.replace("/")}>
                  <Button.Label>Về trang chủ</Button.Label>
                </Button>
              </View>
            ) : null}
            {item.status === 3 ? (
              <Card>
                <Card.Body className="items-center gap-3 py-10">
                  <GravityIcon name="check" size={44} tone="success" />
                  <Typography.Heading className="text-xl">Đồ đã được lấy</Typography.Heading>
                  <Typography.Paragraph className="text-muted">
                    Ngăn tủ đã được giải phóng.
                  </Typography.Paragraph>
                </Card.Body>
              </Card>
            ) : null}
          </>
        )}
        {error ? (
          <Typography.Paragraph className="text-danger">{error}</Typography.Paragraph>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
function Info({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <View className="gap-1">
      <Typography.Paragraph className="text-xs text-muted">{label}</Typography.Paragraph>
      <Typography.Paragraph>{value}</Typography.Paragraph>
    </View>
  );
}
