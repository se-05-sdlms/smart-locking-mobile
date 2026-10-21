import type { PaymentTransaction } from "@/features/payments/types";
import { apiRequest } from "@/lib/api-client";

export const paymentApi = {
  create: (overdueChargeId: string) =>
    apiRequest<PaymentTransaction>(`/overdue-payments/charges/${overdueChargeId}/checkout`, {
      method: "POST",
      authenticated: true,
    }),
  get: (id: string) =>
    apiRequest<PaymentTransaction>(`/overdue-payments/${id}`, { authenticated: true }),
  getHistory: () => apiRequest<PaymentTransaction[]>("/overdue-payments", { authenticated: true }),
};
