import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const create = vi.fn();
const attachInterceptors = vi.fn((client: unknown) => client);

vi.mock("axios", () => ({
  default: { create: (config: unknown) => create(config) },
}));

vi.mock("@/lib/api/interceptor", () => ({
  attachInterceptors: (client: unknown) => attachInterceptors(client),
}));

const instance = () => ({ post: vi.fn(), interceptors: {} });

beforeEach(() => {
  vi.resetAllMocks();
  vi.unstubAllEnvs();
  create.mockImplementation(() => instance());
  attachInterceptors.mockImplementation((client: unknown) => client);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("mainClient", () => {
  it("resolves same-origin by default, so the browser calls this app's own routes", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");
    await import("@/lib/api/client");

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: "" }),
    );
  });

  it("uses NEXT_PUBLIC_API_BASE_URL when the backend is on another host", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.com");
    await import("@/lib/api/client");

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: "https://api.example.com" }),
    );
  });

  it("sends JSON and gives up after 15 seconds", async () => {
    await import("@/lib/api/client");

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: { "Content-Type": "application/json" },
        timeout: 15_000,
      }),
    );
  });

  it("attaches the interceptors, so callers only ever see ApiError", async () => {
    await import("@/lib/api/client");

    expect(attachInterceptors).toHaveBeenCalledOnce();
  });
});

describe("postContactApi", () => {
  it("posts the payload to the contact route", async () => {
    const client = instance();
    create.mockReturnValue(client);

    const { postContactApi } = await import("@/lib/api/api-main");
    const payload = { name: "Somchai", email: "a@b.co", message: "hi" };
    postContactApi(payload);

    expect(client.post).toHaveBeenCalledWith("/api/contact", payload);
  });
});
