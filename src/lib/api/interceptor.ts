import type { AxiosError, AxiosInstance } from "axios";

import type { ApiErrorCode, ApiErrorResponse } from "@/types/api/main/common";

/**
 * Error thrown for every non-2xx API response, so callers above the axios layer
 * never have to know about `AxiosError`.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code?: ApiErrorCode,
  ) {
    super(code ?? `Request failed with status ${status}`);
    this.name = "ApiError";
  }
}

/**
 * Normalises transport failures into `ApiError`.
 *
 * The public site has no authenticated area, so there is no token to attach and
 * no 401 redirect — that branch belongs here if an admin area is ever added.
 */
export function attachInterceptors(client: AxiosInstance) {
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiErrorResponse>) => {
      const status = error.response?.status ?? 0;
      return Promise.reject(new ApiError(status, error.response?.data?.error));
    },
  );

  return client;
}
