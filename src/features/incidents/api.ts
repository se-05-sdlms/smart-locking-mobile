import { apiRequest, pageItems, type PageResponse } from "@/lib/api-client";

export type IncidentStatus = 0 | 1 | 2 | 3;
export type IncidentItem = {
  id: string;
  type: string;
  status: IncidentStatus;
  title: string;
  lockerCode: string;
  createdAt: string;
  updatedAt: string;
};
export type IncidentDetail = IncidentItem & {
  description: string;
  evidenceUrl: string | null;
  resolutionSummary: string | null;
};
export const incidentApi = {
  getPage: (page = 1) =>
    apiRequest<PageResponse<IncidentItem>>(`/incidents/mine?pageNumber=${page}&pageSize=30`, {
      authenticated: true,
    }),
  getMine: () =>
    apiRequest<PageResponse<IncidentItem>>("/incidents/mine", { authenticated: true }).then(
      pageItems
    ),
  get: (id: string) => apiRequest<IncidentDetail>(`/incidents/${id}`, { authenticated: true }),
  create: (body: {
    type: string;
    title: string;
    description: string;
    lockerId: string;
    parcelId?: string;
    returnRequestId?: string;
    paymentTransactionId?: string;
    evidenceUrl?: string;
  }) =>
    apiRequest<IncidentDetail>("/incidents", {
      method: "POST",
      body: JSON.stringify(body),
      authenticated: true,
    }),
};
