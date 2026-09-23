import { router } from "expo-router";
import { Card, Chip } from "heroui-native";
import type { JSX } from "react";
import { Pressable, View } from "react-native";

import { AppIcon } from "@/components/icons/app-icon";
import { ParcelBox } from "@/components/parcel-box";
import type { Parcel } from "@/data/mock-data";

const status = {
  today: { label: "Cần lấy hôm nay", color: "danger" as const },
  soon: { label: "Sắp quá hạn", color: "warning" as const },
  overdue: { label: "Đã quá hạn", color: "danger" as const },
  received: { label: "Đã nhận", color: "success" as const },
};

export function ParcelCard({
  parcel,
  compact = false,
}: {
  parcel: Parcel;
  compact?: boolean;
}): JSX.Element {
  const route = parcel.status === "overdue" ? "/overdue" : "/unlock";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Mở bưu kiện ${parcel.id}`}
      onPress={() => parcel.status !== "received" && router.push(route)}
    >
      <Card className="flex-row items-center gap-3 p-3">
        <View className="rounded-xl bg-default/60 p-1">
          <ParcelBox size={compact ? 46 : 56} />
        </View>
        <Card.Body className="min-w-0 gap-1 p-0">
          <View className="flex-row items-center justify-between gap-2">
            <Card.Title className="flex-1 text-sm text-accent" numberOfLines={1}>
              {parcel.id}
            </Card.Title>
            <Chip size="sm" variant="soft" color={status[parcel.status].color}>
              {status[parcel.status].label}
            </Chip>
          </View>
          <Card.Description>
            Locker {parcel.locker} · Ngăn {parcel.compartment}
          </Card.Description>
          {!compact && <Card.Description numberOfLines={1}>{parcel.address}</Card.Description>}
          {parcel.date && <Card.Description>{parcel.date}</Card.Description>}
        </Card.Body>
        {parcel.status !== "received" && <AppIcon name="chevron" size={17} tone="muted" />}
      </Card>
    </Pressable>
  );
}
