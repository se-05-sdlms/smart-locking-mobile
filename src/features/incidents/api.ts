import { apiRequest } from "@/lib/api-client";

export type IncidentItem = { id: string; type: string; status: string; title: string; lockerCode: string; createdAt: string; updatedAt: string };
export type IncidentDetail = IncidentItem & { description: string; evidenceUrl: string | null; resolutionSummary: string | null };
export const incidentApi = {
  getMine: () => apiRequest<IncidentItem[]>("/incidents/mine", { authenticated: true }),
  get: (id: string) => apiRequest<IncidentDetail>(`/incidents/${id}`, { authenticated: true }),
  create: (body: { type: string; title: string; description: string; lockerId: string; evidenceUrl?: string }) => apiRequest<IncidentDetail>("/incidents", { method: "POST", body: JSON.stringify(body), authenticated: true }),
};
