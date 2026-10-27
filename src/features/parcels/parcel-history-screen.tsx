import { router } from "expo-router";
import { PressableFeedback, SearchField, Tabs, Typography } from "heroui-native";
import type { JSX } from "react";
import { useMemo, useState } from "react";
import { View } from "react-native";
import { GravityIcon } from "@/components/icons/gravity-icon";
import { ParcelImage } from "@/components/ui/parcel-image";
import { ResidentFeed } from "@/components/ui/resident-feed";
import { StatusBadge } from "@/components/ui/status-badge";
import { useResidentFeed } from "@/features/navigation/use-resident-feed";
import { parcelApi } from "@/features/parcels/api";
import type { ParcelListItem } from "@/features/parcels/types";
import { returnApi } from "@/features/returns/api";
import type { ReturnRequestItem } from "@/features/returns/types";

type Filter = "all" | "incoming" | "outgoing";
type HistoryRow =
  { kind: "incoming"; value: ParcelListItem } | { kind: "outgoing"; value: ReturnRequestItem };
const dateFormatter = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" });
export function ParcelHistoryContent(): JSX.Element {
  const incoming = useResidentFeed(parcelApi.getHistoryPage);
  const outgoing = useResidentFeed(returnApi.getPage);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();
  const visible = useMemo(() => {
    const rows: HistoryRow[] = [];
    if (filter !== "outgoing")
      incoming.items.forEach((value) => {
        if (
          !query ||
          `${value.parcelCode} ${value.lockerCode} ${value.compartmentCode}`
            .toLowerCase()
            .includes(query)
        )
          rows.push({ kind: "incoming", value });
      });
    if (filter !== "incoming")
      outgoing.items.forEach((value) => {
        if (
          value.status >= 2 &&
          (!query ||
            `${value.pickupCode} ${value.lockerCode} ${value.compartmentCode ?? ""}`
              .toLowerCase()
              .includes(query))
        )
          rows.push({ kind: "outgoing", value });
      });
    return rows.sort(
      (a, b) =>
        new Date(
          b.kind === "incoming"
            ? (b.value.retrievedAt ?? b.value.storedAt)
            : (b.value.shipperPickedUpAt ?? b.value.createdAt)
        ).getTime() -
        new Date(
          a.kind === "incoming"
            ? (a.value.retrievedAt ?? a.value.storedAt)
            : (a.value.shipperPickedUpAt ?? a.value.createdAt)
        ).getTime()
    );
  }, [incoming.items, outgoing.items, filter, query]);
  const relevant =
    filter === "incoming" ? [incoming] : filter === "outgoing" ? [outgoing] : [incoming, outgoing];
  return (
    <ResidentFeed
      tab
      items={visible}
      keyExtractor={(row) => `${row.kind}-${row.value.id}`}
      renderItem={({ item }) =>
        item.kind === "incoming" ? (
          <IncomingRow parcel={item.value} />
        ) : (
          <OutgoingRow item={item.value} />
        )
      }
      loading={relevant.some((feed) => feed.loading)}
      refreshing={relevant.some((feed) => feed.refreshing)}
      loadingMore={relevant.some((feed) => feed.loadingMore)}
      hasMore={relevant.some((feed) => feed.hasMore)}
      error={relevant
        .map((feed) => feed.error)
        .filter(Boolean)
        .join("\n")}
      paginationError={relevant
        .map((feed) => feed.paginationError)
        .filter(Boolean)
        .join("\n")}
      onRetryMore={() =>
        relevant.forEach((feed) => {
          if (feed.paginationError) feed.retryMore();
        })
      }
      onRefresh={() => relevant.forEach((feed) => feed.refresh())}
      onLoadMore={() => relevant.forEach((feed) => feed.loadMore())}
      emptyTitle={query ? "Không có kết quả tìm kiếm" : "Chưa có lịch sử"}
      empty={
        query
          ? relevant.some((feed) => feed.hasMore)
            ? "Chưa tìm thấy trong lịch sử đã tải. Tải thêm để tìm hoạt động cũ hơn."
            : "Thử tìm bằng mã bưu kiện, tủ hoặc ngăn khác."
          : "Chưa có hoạt động trong mục này."
      }
      icon="clock"
      header={
        <>
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
        </>
      }
    />
  );
}

function IncomingRow({ parcel }: { parcel: ParcelListItem }): JSX.Element {
  return (
    <PressableFeedback
      accessibilityRole="button"
      accessibilityLabel={`Xem bưu kiện ${parcel.parcelCode}`}
      onPress={() => router.push(`/parcels/${parcel.id}`)}
    >
      <View className="border-b border-separator">
        <View className="flex-row items-center gap-3 py-4">
          <View className="h-16 w-16 items-center justify-center rounded-xl bg-accent-soft">
            <GravityIcon name="package" tone="accent" />
          </View>
          <View className="min-w-0 flex-1 gap-1">
            <View className="min-w-0 gap-1">
              <Typography.Heading className="text-base" numberOfLines={1} ellipsizeMode="middle">
                {parcel.parcelCode}
              </Typography.Heading>
              <StatusBadge
                label={parcel.status === "Retrieved" ? "Đã nhận" : "Đã thu hồi"}
                tone="default"
              />
            </View>
            <Typography.Paragraph className="text-sm text-muted">
              {parcel.lockerCode} · Ngăn {parcel.compartmentCode}
            </Typography.Paragraph>
            <Typography.Paragraph className="text-xs text-muted">
              {dateFormatter.format(new Date(parcel.retrievedAt ?? parcel.removedAt ?? parcel.storedAt))}
            </Typography.Paragraph>
          </View>
        </View>
      </View>
    </PressableFeedback>
  );
}

function OutgoingRow({ item }: { item: ReturnRequestItem }): JSX.Element {
  const label = item.status === 3 ? "Đã lấy" : item.status === 4 ? "Đã hủy" : "Chờ lấy";
  return (
    <PressableFeedback
      accessibilityRole="button"
      accessibilityLabel={`Xem đồ gửi ${item.pickupCode || item.lockerCode}`}
      onPress={() => router.push({ pathname: "/returns/[id]", params: { id: item.id } })}
    >
      <View className="border-b border-separator">
        <View className="flex-row items-center gap-3 py-4">
          <ParcelImage
            uri={item.imageUrl}
            recyclingKey={item.id}
            style={{ width: 56, height: 56, borderRadius: 12 }}
          />
          <View className="min-w-0 flex-1 gap-1">
            <View className="min-w-0 gap-1">
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
        </View>
      </View>
    </PressableFeedback>
  );
}
