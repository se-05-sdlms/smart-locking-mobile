import { useLocalSearchParams } from "expo-router";
import type { JSX } from "react";

import { PlaceholderScreen } from "@/features/navigation/placeholder-screen";

export default function IncidentDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <PlaceholderScreen
      title="Chi tiết sự cố"
      description={`Sự cố ${id} sẽ được hiển thị khi tính năng quản lý sự cố hoàn tất.`}
    />
  );
}
