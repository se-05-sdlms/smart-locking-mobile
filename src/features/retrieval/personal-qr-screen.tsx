import { Button, Card, Skeleton, Typography } from "heroui-native";
import type { JSX } from "react";
import { useCallback, useEffect, useState } from "react";
import { AppState, ScrollView, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";

import { GravityIcon } from "@/components/icons/gravity-icon";
import { retrievalApi } from "@/features/retrieval/api";
import type { PersonalQr } from "@/features/retrieval/types";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const dateFormatter = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" });

export function PersonalQrScreen(): JSX.Element {
  const [qr, setQr] = useState<PersonalQr | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError("");
    try {
      setQr(await retrievalApi.getPersonalQr());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Không thể tạo mã QR.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void retrievalApi
      .getPersonalQr()
      .then(setQr)
      .catch((loadError: unknown) =>
        setError(loadError instanceof Error ? loadError.message : "Không thể tạo mã QR.")
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => void load(), REFRESH_INTERVAL_MS);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void load();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [load]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <ScrollView contentContainerClassName="items-center gap-5 px-5 pb-8 pt-5">
        <View className="w-full gap-1">
          <Typography.Heading className="text-3xl">Mã QR cá nhân</Typography.Heading>
          <Typography.Paragraph className="text-muted">
            Đưa mã này vào đầu đọc tại locker để xác thực nhận hàng.
          </Typography.Paragraph>
        </View>

        <Card className="w-full">
          <Card.Body className="items-center gap-5 py-8">
            {loading ? <Skeleton className="h-64 w-64 rounded-2xl" /> : null}
            {!loading && qr ? (
              <View className="rounded-3xl bg-white p-5">
                <QRCode value={qr.qrToken} size={224} backgroundColor="white" color="black" />
              </View>
            ) : null}
            {error ? (
              <Typography.Paragraph className="text-center text-danger">
                {error}
              </Typography.Paragraph>
            ) : null}
            {qr ? (
              <Typography.Paragraph className="text-center text-sm text-muted">
                Cấp lúc {dateFormatter.format(new Date(qr.issuedAt))}
              </Typography.Paragraph>
            ) : null}
            <Button variant="secondary" isDisabled={loading} onPress={() => void load()}>
              <GravityIcon name="refresh" />
              <Button.Label>{loading ? "Đang tạo mã" : "Tạo mã mới"}</Button.Label>
            </Button>
          </Card.Body>
        </Card>

        <Card className="w-full">
          <Card.Body className="flex-row gap-3">
            <GravityIcon name="lock" tone="warning" />
            <Typography.Paragraph className="flex-1 text-sm text-muted">
              Không chia sẻ hoặc chụp màn hình mã QR. Mỗi lần làm mới sẽ vô hiệu hóa mã trước đó.
            </Typography.Paragraph>
          </Card.Body>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
