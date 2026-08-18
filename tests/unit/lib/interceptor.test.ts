import type { AxiosError, AxiosInstance } from "axios";
import { describe, expect, it, vi } from "vitest";

import { ApiError, attachInterceptors } from "@/lib/api/interceptor";

/**
 * Captures the rejection handler axios would install, so it can be driven
 * directly with the error shapes axios produces.
 */
function rejectionHandler() {
  let onRejected: ((error: AxiosError) => unknown) | undefined;
  const client = {
    interceptors: {
      response: {
        use: (_ok: unknown, err: (error: AxiosError) => unknown) => {
          onRejected = err;
        },
      },
    },
  } as unknown as AxiosInstance;

  attachInterceptors(client);
  if (!onRejected) throw new Error("no rejection handler was registered");
  return onRejected;
}

const axiosError = (status?: number, error?: string) =>
  ({
    response: status ? { status, data: error ? { error } : {} } : undefined,
  }) as AxiosError;

describe("ApiError", () => {
  it("uses the server's error code as the message", () => {
    const error = new ApiError(429, "rate_limited");

    expect(error.status).toBe(429);
    expect(error.code).toBe("rate_limited");
    expect(error.message).toBe("rate_limited");
  });

  it("falls back to a message naming the status when there is no code", () => {
    expect(new ApiError(500).message).toBe("Request failed with status 500");
  });

  it("is an Error, so it survives `throw` and `instanceof` across the app", () => {
    const error = new ApiError(400, "validation_failed");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.name).toBe("ApiError");
  });
});

describe("attachInterceptors", () => {
  it("returns the client so it can be chained", () => {
    const client = {
      interceptors: { response: { use: vi.fn() } },
    } as unknown as AxiosInstance;

    expect(attachInterceptors(client)).toBe(client);
  });

  it("converts a failed response into an ApiError carrying status and code", async () => {
    const onRejected = rejectionHandler();

    await expect(onRejected(axiosError(429, "rate_limited"))).rejects.toSatisfy(
      (error: unknown) =>
        error instanceof ApiError &&
        error.status === 429 &&
        error.code === "rate_limited",
    );
  });

  it("keeps the status when the body carries no error code", async () => {
    const onRejected = rejectionHandler();

    await expect(onRejected(axiosError(502))).rejects.toSatisfy(
      (error: unknown) =>
        error instanceof ApiError &&
        error.status === 502 &&
        error.code === undefined,
    );
  });

  it("reports status 0 for a transport failure with no response at all", async () => {
    // A timeout or a DNS failure never reaches the server; the form shows its
    // generic banner rather than a code it cannot explain.
    const onRejected = rejectionHandler();

    await expect(onRejected(axiosError())).rejects.toSatisfy(
      (error: unknown) => error instanceof ApiError && error.status === 0,
    );
  });

  it("never lets a raw AxiosError escape to the caller", async () => {
    // Callers above this layer are written against ApiError only.
    const onRejected = rejectionHandler();

    await expect(onRejected(axiosError(400, "validation_failed"))).rejects.toBeInstanceOf(
      ApiError,
    );
  });
});
