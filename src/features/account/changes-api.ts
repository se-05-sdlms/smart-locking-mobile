import { apiRequest, type PageResponse } from "@/lib/api-client";

export type AccountChangeBlocker = { kind: string; id: string; message: string };
export type AccountChange = {
  id: string;
  residentUserId: string;
  kind: "Locker" | "Phone";
  status: "Submitted" | "Applied" | "Rejected" | "Cancelled";
  reason: string;
  originalLockerId: string | null;
  targetLockerId: string | null;
  targetLockerCode: string | null;
  originalPhoneNumber: string | null;
  newPhoneNumber: string | null;
  phoneVerificationExpiresAt: string | null;
  reviewReason: string | null;
  createdAt: string;
  updatedAt: string;
  appliedAt: string | null;
  blockers: AccountChangeBlocker[];
  history: { id: string; action: string; message: string; createdAt: string }[];
};
export type LockerChangeEligibility = {
  targetLockerId: string;
  canApply: boolean;
  blockers: AccountChangeBlocker[];
};
const root = "/resident-account-changes";
const post = <T>(path: string, body?: unknown) =>
  apiRequest<T>(root + path, {
    authenticated: true,
    method: "POST",
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
export const accountChangesApi = {
  list: (pageNumber: number) =>
    apiRequest<PageResponse<AccountChange>>(`${root}?pageNumber=${pageNumber}&pageSize=30`, {
      authenticated: true,
    }),
  get: (id: string) => apiRequest<AccountChange>(`${root}/${id}`, { authenticated: true }),
  eligibility: (targetLockerId: string) =>
    apiRequest<LockerChangeEligibility>(`${root}/locker-eligibility/${targetLockerId}`, {
      authenticated: true,
    }),
  locker: (targetLockerId: string, reason: string) =>
    post<AccountChange>("/locker", { targetLockerId, reason }),
  requestOtp: (newPhoneNumber: string, currentPassword: string) =>
    post<void>("/phone:request-otp", { newPhoneNumber, currentPassword }),
  phone: (newPhoneNumber: string, currentPassword: string, otpCode: string, reason: string) =>
    post<AccountChange>("/phone", { newPhoneNumber, currentPassword, otpCode, reason }),
  cancel: (id: string) => post<AccountChange>(`/${id}:cancel`),
};
export const changeStatus: Record<AccountChange["status"], string> = {
  Submitted: "Chờ quản trị viên xử lý",
  Applied: "Đã áp dụng",
  Rejected: "Đã từ chối",
  Cancelled: "Đã hủy",
};
