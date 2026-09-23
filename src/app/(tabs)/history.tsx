import { Chip, Typography } from "heroui-native";
import type { JSX } from "react";
import { ScrollView, View } from "react-native";

import { ParcelCard } from "@/components/parcel-card";
import { AppScreen } from "@/components/ui/app-screen";
import { historyParcels } from "@/data/mock-data";

export default function HistoryScreen(): JSX.Element {
  return (
    <AppScreen padded={false}>
      <View className="flex-1 px-5 pt-3">
        <View className="mb-4 h-12 flex-row items-center justify-between">
          <Typography.Heading className="text-xl">Lịch sử nhận hàng</Typography.Heading>
          <Chip color="success" variant="soft">
            {historyParcels.length} đơn
          </Chip>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-3 pb-4">
          {historyParcels.map((parcel) => (
            <ParcelCard key={parcel.id} parcel={parcel} compact />
          ))}
        </ScrollView>
      </View>
    </AppScreen>
  );
}
