import { useLocalSearchParams } from "expo-router";
import type { JSX } from "react";

import { DeliveryRequestDetailScreen } from "@/features/delivery-requests/delivery-request-detail-screen";

export default function DeliveryRequestRoute(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DeliveryRequestDetailScreen id={id} />;
}
