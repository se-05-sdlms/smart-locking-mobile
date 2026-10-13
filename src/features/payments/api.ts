import type { CreatedPayment, PaymentTransaction } from "@/features/payments/types";
import { apiRequest } from "@/lib/api-client";

export const paymentApi = {
  create: (overdueChargeId: string) =>
    apiRequest<CreatedPayment>("/payments", {
      method: "POST",
      authenticated: true,
      body: JSON.stringify({ overdueChargeId }),
    }),
  get: (id: string) => apiRequest<PaymentTransaction>(`/payments/${id}`, { authenticated: true }),
};
