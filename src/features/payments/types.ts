export type PaymentTransaction = {
  id: string;
  overdueChargeId: string;
  amount: number;
  currency: string;
  status: 0 | 1 | 2 | 3 | "Pending" | "Success" | "Failed" | "Cancelled";
  checkoutUrl: string | null;
  requestedAt: string;
  completedAt: string | null;
};

export function paymentState(status: PaymentTransaction["status"]) {
  if (status === 1 || status === "Success")
    return { label: "Đã thanh toán", tone: "success" as const, success: true, pending: false };
  if (status === 2 || status === "Failed")
    return {
      label: "Thanh toán thất bại",
      tone: "danger" as const,
      success: false,
      pending: false,
    };
  if (status === 3 || status === "Cancelled")
    return { label: "Đã hủy", tone: "warning" as const, success: false, pending: false };
  return {
    label: "Chờ xác nhận thanh toán",
    tone: "default" as const,
    success: false,
    pending: true,
  };
}

export function checkoutUrl(value: string | null): string {
  if (!value || new URL(value).protocol !== "https:")
    throw new Error("Liên kết thanh toán chưa sẵn sàng hoặc không an toàn.");
  return value;
}
