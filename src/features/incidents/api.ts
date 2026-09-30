import { apiRequest } from "@/lib/api-client";
import type {
  CreateIncidentRequest,
  IncidentDetail,
  IncidentListItem,
} from "@/features/incidents/types";

export const incidentApi = {
  create: (request: CreateIncidentRequest) =>
    apiRequest<IncidentDetail>("/incidents", {
      method: "POST",
      body: JSON.stringify(request),
      authenticated: true,
    }),
  getMine: () => apiRequest<IncidentListItem[]>("/incidents/mine", { authenticated: true }),
  getDetail: (id: string) =>
    apiRequest<IncidentDetail>(`/incidents/${id}`, { authenticated: true }),
};
