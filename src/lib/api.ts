import { ENV } from "@/config/env";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ENV.API_TIMEOUT);

  try {
    const response = await fetch(`${ENV.API_URL}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        ...options.headers,
      },
      signal: controller.signal,
    });
    const payload = response.status === 204 ? null : await response.json().catch(() => null);

    if (!response.ok) {
      throw new ApiError(payload?.message || "Không thể kết nối đến máy chủ.", response.status);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Máy chủ phản hồi quá lâu. Vui lòng thử lại.");
    }
    throw new Error("Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.");
  } finally {
    clearTimeout(timeout);
  }
}
