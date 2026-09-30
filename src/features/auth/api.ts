import { ENV } from "@/config/env";
import { clearSession, readSession, saveSession } from "@/features/auth/storage";
import type {
  AuthSession,
  PendingRegistration,
  RegistrationLocker,
  UserProfile,
} from "@/features/auth/types";

type RequestOptions = RequestInit & { authenticated?: boolean; retry?: boolean };

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

let refreshPromise: Promise<AuthSession> | null = null;
let sessionExpiredHandler: (() => void) | undefined;

export function onSessionExpired(handler: () => void): () => void {
  sessionExpiredHandler = handler;
  return () => {
    if (sessionExpiredHandler === handler) sessionExpiredHandler = undefined;
  };
}

async function parseError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message || "Yêu cầu không thể thực hiện.";
  } catch {
    return "Yêu cầu không thể thực hiện.";
  }
}

async function refreshSession(): Promise<AuthSession> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const current = await readSession();
    if (!current?.refreshToken) throw new ApiError("Phiên đăng nhập đã hết hạn.", 401);

    const next = await request<AuthSession>("/auth/refresh-token", {
      method: "POST",
      body: JSON.stringify({ refreshToken: current.refreshToken }),
      retry: false,
    });
    await saveSession(next);
    return next;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { authenticated, retry, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ENV.API_TIMEOUT);
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body) headers.set("Content-Type", "application/json");

  if (authenticated) {
    const session = await readSession();
    if (session?.accessToken) headers.set("Authorization", `Bearer ${session.accessToken}`);
  }

  try {
    const response = await fetch(`${ENV.API_URL}${path}`, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });

    if (response.status === 401 && authenticated && retry !== false) {
      try {
        await refreshSession();
      } catch {
        await clearSession();
        sessionExpiredHandler?.();
        throw new ApiError("Phiên đăng nhập đã hết hạn.", 401);
      }
      return request<T>(path, { ...options, retry: false });
    }

    if (!response.ok) throw new ApiError(await parseError(response), response.status);
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (controller.signal.aborted) throw new ApiError("Kết nối máy chủ quá thời gian.", 0);
    throw new ApiError("Không thể kết nối máy chủ. Vui lòng thử lại.", 0);
  } finally {
    clearTimeout(timeout);
  }
}

export const authApi = {
  getRegistrationLockers: () => request<RegistrationLocker[]>("/auth/registration-lockers"),
  requestRegistrationOtp: (phoneNumber: string) =>
    request<void>("/auth/registration-otp/request", {
      method: "POST",
      body: JSON.stringify({ phoneNumber }),
    }),
  register: (payload: PendingRegistration & { otpCode: string }) =>
    request<AuthSession>("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (loginIdentifier: string, password: string) =>
    request<AuthSession>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ loginIdentifier, password }),
    }),
  me: () => request<UserProfile>("/auth/me", { authenticated: true }),
  forgotPassword: (loginIdentifier: string) =>
    request<void>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ loginIdentifier }),
    }),
  resetPassword: (loginIdentifier: string, otpCode: string, newPassword: string) =>
    request<void>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ loginIdentifier, otpCode, newPassword }),
    }),
  logout: (refreshToken: string) =>
    request<void>("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),
};
