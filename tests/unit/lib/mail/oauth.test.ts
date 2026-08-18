import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const load = () => import("@/lib/mail/oauth");

const config = {
  tenantId: "tenant-id",
  clientId: "client-id",
  clientSecret: "client-secret",
};

const tokenResponse = (body: unknown, status = 200) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as Response;

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("getAccessToken — request", () => {
  it("posts client credentials to the tenant's token endpoint", async () => {
    fetchMock.mockResolvedValue(
      tokenResponse({ access_token: "tok", expires_in: 3600 }),
    );
    const { getAccessToken, SCOPE } = await load();

    await getAccessToken(config, SCOPE.graph);

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(
      "https://login.microsoftonline.com/tenant-id/oauth2/v2.0/token",
    );
    expect(init.method).toBe("POST");

    const body = new URLSearchParams(init.body as URLSearchParams);
    expect(Object.fromEntries(body)).toEqual({
      client_id: "client-id",
      client_secret: "client-secret",
      scope: SCOPE.graph,
      grant_type: "client_credentials",
    });
  });

  it("percent-encodes the tenant id into the path", async () => {
    fetchMock.mockResolvedValue(tokenResponse({ access_token: "tok" }));
    const { getAccessToken } = await load();

    await getAccessToken({ ...config, tenantId: "contoso.onmicrosoft.com/../x" });

    expect(fetchMock.mock.calls[0]![0]).toContain(
      encodeURIComponent("contoso.onmicrosoft.com/../x"),
    );
  });

  it("defaults to the Graph scope", async () => {
    fetchMock.mockResolvedValue(tokenResponse({ access_token: "tok" }));
    const { getAccessToken, SCOPE } = await load();

    await getAccessToken(config);

    const body = new URLSearchParams(fetchMock.mock.calls[0]![1].body);
    expect(body.get("scope")).toBe(SCOPE.graph);
  });

  it("opts out of the fetch cache, since a token must not be replayed", async () => {
    fetchMock.mockResolvedValue(tokenResponse({ access_token: "tok" }));
    const { getAccessToken } = await load();

    await getAccessToken(config);

    expect(fetchMock.mock.calls[0]![1].cache).toBe("no-store");
  });

  it("returns the issued token", async () => {
    fetchMock.mockResolvedValue(
      tokenResponse({ access_token: "the-token", expires_in: 3600 }),
    );
    const { getAccessToken } = await load();

    await expect(getAccessToken(config)).resolves.toBe("the-token");
  });
});

describe("getAccessToken — caching", () => {
  it("reuses a live token instead of re-authenticating", async () => {
    fetchMock.mockResolvedValue(
      tokenResponse({ access_token: "tok", expires_in: 3600 }),
    );
    const { getAccessToken } = await load();

    await getAccessToken(config);
    await getAccessToken(config);

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("refreshes a minute before expiry, so a send never races the rollover", async () => {
    fetchMock.mockResolvedValue(
      tokenResponse({ access_token: "tok", expires_in: 3600 }),
    );
    const { getAccessToken } = await load();

    await getAccessToken(config);

    // 61 minutes minus 59 seconds: still valid, but inside the refresh margin.
    vi.advanceTimersByTime((3600 - 59) * 1000);
    await getAccessToken(config);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("keeps separate tokens per scope", async () => {
    // A token minted for Graph carries no roles on Exchange, so sharing one
    // cache entry would send an unusable token to the other resource.
    fetchMock
      .mockResolvedValueOnce(tokenResponse({ access_token: "graph-tok" }))
      .mockResolvedValueOnce(tokenResponse({ access_token: "smtp-tok" }));
    const { getAccessToken, SCOPE } = await load();

    await expect(getAccessToken(config, SCOPE.graph)).resolves.toBe("graph-tok");
    await expect(getAccessToken(config, SCOPE.smtp)).resolves.toBe("smtp-tok");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("assumes an hour when the response omits expires_in", async () => {
    fetchMock.mockResolvedValue(tokenResponse({ access_token: "tok" }));
    const { getAccessToken } = await load();

    await getAccessToken(config);
    vi.advanceTimersByTime(30 * 60 * 1000);
    await getAccessToken(config);

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("re-authenticates after resetTokenCache", async () => {
    fetchMock.mockResolvedValue(
      tokenResponse({ access_token: "tok", expires_in: 3600 }),
    );
    const { getAccessToken, resetTokenCache } = await load();

    await getAccessToken(config);
    resetTokenCache();
    await getAccessToken(config);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not cache a failed request", async () => {
    fetchMock
      .mockResolvedValueOnce(
        tokenResponse({ error: "invalid_client" }, 401),
      )
      .mockResolvedValueOnce(tokenResponse({ access_token: "tok" }));
    const { getAccessToken } = await load();

    await expect(getAccessToken(config)).rejects.toThrow();
    await expect(getAccessToken(config)).resolves.toBe("tok");
  });
});

describe("getAccessToken — failures", () => {
  it("surfaces error_description, which names the actual misconfiguration", async () => {
    fetchMock.mockResolvedValue(
      tokenResponse(
        {
          error: "invalid_client",
          error_description: "AADSTS7000215: Invalid client secret provided.",
        },
        401,
      ),
    );
    const { getAccessToken } = await load();

    await expect(getAccessToken(config)).rejects.toThrow(
      /Entra token request failed \(401\).*Invalid client secret/,
    );
  });

  it("falls back to the error code when there is no description", async () => {
    fetchMock.mockResolvedValue(tokenResponse({ error: "invalid_grant" }, 400));
    const { getAccessToken } = await load();

    await expect(getAccessToken(config)).rejects.toThrow(/invalid_grant/);
  });

  it("reports an unknown error when the body carries neither", async () => {
    fetchMock.mockResolvedValue(tokenResponse({}, 500));
    const { getAccessToken } = await load();

    await expect(getAccessToken(config)).rejects.toThrow(/unknown error/);
  });

  it("rejects a 200 response that carries no access_token", async () => {
    // A success status with no token would otherwise cache `undefined` and
    // fail later, at the send, with a far less useful message.
    fetchMock.mockResolvedValue(tokenResponse({ token_type: "Bearer" }, 200));
    const { getAccessToken } = await load();

    await expect(getAccessToken(config)).rejects.toThrow(/token request failed/);
  });
});
