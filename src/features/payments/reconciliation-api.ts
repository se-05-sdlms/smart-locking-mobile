import { apiRequest, type PagedResponse } from "@/lib/api-client";

export type PaymentKind = "Subscription" | "Overdue";
export type PaymentLookup = {
  kind: PaymentKind;
  id: string;
  orderCode: string | null;
  amount: number;
  currency: string;
  status: string;
  reconciliationId: string | null;
};
export type PaymentReconciliation = {
  id: string;
  reference: string;
  kind: PaymentKind;
  paymentId: string;
  reason: string;
  status: string;
  response: string | null;
  providerStatus: string | null;
  providerCheckedAt: string | null;
  updatedAt: string;
  nextStep: string;
  history: { id: string; action: string; status: string; message: string; createdAt: string }[];
};
const base = "/payment-reconciliations";
export const reconciliationApi = {
  list: (page = 1) =>
    apiRequest<PagedResponse<PaymentReconciliation>>(`${base}?pageNumber=${page}&pageSize=30`, {
      authenticated: true,
    }),
  get: (id: string) =>
    apiRequest<PaymentReconciliation>(`${base}/${encodeURIComponent(id)}`, { authenticated: true }),
  payment: (kind: PaymentKind, id: string) =>
    apiRequest<PaymentLookup>(`${base}/payments/${kind}/${encodeURIComponent(id)}`, {
      authenticated: true,
    }),
  create: (kind: PaymentKind, paymentId: string, reason: string) =>
    apiRequest<PaymentReconciliation>(base, {
      method: "POST",
      authenticated: true,
      body: JSON.stringify({ kind, paymentId, reason }),
    }),
};
const statusLabels: Record<string, string> = {
  Submitted: "Đã tiếp nhận",
  InReview: "Đang xử lý",
  WaitingProvider: "Chờ cổng thanh toán xác minh",
  Conflict: "Cần đối chiếu thêm",
  Resolved: "Đã có kết quả",
  Closed: "Đã đóng hồ sơ",
};
export const reconciliationLabel = (status: string): string => statusLabels[status] ?? status;
