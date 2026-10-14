import type { ResidentNotification } from "@/features/notifications/types";
import { apiRequest, pageItems, type PageResponse } from "@/lib/api-client";

export const notificationApi = {
  getPage: (page = 1) =>
    apiRequest<PageResponse<ResidentNotification>>(
      `/notifications?pageNumber=${page}&pageSize=30`,
      { authenticated: true }
    ),
  getAll: (unreadOnly = false) =>
    apiRequest<PageResponse<ResidentNotification>>(
      `/notifications?unreadOnly=${unreadOnly}&pageSize=50`,
      { authenticated: true }
    ).then(pageItems),
  markRead: (id: string) =>
    apiRequest<ResidentNotification>(`/notifications/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ isRead: true }),
      authenticated: true,
    }),
  markAllRead: () =>
    apiRequest<{ updatedCount: number }>("/notifications:markAllRead", {
      method: "POST",
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
