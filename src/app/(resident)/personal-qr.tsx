import type { JSX } from "react";

import { PlaceholderScreen } from "@/features/navigation/placeholder-screen";

export default function PersonalQrScreen(): JSX.Element {
  return (
    <PlaceholderScreen
      title="Mã QR cá nhân"
      description="Mã nhận hàng cá nhân sẽ hiển thị tại đây."
    />
  );
}
