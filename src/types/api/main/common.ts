/**
 * Shared shapes for every `main` API response.
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PageObject<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
}

/** Error codes the route handlers return in `{ error: … }`. */
export type ApiErrorCode =
  | "invalid_json"
  | "validation_failed"
  | "not_configured";

export interface ApiErrorResponse {
  error: ApiErrorCode;
}
