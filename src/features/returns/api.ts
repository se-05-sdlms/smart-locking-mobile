import { File } from "expo-file-system";

import type { ReturnDeposit, ReturnRequestItem, ReturnUnlock } from "@/features/returns/types";
import { apiRequest } from "@/lib/api-client";

export const returnApi = {
  uploadImage: async (uri: string): Promise<string> => {
    const form = new FormData();
    form.append("file", new File(uri), `return-${Date.now()}.jpg`);
    const result = await apiRequest<{ url: string }>("/uploads/return-image", { method: "POST", body: form, authenticated: true });
    return result.url;
  },
  create: (imageUrl: string, note?: string) => apiRequest<ReturnRequestItem>("/returns", { method: "POST", body: JSON.stringify({ imageUrl, note }), authenticated: true }),
  getMine: () => apiRequest<ReturnRequestItem[]>("/returns", { authenticated: true }),
  get: (id: string) => apiRequest<ReturnRequestItem>(`/returns/${id}`, { authenticated: true }),
  allocateAndOpen: (id: string) => apiRequest<ReturnUnlock>(`/returns/${id}/allocate-open`, { method: "POST", authenticated: true }),
  confirmDeposit: (id: string) => apiRequest<ReturnDeposit>(`/returns/${id}/confirm-deposit`, { method: "POST", authenticated: true }),
};
