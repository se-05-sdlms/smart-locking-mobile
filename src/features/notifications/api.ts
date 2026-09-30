import type { ResidentNotification } from "@/features/notifications/types";
import { apiRequest } from "@/lib/api-client";

export const notificationApi = {
  getAll: (unreadOnly = false) =>
    apiRequest<ResidentNotification[]>(`/notifications?unreadOnly=${unreadOnly}&limit=50`, {
      authenticated: true,
    }),
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
    apiRequest("/device-installations", {
      method: "PUT",
      body: JSON.stringify(body),
      authenticated: true,
    }),
  deactivateDevice: (installationId: string) =>
    apiRequest<void>(`/device-installations/${encodeURIComponent(installationId)}`, {
      method: "DELETE",
      authenticated: true,
    }),
};
