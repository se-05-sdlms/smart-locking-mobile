import type {
  DeliveryApprovalMode,
  PendingDeliveryRequest,
  ResidentApprovalProfile,
} from "@/features/delivery-requests/types";
import { apiRequest } from "@/lib/api-client";

export const deliveryRequestApi = {
  getPending: () =>
    apiRequest<PendingDeliveryRequest[]>("/delivery-requests/pending", {
      authenticated: true,
    }),
  approve: (id: string) =>
    apiRequest(`/delivery-requests/${id}/approve`, { method: "POST", authenticated: true }),
  reject: (id: string) =>
    apiRequest(`/delivery-requests/${id}/reject`, { method: "POST", authenticated: true }),
  getProfile: () => apiRequest<ResidentApprovalProfile>("/residents/me", { authenticated: true }),
  updateApprovalMode: (deliveryApprovalMode: DeliveryApprovalMode) =>
    apiRequest<ResidentApprovalProfile>("/residents/me/approval-mode", {
      method: "PUT",
      body: JSON.stringify({ deliveryApprovalMode }),
      authenticated: true,
    }),
};
