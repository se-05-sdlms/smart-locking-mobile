import { File } from "expo-file-system";

import type { ReturnRequestItem, ReturnUnlock } from "@/features/returns/types";
import { apiRequest, pageItems, type PageResponse } from "@/lib/api-client";

export const returnApi = {
  uploadImage: async (uri: string): Promise<string> => {
    const form = new FormData();
    form.append("file", new File(uri), `return-${Date.now()}.jpg`);
    const result = await apiRequest<{ url: string }>("/uploads/images", { method: "POST", body: form, authenticated: true });
    return result.url;
  },
  create: (imageUrl: string, note?: string) => apiRequest<ReturnRequestItem>("/returns", { method: "POST", body: JSON.stringify({ imageUrl, note }), authenticated: true }),
  getMine: () => apiRequest<PageResponse<ReturnRequestItem>>("/returns?pageSize=100", { authenticated: true }).then(pageItems),
  get: (id: string) => apiRequest<ReturnRequestItem>(`/returns/${id}`, { authenticated: true }),
  allocateAndOpen: (id: string) => apiRequest<ReturnUnlock>(`/returns/${id}:openCompartment`, { method: "POST", authenticated: true }),
};
