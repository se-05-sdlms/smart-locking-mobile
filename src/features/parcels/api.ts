import type {
  ParcelDetail,
  ParcelListItem,
  ParcelStatusHistory,
  PickupUnlockResponse,
} from "@/features/parcels/types";
import { apiRequest, pageItems, type PageResponse } from "@/lib/api-client";

export const parcelApi = {
  getActive: () =>
    apiRequest<PageResponse<ParcelListItem>>("/parcels?view=Active&pageSize=100", {
      authenticated: true,
    }).then(pageItems),
  getHistory: (filters?: { search?: string; from?: string; to?: string }) => {
    const query = new URLSearchParams({ view: "History" });
    if (filters?.search) query.set("search", filters.search);
    if (filters?.from) query.set("from", `${filters.from}T00:00:00+07:00`);
    if (filters?.to) query.set("to", `${filters.to}T23:59:59+07:00`);
    query.set("pageSize", "100");
    return apiRequest<PageResponse<ParcelListItem>>(`/parcels?${query}`, {
      authenticated: true,
    }).then(pageItems);
  },
  getDetail: (id: string) => apiRequest<ParcelDetail>(`/parcels/${id}`, { authenticated: true }),
  getStatusHistory: (id: string) =>
    apiRequest<PageResponse<ParcelStatusHistory>>(`/parcels/${id}/history?pageSize=100`, {
      authenticated: true,
    }).then(pageItems),
  unlockPickup: (id: string) =>
    apiRequest<PickupUnlockResponse>(`/parcels/${id}:openCompartment`, {
      method: "POST",
      authenticated: true,
    }),
};
