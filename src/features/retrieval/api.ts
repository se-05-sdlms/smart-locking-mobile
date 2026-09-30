import type { PickupUnlockResult } from "@/features/retrieval/types";
import { apiRequest } from "@/lib/api-client";

export const retrievalApi = {
  unlockParcel: (parcelId: string) =>
    apiRequest<PickupUnlockResult>(`/parcels/${parcelId}/unlock-pickup`, {
      method: "POST",
      authenticated: true,
    }),
};
