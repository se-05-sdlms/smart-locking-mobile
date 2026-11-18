import { apiRequest } from "@/lib/api-client";

export type LockerSupport = {
  lockerCode: string;
  isAvailable: boolean;
  isFallback: boolean;
  contactName: string | null;
  phoneNumber: string | null;
  supportHours: string | null;
  instructions: string;
  refreshedAt: string;
};

export const lockerSupportApi = {
  forLocker: (lockerId: string) =>
    apiRequest<LockerSupport>(`/lockers/${encodeURIComponent(lockerId)}/support`, {
      authenticated: true,
    }),
  byCode: (code: string) =>
    apiRequest<LockerSupport>(`/lockers/public/by-code/${encodeURIComponent(code)}/support`),
};
