import { router, useLocalSearchParams } from "expo-router";
import { Button, Card, Skeleton, Typography } from "heroui-native";
import type { JSX, ReactNode } from "react";
import { useEffect, useState } from "react";
import { Image, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GravityIcon } from "@/components/icons/gravity-icon";
import { StatusBadge } from "@/components/ui/status-badge";
import { parcelApi } from "@/features/parcels/api";
import type { ParcelDetail, ParcelStatus, ParcelStatusHistory } from "@/features/parcels/types";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" });
const moneyFormatter = new Intl.NumberFormat("vi-VN");

export function ParcelDetailContent(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [parcel, setParcel] = useState<ParcelDetail>();
  const [history, setHistory] = useState<ParcelStatusHistory[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const parcelId = String(id);
    void Promise.all([parcelApi.getDetail(parcelId), parcelApi.getStatusHistory(parcelId)])
      .then(([detail, timeline]) => {
        setParcel(detail);
        setHistory(timeline);
      })
      .catch((loadError: unknown) =>
        setError(loadError instanceof Error ? loadError.message : "Không thể tải bưu kiện.")
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <DetailSkeleton />;
  if (!parcel || error) return <DetailError message={error} />;

  const active = parcel.status === "Stored" || parcel.status === "Overdue";
  const paymentRequired =
    parcel.overdueAmount !== null && parcel.overdueChargeStatus === "Outstanding";
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <ScrollView contentContainerClassName="gap-4 px-5 pb-8 pt-4">
        <View className="flex-row items-center gap-3">
          <Button
            isIconOnly
            variant="secondary"
            accessibilityLabel="Quay lại"
            onPress={() => router.back()}
          >
            <GravityIcon name="arrow-left" />
          </Button>
          <View className="flex-1">
            <Typography.Heading className="text-2xl">{parcel.parcelCode}</Typography.Heading>
            <Typography.Paragraph className="text-muted">Chi tiết bưu kiện</Typography.Paragraph>
          </View>
          <StatusBadge
            label={statusLabel(parcel.status)}
            tone={parcel.status === "Overdue" ? "danger" : "success"}
          />
        </View>

        {parcel.parcelImageUrl ? (
          <Card>
            <Card.Body>
              <Image
                source={{ uri: parcel.parcelImageUrl }}
                className="h-48 w-full rounded-2xl"
                resizeMode="cover"
                accessibilityLabel={`Ảnh bưu kiện ${parcel.parcelCode}`}
              />
            </Card.Body>
          </Card>
        ) : null}

        <InfoCard title="Vị trí">
          <InfoLine label="Locker" value={`${parcel.lockerCode} · ${parcel.lockerAddress}`} />
          <InfoLine label="Ngăn" value={parcel.compartmentCode} />
          <InfoLine label="Điểm nhận hàng quá hạn" value={parcel.lockerRecoveryAddress} />
        </InfoCard>
        <InfoCard title="Thời gian">
          <InfoLine label="Đã gửi" value={dateFormatter.format(new Date(parcel.storedAt))} />
          <InfoLine label="Hạn nhận" value={dateFormatter.format(new Date(parcel.pickupDueAt))} />
          <InfoLine
            label="Lưu tối đa đến"
            value={dateFormatter.format(new Date(parcel.maxStorageUntil))}
          />
        </InfoCard>
        <InfoCard title="Giao hàng và chi phí">
          <InfoLine label="Shipper" value={parcel.shipperName || "Không có thông tin"} />
          <InfoLine label="Số điện thoại" value={parcel.shipperPhone || "Không có thông tin"} />
          <InfoLine
            label="Phí quá hạn"
            value={
              parcel.overdueAmount === null
                ? "Chưa phát sinh"
                : `${moneyFormatter.format(parcel.overdueAmount)} ${parcel.currency || "VND"}`
            }
          />
        </InfoCard>
        <InfoCard title="Lịch sử trạng thái">
          {history.length ? (
            history.map((item) => (
              <View key={item.id} className="border-l-2 border-accent pl-3">
                <Typography.Paragraph className="font-medium">
                  {statusLabel(item.toStatus)}
                </Typography.Paragraph>
                <Typography.Paragraph className="text-sm text-muted">
                  {dateFormatter.format(new Date(item.changedAt))}
                  {item.reason ? ` · ${item.reason}` : ""}
                </Typography.Paragraph>
              </View>
            ))
          ) : (
            <Typography.Paragraph className="text-muted">Chưa có lịch sử.</Typography.Paragraph>
          )}
        </InfoCard>

        {active ? (
          <Button
            onPress={() =>
              router.push(paymentRequired ? `/payment/${parcel.id}` : `/retrieval/${parcel.id}`)
            }
          >
            <Button.Label>
              {paymentRequired ? "Thanh toán phí quá hạn" : "Nhận bưu kiện"}
            </Button.Label>
            <GravityIcon name="arrow-right" tone="accent-foreground" />
          </Button>
        ) : null}
        <Button
          variant="secondary"
          onPress={() =>
            router.push({ pathname: "/incidents/new", params: { parcelId: parcel.id } })
          }
        >
          <Button.Label>Báo cáo sự cố</Button.Label>
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoCard({ title, children }: { title: string; children: ReactNode }): JSX.Element {
  return (
    <Card>
      <Card.Header>
        <Card.Title>{title}</Card.Title>
      </Card.Header>
      <Card.Body className="gap-3">{children}</Card.Body>
    </Card>
  );
}

function InfoLine({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <View className="gap-1">
      <Typography.Paragraph className="text-xs text-muted">{label}</Typography.Paragraph>
      <Typography.Paragraph>{value}</Typography.Paragraph>
    </View>
  );
}

function DetailSkeleton(): JSX.Element {
  return (
    <SafeAreaView className="flex-1 gap-4 bg-background px-5 py-6">
      <Skeleton className="h-10 w-2/3 rounded-xl" />
      {[0, 1, 2].map((item) => (
        <Skeleton key={item} className="h-36 w-full rounded-2xl" />
      ))}
    </SafeAreaView>
  );
}

function DetailError({ message }: { message: string }): JSX.Element {
  return (
    <SafeAreaView className="flex-1 bg-background px-5 py-6">
      <Card>
        <Card.Body className="gap-4">
          <Typography.Heading className="text-xl">Không thể mở bưu kiện</Typography.Heading>
          <Typography.Paragraph className="text-danger">{message}</Typography.Paragraph>
          <Button variant="secondary" onPress={() => router.back()}>
            <Button.Label>Quay lại</Button.Label>
          </Button>
        </Card.Body>
      </Card>
    </SafeAreaView>
  );
}

function statusLabel(status: ParcelStatus): string {
  return {
    Stored: "Đang lưu trữ",
    Overdue: "Quá hạn",
    Retrieved: "Đã nhận",
    Removed: "Đã chuyển kho",
  }[status];
}
