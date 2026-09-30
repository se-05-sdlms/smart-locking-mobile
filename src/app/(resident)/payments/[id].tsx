import { useLocalSearchParams } from "expo-router";
import type { JSX } from "react";

import { PlaceholderScreen } from "@/features/navigation/placeholder-screen";

export default function PaymentDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <PlaceholderScreen
      title="Chi tiết thanh toán"
      description={`Giao dịch ${id} sẽ được hiển thị khi tính năng thanh toán hoàn tất.`}
    />
  );
}
