import type {
  DeliveryApprovalMode,
  PendingDeliveryRequest,
  ResidentApprovalProfile,
} from "@/features/delivery-requests/types";
import { apiRequest, pageItems, type PageResponse } from "@/lib/api-client";

export const deliveryRequestApi = {
  getPending: () =>
    apiRequest<PageResponse<PendingDeliveryRequest>>(
      "/delivery-requests?status=pending&pageSize=100",
      { authenticated: true }
    ).then(pageItems),
  approve: (id: string) =>
    apiRequest(`/delivery-requests/${id}:approve`, { method: "POST", authenticated: true }),
  reject: (id: string) =>
    apiRequest(`/delivery-requests/${id}:reject`, { method: "POST", authenticated: true }),
  getProfile: () => apiRequest<ResidentApprovalProfile>("/residents/me", { authenticated: true }),
  updateApprovalMode: (deliveryApprovalMode: DeliveryApprovalMode) =>
    apiRequest<ResidentApprovalProfile>("/residents/me", {
      method: "PATCH",
      body: JSON.stringify({ deliveryApprovalMode }),
      authenticated: true,
    }),
};
