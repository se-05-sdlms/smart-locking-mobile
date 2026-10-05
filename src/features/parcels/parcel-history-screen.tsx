import { router } from "expo-router";
import { Card, PressableFeedback, SearchField, Skeleton, Tabs, Typography } from "heroui-native";
import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import { Image, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GravityIcon } from "@/components/icons/gravity-icon";
import { StatusBadge } from "@/components/ui/status-badge";
import { parcelApi } from "@/features/parcels/api";
import type { ParcelListItem } from "@/features/parcels/types";
import { returnApi } from "@/features/returns/api";
import type { ReturnRequestItem } from "@/features/returns/types";

type Filter = "all" | "incoming" | "outgoing";
const dateFormatter = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" });

export function ParcelHistoryContent(): JSX.Element {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [parcels, setParcels] = useState<ParcelListItem[]>([]);
  const [returns, setReturns] = useState<ReturnRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    void Promise.all([parcelApi.getHistory(), returnApi.getMine().catch(() => [])])
      .then(([incoming, outgoing]) => {
        setParcels(incoming);
        setReturns(outgoing);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Không thể tải lịch sử."))
      .finally(() => setLoading(false));
  }, []);
  const query = search.trim().toLowerCase();
  const incoming = useMemo(
    () =>
      parcels.filter(
        (item) =>
          !query ||
          `${item.parcelCode} ${item.lockerCode} ${item.compartmentCode}`
            .toLowerCase()
            .includes(query)
      ),
    [parcels, query]
  );
  const outgoing = useMemo(
    () =>
      returns.filter(
        (item) =>
          item.status >= 2 &&
          (!query ||
            `${item.pickupCode} ${item.lockerCode} ${item.compartmentCode ?? ""}`
              .toLowerCase()
              .includes(query))
      ),
    [returns, query]
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerClassName="gap-4 px-5 pb-6 pt-4"
        keyboardShouldPersistTaps="handled"
      >
        <Typography.Heading className="text-3xl">Lịch sử</Typography.Heading>
        <SearchField value={search} onChange={setSearch}>
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Tìm mã, tủ hoặc ngăn" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
        <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
          <Tabs.List>
            <Tabs.Indicator />
            <Tabs.Trigger value="all">
              <Tabs.Label>Tất cả</Tabs.Label>
            </Tabs.Trigger>
            <Tabs.Trigger value="incoming">
              <Tabs.Label>Nhận hàng</Tabs.Label>
            </Tabs.Trigger>
            <Tabs.Trigger value="outgoing">
              <Tabs.Label>Gửi đồ</Tabs.Label>
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs>
        {error ? (
          <Typography.Paragraph className="text-danger">{error}</Typography.Paragraph>
        ) : null}
        {loading
          ? [0, 1, 2].map((value) => <Skeleton key={value} className="h-24 rounded-2xl" />)
          : null}
        {!loading && filter !== "outgoing"
          ? incoming.map((parcel) => <IncomingRow key={parcel.id} parcel={parcel} />)
          : null}
        {!loading && filter !== "incoming"
          ? outgoing.map((item) => <OutgoingRow key={item.id} item={item} />)
          : null}
        {!loading &&
        !error &&
        ((filter === "incoming" && incoming.length === 0) ||
          (filter === "outgoing" && outgoing.length === 0) ||
          (filter === "all" && incoming.length + outgoing.length === 0)) ? (
          <Card>
            <Card.Body className="items-center gap-2 py-10">
              <GravityIcon name="clock" size={32} />
              <Typography.Heading className="text-lg">Chưa có hoạt động phù hợp</Typography.Heading>
            </Card.Body>
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function IncomingRow({ parcel }: { parcel: ParcelListItem }): JSX.Element {
  return (
    <PressableFeedback onPress={() => router.push(`/parcels/${parcel.id}`)}>
      <Card>
        <Card.Body className="flex-row items-center gap-3 py-3">
          <View className="h-16 w-16 items-center justify-center rounded-xl bg-accent-soft">
            <GravityIcon name="package" tone="accent" />
          </View>
          <View className="flex-1 gap-1">
            <View className="flex-row items-center justify-between gap-2">
              <Typography.Heading className="text-base">{parcel.parcelCode}</Typography.Heading>
              <StatusBadge
                label={parcel.status === "Retrieved" ? "Đã nhận" : "Đã chuyển kho"}
                tone="default"
              />
            </View>
            <Typography.Paragraph className="text-sm text-muted">
              {parcel.lockerCode} · Ngăn {parcel.compartmentCode}
            </Typography.Paragraph>
            <Typography.Paragraph className="text-xs text-muted">
              {dateFormatter.format(new Date(parcel.retrievedAt ?? parcel.storedAt))}
            </Typography.Paragraph>
          </View>
        </Card.Body>
      </Card>
    </PressableFeedback>
  );
}

function OutgoingRow({ item }: { item: ReturnRequestItem }): JSX.Element {
  const label = item.status === 3 ? "Đã lấy" : item.status === 4 ? "Đã hủy" : "Chờ lấy";
  return (
    <PressableFeedback
      onPress={() => router.push({ pathname: "/returns/[id]", params: { id: item.id } })}
    >
      <Card>
        <Card.Body className="flex-row items-center gap-3 py-3">
          <Image source={{ uri: item.imageUrl }} className="h-16 w-16 rounded-xl bg-default" />
          <View className="flex-1 gap-1">
            <View className="flex-row items-center justify-between gap-2">
              <Typography.Heading className="text-base">
                {item.pickupCode || "Đồ gửi"}
              </Typography.Heading>
              <StatusBadge label={label} tone={item.status === 3 ? "success" : "default"} />
            </View>
            <Typography.Paragraph className="text-sm text-muted">
              {item.lockerCode}
              {item.compartmentCode ? ` · Ngăn ${item.compartmentCode}` : ""}
            </Typography.Paragraph>
            <Typography.Paragraph className="text-xs text-muted">
              {dateFormatter.format(new Date(item.shipperPickedUpAt ?? item.createdAt))}
            </Typography.Paragraph>
          </View>
        </Card.Body>
      </Card>
    </PressableFeedback>
  );
}
