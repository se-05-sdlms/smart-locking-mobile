import { apiRequest } from "@/lib/api-client";
import type { DeliveryApprovalMode } from "@/features/delivery-requests/types";

export type ResidentProfile = {
  id: string;
  userId: string;
  fullName: string;
  phoneNumber: string | null;
  email: string | null;
  registeredLockerId: string | null;
  dateOfBirth: string | null;
  avatarUrl: string | null;
  deliveryApprovalMode: DeliveryApprovalMode;
};
export type ProfileInput = Pick<ResidentProfile, "fullName" | "dateOfBirth" | "avatarUrl">;

export const residentAccountApi = {
  get: () => apiRequest<ResidentProfile>("/residents/me", { authenticated: true }),
  update: (input: ProfileInput) =>
    apiRequest<ResidentProfile>("/residents/me", {
      method: "PUT",
      authenticated: true,
      body: JSON.stringify(input),
    }),
};
