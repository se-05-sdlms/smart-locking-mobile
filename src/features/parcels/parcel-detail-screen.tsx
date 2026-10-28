import { LockerSupportCard } from "@/features/support/locker-support-card";
import { ActionError } from "@/components/ui/action-error";
import { ParcelImage } from "@/components/ui/parcel-image";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Skeleton, Surface, Typography } from "heroui-native";
import type { JSX, ReactNode } from "react";
import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "@/components/ui/themed-safe-area-view";

import { GravityIcon } from "@/components/icons/gravity-icon";
import { IncidentAction, ScreenHeader } from "@/components/ui/resident-ui";
import { StatusBadge } from "@/components/ui/status-badge";
import { parcelApi } from "@/features/parcels/api";
import type { ParcelDetail, ParcelStatus, ParcelStatusHistory } from "@/features/parcels/types";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" });
const moneyFormatter = new Intl.NumberFormat("vi-VN");

export function ParcelDetailContent(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [parcel, setParcel] = useState<ParcelDetail>();
  const [history, setHistory] = useState<ParcelStatusHistory[]>([]);
  const [imageFailed, setImageFailed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    const task = setTimeout(() => {
      setLoading(true);
      setError("");
      setImageFailed(false);
      const parcelId = String(id);
      void Promise.all([parcelApi.getDetail(parcelId), parcelApi.getStatusHistory(parcelId)])
        .then(([detail, timeline]) => {
          if (active) {
            setParcel(detail);
            setHistory(timeline);
          }
        })
        .catch((error: unknown) => {
          if (active) setError(error instanceof Error ? error.message : "Không thể tải bưu kiện.");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 0);
    return () => {
      active = false;
      clearTimeout(task);
    };
  }, [id, revision]);

  if (loading) return <DetailSkeleton />;
  if (!parcel || error)
    return (
      <DetailError
        message={error || "Bưu kiện không khả dụng."}
        onRetry={() => setRevision((value) => value + 1)}
      />
    );

  const active = parcel.status === "Stored" || parcel.status === "Overdue";
  const paymentRequired =
    parcel.overdueAmount !== null && parcel.overdueChargeStatus === "Outstanding";
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-4 px-5 pb-8 pt-4"
      >
        <View className="gap-3">
          <ScreenHeader title="Chi tiết bưu kiện" />
          <View className="gap-2">
            <Typography.Heading className="text-xl" selectable>
              {parcel.parcelCode}
            </Typography.Heading>
            <StatusBadge
              label={statusLabel(parcel.status)}
              tone={
                parcel.status === "Overdue"
                  ? "danger"
                  : parcel.status === "Removed"
                    ? "default"
                    : "success"
              }
            />
          </View>
        </View>

        {parcel.status === "Removed" ? (
          <Surface
            variant="secondary"
            className="gap-3 rounded-2xl border border-warning/30 bg-warning/5 p-4"
          >
            <View className="flex-row items-center gap-2">
              <GravityIcon name="alert-circle" tone="warning" size={20} />
              <Typography.Heading className="text-base font-semibold">
                Kiện hàng đã được thu hồi
              </Typography.Heading>
            </View>
            <Typography.Paragraph className="text-sm">
              Nhân viên vận hành đã chuyển kiện hàng khỏi tủ về địa chỉ thu hồi. Kiện hàng hiện
              không còn trong ngăn tủ.
            </Typography.Paragraph>
            <View className="gap-1 rounded-xl bg-background/80 p-3">
              <Typography.Paragraph className="text-xs text-muted">
                Địa chỉ thu hồi của tủ
              </Typography.Paragraph>
              <Typography.Paragraph selectable className="text-sm font-medium">
                {parcel.lockerRecoveryAddress?.trim()
                  ? parcel.lockerRecoveryAddress
                  : "Chưa có thông tin địa chỉ thu hồi"}
              </Typography.Paragraph>
            </View>
          </Surface>
        ) : null}

        {parcel.parcelImageUrl && !imageFailed ? (
          <ParcelImage
            uri={parcel.parcelImageUrl}
            className="h-40 w-full rounded-3xl bg-default"
            contentFit="cover"
            onError={() => setImageFailed(true)}
            accessibilityLabel={`Ảnh bưu kiện ${parcel.parcelCode}`}
          />
        ) : (
          <View className="h-28 w-full items-center justify-center gap-2 rounded-3xl bg-default">
            <GravityIcon name="package" size={30} tone="muted" />
            <Typography.Paragraph className="text-sm text-muted">
              Không có ảnh bưu kiện
            </Typography.Paragraph>
          </View>
        )}

        <InfoSection title="Thông tin bưu kiện">
          <InfoLine label="Locker" value={`${parcel.lockerCode} · ${parcel.lockerAddress}`} />
          <InfoLine
            label={parcel.status === "Removed" ? "Ngăn trước đây" : "Ngăn"}
            value={parcel.compartmentCode}
          />
          <InfoLine label="Gửi vào tủ" value={dateFormatter.format(new Date(parcel.storedAt))} />
          <InfoLine
            label={parcel.status === "Removed" ? "Hạn nhận ban đầu" : "Hạn nhận"}
            value={dateFormatter.format(new Date(parcel.pickupDueAt))}
          />
          {parcel.removedAt ? (
            <InfoLine
              label="Thời gian thu hồi"
              value={dateFormatter.format(new Date(parcel.removedAt))}
            />
          ) : null}
          {parcel.status === "Removed" ? (
            <InfoLine
              label="Địa chỉ thu hồi"
              value={
                parcel.lockerRecoveryAddress?.trim()
                  ? parcel.lockerRecoveryAddress
                  : "Chưa có thông tin địa chỉ thu hồi"
              }
              selectable
            />
          ) : null}
          {parcel.overdueAmount !== null ? (
            <InfoLine
              label="Phí quá hạn"
              value={`${moneyFormatter.format(parcel.overdueAmount)} ${parcel.currency || "VND"}`}
            />
          ) : null}
        </InfoSection>
        <InfoSection title="Lịch sử trạng thái">
          {history.length ? (
            history.map((item) => (
              <View key={item.id} className="flex-row gap-3">
                <View className="mt-1 h-3 w-3 rounded-full bg-accent" />
                <View className="flex-1">
                  <Typography.Paragraph className="font-medium">
                    {statusLabel(item.toStatus)}
                  </Typography.Paragraph>
                  <Typography.Paragraph className="text-sm text-muted">
                    {dateFormatter.format(new Date(item.changedAt))}
                  </Typography.Paragraph>
                  {item.reason ? (
                    <Typography.Paragraph selectable className="text-sm text-muted">
                      {item.reason}
                    </Typography.Paragraph>
                  ) : null}
                </View>
              </View>
            ))
          ) : (
            <Typography.Paragraph className="text-muted">Chưa có lịch sử.</Typography.Paragraph>
          )}
        </InfoSection>

        {active ? (
          <Button
            onPress={() =>
              router.push(paymentRequired ? `/payment/${parcel.id}` : `/retrieval/${parcel.id}`)
            }
          >
            <Button.Label>{paymentRequired ? "Thanh toán phí quá hạn" : "Nhận hàng"}</Button.Label>
            <GravityIcon name="arrow-right" tone="accent-foreground" />
          </Button>
        ) : null}
        <LockerSupportCard lockerId={parcel.lockerId} reference={parcel.parcelCode} />
        <IncidentAction
          onPress={() =>
            router.push({ pathname: "/incidents/new", params: { parcelId: parcel.id } })
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoSection({ title, children }: { title: string; children: ReactNode }): JSX.Element {
  return (
    <View className="gap-2">
      <Typography.Heading className="text-base">{title}</Typography.Heading>
      <Surface variant="secondary" className="gap-3 rounded-xl p-4">
        {children}
      </Surface>
    </View>
  );
}

function InfoLine({
  label,
  value,
  selectable = false,
}: {
  label: string;
  value: string;
  selectable?: boolean;
}): JSX.Element {
  return (
    <View className="gap-1">
      <Typography.Paragraph className="text-xs text-muted">{label}</Typography.Paragraph>
      <Typography.Paragraph selectable={selectable}>{value}</Typography.Paragraph>
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

function DetailError({ message, onRetry }: { message: string; onRetry: () => void }): JSX.Element {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-4 px-5 py-6"
      >
        <ScreenHeader title="Chi tiết bưu kiện" />
        <ActionError title="Không thể mở bưu kiện" message={message} onRetry={onRetry} />
        <Button
          variant="secondary"
          className="min-h-12"
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
        >
          <Button.Label>Quay lại</Button.Label>
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

function statusLabel(status: ParcelStatus): string {
  return {
    Stored: "Đang lưu trữ",
    Overdue: "Quá hạn",
    Retrieved: "Đã nhận",
    Removed: "Đã thu hồi",
  }[status];
}
