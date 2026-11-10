import { ENV } from "@/config/env";
import {
  clearSessionIfCurrent,
  isSessionCurrent,
  readSessionSnapshot,
  saveRefreshedSession,
  type SessionSnapshot,
} from "@/features/auth/storage";
import type { AuthSession } from "@/features/auth/types";
import { diagnoseApiText } from "@/lib/text-encoding-diagnostics";

type RequestOptions = RequestInit & {
  authenticated?: boolean;
  retry?: boolean;
  timeoutMs?: number;
};

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
  get retryable(): boolean {
    return this.status === 0 || this.status === 429 || this.status >= 500;
  }

  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly errors?: Record<string, string[]>
  ) {
    super(message);
  }
}

let refreshOperation: { source: SessionSnapshot; promise: Promise<AuthSession> } | null = null;
let sessionExpiredHandler: (() => void) | undefined;

export function onSessionExpired(handler: () => void): () => void {
  sessionExpiredHandler = handler;
  return () => {
    if (sessionExpiredHandler === handler) sessionExpiredHandler = undefined;
  };
}

const errorMessages: Record<string, string> = {
  "auth/invalid_credentials": "Số điện thoại hoặc mật khẩu không đúng.",
  "auth/invalid_token": "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.",
  "auth/authentication_required": "Vui lòng đăng nhập để tiếp tục.",
  "auth/token_expired": "Phiên đăng nhập đã hết hạn.",
  "auth/invalid_refresh_token": "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  "auth/invalid_otp": "Mã OTP không đúng hoặc đã hết hạn.",
  "auth/user_already_exists": "Tài khoản đã tồn tại.",
  "auth/password_change_required": "Vui lòng đổi mật khẩu để tiếp tục.",
  "auth/invalid_password": "Mật khẩu hiện tại không đúng hoặc mật khẩu mới không hợp lệ.",
  "validation/invalid_input": "Thông tin chưa hợp lệ. Vui lòng kiểm tra các trường đã nhập.",
  "common/access_denied": "Bạn không có quyền thực hiện thao tác này.",
  "common/invalid_request": "Yêu cầu không hợp lệ.",
  "common/internal_error": "Máy chủ đang gặp sự cố. Vui lòng thử lại sau.",
  "common/rate_limited": "Bạn thao tác quá nhanh. Vui lòng chờ rồi thử lại.",
  "common/request_timed_out": "Yêu cầu quá thời gian. Vui lòng thử lại.",
  "locker/not_found": "Không tìm thấy tủ.",
  "locker/not_operational": "Tủ hiện không hoạt động. Vui lòng liên hệ hỗ trợ.",
  "locker/no_available_compartment": "Tủ không còn ngăn trống phù hợp.",
  "locker/offline": "Tủ đang mất kết nối. Vui lòng thử lại sau.",
  "locker/open_failed": "Chưa mở được ngăn tủ. Vui lòng thử lại hoặc báo sự cố.",
  "parcel/not_found": "Không tìm thấy bưu kiện.",
  "parcel/payment_required": "Vui lòng thanh toán phí quá hạn trước khi nhận hàng.",
  "parcel/remote_unlock_disabled": "Tủ không cho phép mở từ xa.",
  "parcel/storage_expired": "Bưu kiện đã quá thời hạn lưu trữ.",
  "parcel/invalid_state": "Trạng thái bưu kiện không cho phép thao tác này.",
  "delivery/not_found": "Không tìm thấy yêu cầu giao hàng.",
  "delivery/invalid_state": "Yêu cầu giao hàng đã thay đổi trạng thái. Vui lòng tải lại.",
  "delivery/approval_expired": "Yêu cầu xác nhận hàng đã hết hạn.",
  "delivery/recipient_cannot_receive":
    "Bạn chưa thể nhận thêm kiện. Hãy kiểm tra gói đang hiệu lực và số kiện đang lưu; liên hệ ban quản lý nếu quyền lợi gói cần đối chiếu.",
  "return/not_found": "Không tìm thấy yêu cầu gửi hàng.",
  "return/invalid_state": "Trạng thái yêu cầu gửi hàng không cho phép thao tác này.",
  "return/invalid_pickup_code": "Mã lấy hàng không đúng hoặc đã hết hạn.",
  "incident/not_found": "Không tìm thấy sự cố.",
  "user/inactive": "Tài khoản hiện không hoạt động. Vui lòng liên hệ hỗ trợ.",
  "user/already_exists": "Tài khoản đã tồn tại.",
  "subscription/invalid_payment": "Thanh toán gói chưa hợp lệ.",
  "payment/unavailable": "Dịch vụ thanh toán đang tạm ngừng. Vui lòng thử lại sau.",
  "payment/invalid_request": "Yêu cầu thanh toán không hợp lệ.",
  "payment/not_found": "Không tìm thấy giao dịch thanh toán.",
  "notification/not_found": "Không tìm thấy thông báo.",
  "image/too_large": "Ảnh quá lớn. Vui lòng chọn ảnh có dung lượng nhỏ hơn.",
  "image/invalid_format": "Định dạng ảnh không được hỗ trợ.",
};

async function parseError(response: Response): Promise<ApiError> {
  try {
    const body: unknown = await response.json();
    if (!body || typeof body !== "object") throw new Error("Invalid error body");
    const problem = body as Record<string, unknown>;
    const code = typeof problem.code === "string" ? problem.code : undefined;
    const errors: Record<string, string[]> = {};
    if (problem.errors && typeof problem.errors === "object") {
      for (const [field, messages] of Object.entries(problem.errors)) {
        if (Array.isArray(messages) && messages.every((message) => typeof message === "string")) {
          errors[field] = messages;
        }
      }
    }
    const fallback = [problem.detail, problem.message].find(
      (value): value is string => typeof value === "string" && value.trim().length > 0
    );
    return new ApiError(
      (code && errorMessages[code]) || fallback || "Yêu cầu không thể thực hiện.",
      response.status,
      code,
      Object.keys(errors).length ? errors : undefined
    );
  } catch {
    return new ApiError("Yêu cầu không thể thực hiện.", response.status);
  }
}

function sessionChanged(): ApiError {
  return new ApiError(
    "Phiên đăng nhập đã thay đổi. Vui lòng thực hiện lại thao tác.",
    409,
    "auth/session_changed"
  );
}

async function refreshSession(source: SessionSnapshot): Promise<AuthSession> {
  if (!isSessionCurrent(source)) throw sessionChanged();
  if (
    refreshOperation?.source.revision === source.revision &&
    refreshOperation.source.session?.refreshToken === source.session?.refreshToken
  )
    return refreshOperation.promise;

  const promise = (async () => {
    const current = source.session;
    if (!current?.refreshToken) throw new ApiError("Phiên đăng nhập đã hết hạn.", 401);

    const next = await apiRequest<AuthSession>("/auth/refresh-token", {
      method: "POST",
      body: JSON.stringify({ refreshToken: current.refreshToken }),
      retry: false,
    });
    if (!(await saveRefreshedSession(source, next)) || !isSessionCurrent(source))
      throw sessionChanged();
    return next;
  })()
    .catch(async (error: unknown) => {
      if (!isSessionCurrent(source)) throw sessionChanged();
      // The current backend returns 400 for an explicitly invalid refresh token.
      const rejected =
        error instanceof ApiError &&
        (error.status === 401 ||
          error.status === 403 ||
          error.code === "auth/invalid_refresh_token");
      if (rejected) {
        const clearedRevision = await clearSessionIfCurrent(source);
        if (clearedRevision === null || !isSessionCurrent({ revision: clearedRevision }))
          throw sessionChanged();
        sessionExpiredHandler?.();
        throw new ApiError("Phiên đăng nhập đã hết hạn.", 401);
      }
      throw error;
    })
    .finally(() => {
      // A finishing old operation must not remove the refresh started by a newer login.
      if (refreshOperation?.promise === promise) refreshOperation = null;
    });

  refreshOperation = { source, promise };
  return promise;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return request<T>(path, options);
}

async function request<T>(
  path: string,
  options: RequestOptions,
  source?: SessionSnapshot
): Promise<T> {
  const { authenticated, retry, timeoutMs = ENV.API_TIMEOUT, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");

  try {
    if (authenticated) {
      const current = await readSessionSnapshot();
      if (!isSessionCurrent(current) || (source && source.revision !== current.revision))
        throw sessionChanged();
      source ??= current;
      if (current.session?.accessToken)
        headers.set("Authorization", `Bearer ${current.session.accessToken}`);
    }
    const response = await fetch(`${ENV.API_URL}${path}`, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });
    if (response.status === 401 && authenticated && retry !== false) {
      clearTimeout(timeout);
      const latest = await readSessionSnapshot();
      if (!source || !isSessionCurrent(source) || latest.revision !== source.revision)
        throw sessionChanged();
      // Another request may already have rotated the token before this 401 arrived.
      if (
        !latest.session?.accessToken ||
        headers.get("Authorization") === `Bearer ${latest.session.accessToken}`
      ) {
        await refreshSession(latest);
      }
      if (!isSessionCurrent(source)) throw sessionChanged();
      return request<T>(path, { ...options, retry: false }, source);
    }
    if (!response.ok) {
      const error = await parseError(response);
      // Include the final retry: its late 401 must not expire a newer login.
      if (authenticated && source && !isSessionCurrent(source)) throw sessionChanged();
      throw error;
    }
    // Successful responses also belong to the source login, including empty responses.
    if (authenticated && source && !isSessionCurrent(source)) throw sessionChanged();
    if (response.status === 204) return undefined as T;
    const payload = (await response.json()) as T;
    // Reading the body can finish after logout or a different account has signed in.
    if (authenticated && source && !isSessionCurrent(source)) throw sessionChanged();
    diagnoseApiText(path, payload, response.headers.get("content-type"));
    return payload;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (controller.signal.aborted) throw new ApiError("Kết nối máy chủ quá thời gian.", 0);
    throw new ApiError("Không thể kết nối máy chủ. Vui lòng thử lại.", 0);
  } finally {
    clearTimeout(timeout);
  }
}
