import { ENV } from "@/config/env";
import { clearSession, readSession, saveSession } from "@/features/auth/storage";
import type { AuthSession } from "@/features/auth/types";

type RequestOptions = RequestInit & { authenticated?: boolean; retry?: boolean };

export type PagedResponse<T> = {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
};

export type PageResponse<T> = T[] | PagedResponse<T>;

export const pageItems = <T>(response: PageResponse<T>): T[] =>
  Array.isArray(response) ? response : response.items;

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

    const next = await apiRequest<AuthSession>("/auth/refresh-token", {
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

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { authenticated, retry, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ENV.API_TIMEOUT);
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");

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
      return apiRequest<T>(path, { ...options, retry: false });
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
