import { router } from "expo-router";
import { Button, Card, PressableFeedback, Skeleton, Typography } from "heroui-native";
import type { JSX } from "react";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AuthField } from "@/components/auth/auth-field";
import { GravityIcon } from "@/components/icons/gravity-icon";
import { StatusBadge } from "@/components/ui/status-badge";
import { parcelApi } from "@/features/parcels/api";
import type { ParcelListItem } from "@/features/parcels/types";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const dateFormatter = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" });

export function ParcelHistoryContent(): JSX.Element {
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [parcels, setParcels] = useState<ParcelListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (): Promise<void> => {
    if ((from && !datePattern.test(from)) || (to && !datePattern.test(to))) {
      setError("Ngày lọc phải theo định dạng YYYY-MM-DD.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      setParcels(await parcelApi.getHistory({ search: search.trim(), from, to }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Không thể tải lịch sử.");
    } finally {
      setLoading(false);
    }
  }, [from, search, to]);

  useEffect(() => {
    void parcelApi
      .getHistory()
      .then(setParcels)
      .catch((loadError: unknown) =>
        setError(loadError instanceof Error ? loadError.message : "Không thể tải lịch sử.")
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerClassName="gap-4 px-5 pb-8 pt-4"
        keyboardShouldPersistTaps="handled"
      >
        <Typography.Heading className="text-3xl">Lịch sử bưu kiện</Typography.Heading>
        <Card>
          <Card.Body className="gap-3">
            <AuthField
              label="Tìm kiếm"
              icon="package"
              placeholder="Mã kiện hoặc locker"
              value={search}
              onChangeText={setSearch}
            />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <AuthField
                  label="Từ ngày"
                  icon="clock"
                  placeholder="YYYY-MM-DD"
                  value={from}
                  onChangeText={setFrom}
                />
              </View>
              <View className="flex-1">
                <AuthField
                  label="Đến ngày"
                  icon="clock"
                  placeholder="YYYY-MM-DD"
                  value={to}
                  onChangeText={setTo}
                />
              </View>
            </View>
            <Button onPress={() => void load()}>
              <Button.Label>Lọc lịch sử</Button.Label>
            </Button>
          </Card.Body>
        </Card>

        {error ? (
          <Typography.Paragraph className="text-danger">{error}</Typography.Paragraph>
        ) : null}
        {loading ? <Skeleton className="h-36 w-full rounded-2xl" /> : null}
        {!loading && !error && parcels.length === 0 ? (
          <Card>
            <Card.Body className="items-center gap-3 py-8">
              <GravityIcon name="clock" size={36} />
              <Typography.Heading className="text-lg">Chưa có lịch sử phù hợp</Typography.Heading>
              <Typography.Paragraph className="text-center text-muted">
                Thử thay đổi mã kiện hoặc khoảng ngày tìm kiếm.
              </Typography.Paragraph>
            </Card.Body>
          </Card>
        ) : null}
        {!loading && !error
          ? parcels.map((parcel) => <HistoryCard key={parcel.id} parcel={parcel} />)
          : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function HistoryCard({ parcel }: { parcel: ParcelListItem }): JSX.Element {
  return (
    <PressableFeedback onPress={() => router.push(`/parcels/${parcel.id}`)}>
      <Card>
        <Card.Header className="flex-row items-center justify-between">
          <Card.Title>{parcel.parcelCode}</Card.Title>
          <StatusBadge
            label={parcel.status === "Retrieved" ? "Đã nhận" : "Đã chuyển kho"}
            tone="default"
          />
        </Card.Header>
        <Card.Body className="gap-2">
          <Typography.Paragraph>
            {parcel.lockerCode} · Ngăn {parcel.compartmentCode}
          </Typography.Paragraph>
          <Typography.Paragraph className="text-sm text-muted">
            Gửi ngày {dateFormatter.format(new Date(parcel.storedAt))}
          </Typography.Paragraph>
          {parcel.retrievedAt ? (
            <Typography.Paragraph className="text-sm text-muted">
              Nhận ngày {dateFormatter.format(new Date(parcel.retrievedAt))}
            </Typography.Paragraph>
          ) : null}
        </Card.Body>
      </Card>
    </PressableFeedback>
  );
}
