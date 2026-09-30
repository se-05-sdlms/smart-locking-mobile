import type {
  AuthSession,
  PendingRegistration,
  RegistrationLocker,
  UserProfile,
} from "@/features/auth/types";
import { apiRequest } from "@/lib/api-client";

export const authApi = {
  getRegistrationLockers: () => apiRequest<RegistrationLocker[]>("/auth/registration-lockers"),
  requestRegistrationOtp: (phoneNumber: string) =>
    apiRequest<void>("/auth/registration-otp/request", {
      method: "POST",
      body: JSON.stringify({ phoneNumber }),
    }),
  register: (payload: PendingRegistration & { otpCode: string }) =>
    apiRequest<AuthSession>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  login: (loginIdentifier: string, password: string) =>
    apiRequest<AuthSession>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ loginIdentifier, password }),
    }),
  me: () => apiRequest<UserProfile>("/auth/me", { authenticated: true }),
  forgotPassword: (loginIdentifier: string) =>
    apiRequest<void>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ loginIdentifier }),
    }),
  resetPassword: (loginIdentifier: string, otpCode: string, newPassword: string) =>
    apiRequest<void>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ loginIdentifier, otpCode, newPassword }),
    }),
  logout: (refreshToken: string) =>
    apiRequest<void>("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),
};
