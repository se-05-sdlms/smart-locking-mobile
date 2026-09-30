import { router } from "expo-router";
import { Button, Card, PressableFeedback, Skeleton, Typography } from "heroui-native";
import type { JSX } from "react";
import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GravityIcon } from "@/components/icons/gravity-icon";
import { StatusBadge } from "@/components/ui/status-badge";
import { parcelApi } from "@/features/parcels/api";
import type { ParcelListItem } from "@/features/parcels/types";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
});

export function ResidentHomeContent(): JSX.Element {
  const [parcels, setParcels] = useState<ParcelListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (refresh = false): Promise<void> => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      setParcels(await parcelApi.getActive());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Không thể tải bưu kiện.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void parcelApi
      .getActive()
      .then(setParcels)
      .catch((loadError: unknown) =>
        setError(loadError instanceof Error ? loadError.message : "Không thể tải bưu kiện.")
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 px-5 pb-8 pt-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />
        }
      >
        <View className="gap-1">
          <Typography.Heading className="text-3xl">Bưu kiện của bạn</Typography.Heading>
          <Typography.Paragraph className="text-muted">
            Theo dõi hàng đang nằm trong locker và hạn nhận.
          </Typography.Paragraph>
        </View>

        {loading ? <ParcelSkeletons /> : null}
        {!loading && error ? (
          <Card>
            <Card.Body className="gap-4">
              <Typography.Heading className="text-lg">Chưa tải được bưu kiện</Typography.Heading>
              <Typography.Paragraph className="text-danger">{error}</Typography.Paragraph>
              <Button variant="secondary" onPress={() => void load()}>
                <Button.Label>Thử lại</Button.Label>
              </Button>
            </Card.Body>
          </Card>
        ) : null}
        {!loading && !error && parcels.length === 0 ? (
          <Card>
            <Card.Body className="items-center gap-3 py-8">
              <GravityIcon name="package" size={36} />
              <Typography.Heading className="text-lg">Chưa có bưu kiện chờ nhận</Typography.Heading>
              <Typography.Paragraph className="text-center text-muted">
                Bưu kiện mới sẽ xuất hiện tại đây sau khi shipper gửi vào locker.
              </Typography.Paragraph>
            </Card.Body>
          </Card>
        ) : null}
        {!loading && !error
          ? parcels.map((parcel) => <ParcelCard key={parcel.id} parcel={parcel} />)
          : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ParcelCard({ parcel }: { parcel: ParcelListItem }): JSX.Element {
  const [currentTime] = useState(Date.now);
  const overdue =
    parcel.status === "Overdue" || new Date(parcel.pickupDueAt).getTime() < currentTime;
  return (
    <PressableFeedback onPress={() => router.push(`/parcels/${parcel.id}`)}>
      <Card>
        <Card.Header className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <GravityIcon name="package" />
            <Card.Title>{parcel.parcelCode}</Card.Title>
          </View>
          <StatusBadge
            label={overdue ? "Quá hạn" : "Đang lưu trữ"}
            tone={overdue ? "danger" : "success"}
          />
        </Card.Header>
        <Card.Body className="gap-2">
          <Typography.Paragraph className="font-medium">
            {parcel.lockerCode} · Ngăn {parcel.compartmentCode}
          </Typography.Paragraph>
          <Typography.Paragraph className="text-sm text-muted">
            {parcel.lockerAddress}
          </Typography.Paragraph>
          <Typography.Paragraph className="text-sm text-muted">
            Gửi lúc {dateFormatter.format(new Date(parcel.storedAt))}
          </Typography.Paragraph>
          <Typography.Paragraph className={overdue ? "text-sm text-danger" : "text-sm"}>
            Hạn nhận {dateFormatter.format(new Date(parcel.pickupDueAt))}
          </Typography.Paragraph>
        </Card.Body>
      </Card>
    </PressableFeedback>
  );
}

function ParcelSkeletons(): JSX.Element {
  return (
    <View className="gap-4">
      {[0, 1].map((item) => (
        <Card key={item}>
          <Card.Body className="gap-3">
            <Skeleton className="h-6 w-2/3 rounded-lg" />
            <Skeleton className="h-4 w-full rounded-lg" />
            <Skeleton className="h-4 w-4/5 rounded-lg" />
          </Card.Body>
        </Card>
      ))}
    </View>
  );
}
