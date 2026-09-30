import type { PersonalQr, PickupUnlockResult } from "@/features/retrieval/types";
import { apiRequest } from "@/lib/api-client";

export const retrievalApi = {
  getPersonalQr: () => apiRequest<PersonalQr>("/residents/me/qr", { authenticated: true }),
  unlockParcel: (parcelId: string) =>
    apiRequest<PickupUnlockResult>(`/parcels/${parcelId}/unlock-pickup`, {
      method: "POST",
      authenticated: true,
    }),
};
