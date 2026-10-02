import type { ParcelDetail, ParcelListItem, ParcelStatusHistory } from "@/features/parcels/types";
import { apiRequest } from "@/lib/api-client";
import { ENV } from "@/config/env";
import { demoActive, demoHistory, demoParcels } from "./demo";

export const parcelDemo = ENV.PARCEL_DEMO === "active" || ENV.PARCEL_DEMO === "empty";

export const parcelApi = {
  getActive: () =>
    parcelDemo
      ? Promise.resolve(ENV.PARCEL_DEMO === "empty" ? [] : demoActive)
      : apiRequest<ParcelListItem[]>("/parcels?view=active", { authenticated: true }),
  getHistory: (filters?: { search?: string; from?: string; to?: string }) => {
    const query = new URLSearchParams({ view: "history" });
    if (filters?.search) query.set("search", filters.search);
    if (filters?.from) query.set("from", `${filters.from}T00:00:00+07:00`);
    if (filters?.to) query.set("to", `${filters.to}T23:59:59+07:00`);
    if (parcelDemo)
      return Promise.resolve(
        demoHistory.filter(
          (item) =>
            (!filters?.search ||
              item.parcelCode.toLowerCase().includes(filters.search.toLowerCase())) &&
            (!filters?.from ||
              Date.parse(item.retrievedAt ?? item.removedAt ?? item.storedAt) >=
                Date.parse(`${filters.from}T00:00:00+07:00`)) &&
            (!filters?.to ||
              Date.parse(item.retrievedAt ?? item.removedAt ?? item.storedAt) <=
                Date.parse(`${filters.to}T23:59:59+07:00`))
        )
      );
    return apiRequest<ParcelListItem[]>(`/parcels?${query}`, { authenticated: true });
  },
  getDetail: (id: string): Promise<ParcelDetail> =>
    parcelDemo
      ? demoParcels.find((item) => item.id === id)
        ? Promise.resolve(demoParcels.find((item) => item.id === id)!)
        : Promise.reject(new Error("Không tìm thấy bưu kiện demo."))
      : apiRequest<ParcelDetail>(`/parcels/${id}`, { authenticated: true }),
  getStatusHistory: (id: string) =>
    parcelDemo
      ? Promise.resolve([] as ParcelStatusHistory[])
      : apiRequest<ParcelStatusHistory[]>(`/parcels/${id}/history`, { authenticated: true }),
  unlock: (id: string) => {
    if (parcelDemo || id.startsWith("demo-"))
      return Promise.reject(new Error("Bưu kiện demo không thể mở tủ thật."));
    return apiRequest<{ result: "Succeeded" | "Blocked" | "Failed"; failureReason: string | null }>(
      `/parcels/${id}/unlock-pickup`,
      { authenticated: true, method: "POST" }
    );
  },
};
