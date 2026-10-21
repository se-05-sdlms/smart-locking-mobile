import type { ResidentNotification } from "@/features/notifications/types";
import { apiRequest, pageItems, type PageResponse } from "@/lib/api-client";

export const notificationApi = {
  // Backend returns a bounded array, not numbered pages. Never append repeated results.
  getPage: () =>
    apiRequest<ResidentNotification[]>("/notifications?limit=100", { authenticated: true }),
  getAll: (unreadOnly = false) =>
    apiRequest<PageResponse<ResidentNotification>>(
      `/notifications?unreadOnly=${unreadOnly}&limit=100`,
      { authenticated: true }
    ).then(pageItems),
  markRead: (id: string) =>
    apiRequest<ResidentNotification>(`/notifications/${id}/read`, {
      method: "PATCH",
      authenticated: true,
    }),
  markAllRead: () =>
    apiRequest<{ updatedCount: number }>("/notifications/read-all", {
      method: "PATCH",
      authenticated: true,
    }),
  registerDevice: (body: { installationId: string; expoPushToken: string; platform: string }) =>
    apiRequest(`/device-installations/${encodeURIComponent(body.installationId)}`, {
      method: "PUT",
      body: JSON.stringify({ expoPushToken: body.expoPushToken, platform: body.platform }),
      authenticated: true,
    }),
  deactivateDevice: (installationId: string) =>
    apiRequest<void>(`/device-installations/${encodeURIComponent(installationId)}`, {
      method: "DELETE",
      authenticated: true,
    }),
};
