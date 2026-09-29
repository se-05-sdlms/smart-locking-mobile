import type { JSX } from "react";

import { PlaceholderScreen } from "@/features/navigation/placeholder-screen";

export default function RequestsScreen(): JSX.Element {
  return (
    <PlaceholderScreen
      title="Yêu cầu giao hàng"
      description="Các yêu cầu đang chờ bạn phê duyệt."
    />
  );
}
