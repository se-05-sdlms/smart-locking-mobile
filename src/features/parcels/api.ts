import type {
  ParcelDetail,
  ParcelListItem,
  ParcelStatusHistory,
  PickupConfirmationResponse,
  PickupUnlockResponse,
} from "@/features/parcels/types";
import { apiRequest } from "@/lib/api-client";

export const parcelApi = {
  getActive: () => apiRequest<ParcelListItem[]>("/parcels?view=active", { authenticated: true }),
  getHistory: (filters?: { search?: string; from?: string; to?: string }) => {
    const query = new URLSearchParams({ view: "history" });
    if (filters?.search) query.set("search", filters.search);
    if (filters?.from) query.set("from", `${filters.from}T00:00:00+07:00`);
    if (filters?.to) query.set("to", `${filters.to}T23:59:59+07:00`);
    return apiRequest<ParcelListItem[]>(`/parcels?${query}`, { authenticated: true });
  },
  getDetail: (id: string) => apiRequest<ParcelDetail>(`/parcels/${id}`, { authenticated: true }),
  getStatusHistory: (id: string) =>
    apiRequest<ParcelStatusHistory[]>(`/parcels/${id}/history`, { authenticated: true }),
  unlockPickup: (id: string) =>
    apiRequest<PickupUnlockResponse>(`/parcels/${id}/unlock-pickup`, {
      method: "POST",
      authenticated: true,
    }),
  confirmPickup: (id: string, accessEventId: string) =>
    apiRequest<PickupConfirmationResponse>(`/parcels/${id}/confirm-pickup`, {
      method: "POST",
      body: JSON.stringify({ accessEventId }),
      authenticated: true,
    }),
};
