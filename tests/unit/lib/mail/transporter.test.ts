import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createTransport = vi.fn();
const getAccessToken = vi.fn();

vi.mock("nodemailer", () => ({
  default: { createTransport: (options: unknown) => createTransport(options) },
}));

vi.mock("@/lib/mail/oauth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/mail/oauth")>();
  return {
    ...actual,
    getAccessToken: (...args: unknown[]) => getAccessToken(...args),
  };
});

const load = async () => (await import("@/lib/mail/client")).getTransporter;

const smtp = {
  kind: "smtp" as const,
  host: "smtp.office365.com",
  port: 587,
  secure: false,
  user: "noreply@smartalliance.co.th",
  auth: { kind: "password" as const, password: "hunter2" },
};

const oauthSmtp = {
  ...smtp,
  auth: {
    kind: "oauth2" as const,
    oauth: { tenantId: "t", clientId: "c", clientSecret: "s" },
  },
};

/** A fresh fake transporter per `createTransport` call, so identity is testable. */
const newTransporter = () => ({ close: vi.fn(), sendMail: vi.fn() });

beforeEach(() => {
  vi.resetAllMocks();
  createTransport.mockImplementation(() => newTransporter());
  getAccessToken.mockResolvedValue("access-token-value");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getTransporter — password auth", () => {
  it("builds a pooled transport with the configured host and port", async () => {
    await (await load())(smtp);

    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "smtp.office365.com",
        port: 587,
        secure: false,
        pool: true,
        maxConnections: 3,
      }),
    );
  });

  it("sets timeouts, so a hung SMTP server cannot hold the request open", async () => {
    await (await load())(smtp);

    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionTimeout: 15_000,
        greetingTimeout: 15_000,
        socketTimeout: 20_000,
      }),
    );
  });

  it("authenticates with the user and password", async () => {
    await (await load())(smtp);

    expect(createTransport.mock.calls[0]![0].auth).toEqual({
      user: "noreply@smartalliance.co.th",
      pass: "hunter2",
    });
    expect(getAccessToken).not.toHaveBeenCalled();
  });

  it("reuses the cached transporter across calls", async () => {
    const getTransporter = await load();

    const first = await getTransporter(smtp);
    const second = await getTransporter(smtp);

    expect(second).toBe(first);
    expect(createTransport).toHaveBeenCalledOnce();
  });
});

describe("getTransporter — XOAUTH2", () => {
  it("fetches an SMTP-scoped token, not a Graph one", async () => {
    // A Graph token carries no roles on Exchange; the send would fail at auth.
    const { SCOPE } = await import("@/lib/mail/oauth");
    await (await load())(oauthSmtp);

    expect(getAccessToken).toHaveBeenCalledWith(oauthSmtp.auth.oauth, SCOPE.smtp);
  });

  it("passes the token as OAuth2 credentials", async () => {
    await (await load())(oauthSmtp);

    expect(createTransport.mock.calls[0]![0].auth).toEqual({
      type: "OAuth2",
      user: "noreply@smartalliance.co.th",
      accessToken: "access-token-value",
    });
  });

  it("reuses the transporter while the token is unchanged", async () => {
    const getTransporter = await load();

    const first = await getTransporter(oauthSmtp);
    const second = await getTransporter(oauthSmtp);

    expect(second).toBe(first);
    expect(createTransport).toHaveBeenCalledOnce();
  });

  it("rebuilds the transport when the token is refreshed", async () => {
    // A pooled connection opened with an expired token fails at send time; the
    // cache key is the token itself precisely so a refresh replaces the pool.
    const getTransporter = await load();

    getAccessToken.mockResolvedValueOnce("token-one");
    const first = await getTransporter(oauthSmtp);

    getAccessToken.mockResolvedValueOnce("token-two");
    const second = await getTransporter(oauthSmtp);

    expect(second).not.toBe(first);
    expect(createTransport).toHaveBeenCalledTimes(2);
  });

  it("closes the superseded transport rather than leaking its connections", async () => {
    const getTransporter = await load();

    getAccessToken.mockResolvedValueOnce("token-one");
    const first = await getTransporter(oauthSmtp);

    getAccessToken.mockResolvedValueOnce("token-two");
    await getTransporter(oauthSmtp);

    expect(first.close).toHaveBeenCalledOnce();
  });

  it("propagates a token failure instead of building an unauthenticated transport", async () => {
    getAccessToken.mockRejectedValue(new Error("Entra token request failed (401)"));

    await expect((await load())(oauthSmtp)).rejects.toThrow(
      /Entra token request failed/,
    );
    expect(createTransport).not.toHaveBeenCalled();
  });
});
