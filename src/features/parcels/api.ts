import type { ParcelListItem } from "@/features/parcels/types";
import { apiRequest } from "@/lib/api-client";

export const parcelApi = {
  getActive: () => apiRequest<ParcelListItem[]>("/parcels?view=active", { authenticated: true }),
};
