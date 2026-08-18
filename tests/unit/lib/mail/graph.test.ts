import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getAccessToken = vi.fn();

vi.mock("@/lib/mail/oauth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/mail/oauth")>();
  return { ...actual, getAccessToken: (...args: unknown[]) => getAccessToken(...args) };
});

const load = async () => (await import("@/lib/mail/graph")).sendViaGraph;

const args = {
  oauth: { tenantId: "t", clientId: "c", clientSecret: "s" },
  mailbox: "noreply@smartalliance.co.th",
  to: ["admin@smartalliance.co.th"],
  mail: {
    subject: "[Website] New enquiry",
    text: "plain text body",
    html: "<p>html body</p>",
    replyTo: "somchai@example.co.th",
  },
};

const graphResponse = (status: number, body?: unknown) =>
  ({
    status,
    json: async () => {
      if (body === undefined) throw new SyntaxError("Unexpected end of JSON input");
      return body;
    },
  }) as Response;

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetAllMocks();
  getAccessToken.mockResolvedValue("an-access-token");
  fetchMock = vi.fn().mockResolvedValue(graphResponse(202));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("sendViaGraph — request", () => {
  it("posts to the sendMail endpoint for the configured mailbox", async () => {
    await (await load())(args);

    expect(fetchMock.mock.calls[0]![0]).toBe(
      "https://graph.microsoft.com/v1.0/users/noreply%40smartalliance.co.th/sendMail",
    );
    expect(fetchMock.mock.calls[0]![1].method).toBe("POST");
  });

  it("percent-encodes the mailbox into the path", async () => {
    await (await load())({ ...args, mailbox: "a b/c@x.co" });

    expect(fetchMock.mock.calls[0]![0]).toContain(encodeURIComponent("a b/c@x.co"));
  });

  it("requests a Graph-scoped token and sends it as a bearer", async () => {
    const { SCOPE } = await import("@/lib/mail/oauth");
    await (await load())(args);

    expect(getAccessToken).toHaveBeenCalledWith(args.oauth, SCOPE.graph);
    expect(fetchMock.mock.calls[0]![1].headers.Authorization).toBe(
      "Bearer an-access-token",
    );
  });

  it("sends the html body, not the plain-text one", async () => {
    await (await load())(args);
    const body = JSON.parse(fetchMock.mock.calls[0]![1].body);

    expect(body.message.body).toEqual({
      contentType: "HTML",
      content: "<p>html body</p>",
    });
    expect(body.message.subject).toBe("[Website] New enquiry");
  });

  it("maps every recipient into Graph's emailAddress shape", async () => {
    await (await load())({ ...args, to: ["a@x.co", "b@y.co"] });
    const body = JSON.parse(fetchMock.mock.calls[0]![1].body);

    expect(body.message.toRecipients).toEqual([
      { emailAddress: { address: "a@x.co" } },
      { emailAddress: { address: "b@y.co" } },
    ]);
  });

  it("puts the visitor in replyTo while sending as the mailbox", async () => {
    // Sending *as* the visitor would fail SPF/DMARC; replyTo gets the reply
    // to them anyway.
    await (await load())(args);
    const body = JSON.parse(fetchMock.mock.calls[0]![1].body);

    expect(body.message.replyTo).toEqual([
      { emailAddress: { address: "somchai@example.co.th" } },
    ]);
  });

  it("does not clutter Sent Items", async () => {
    await (await load())(args);

    expect(JSON.parse(fetchMock.mock.calls[0]![1].body).saveToSentItems).toBe(false);
  });

  it("opts out of the fetch cache", async () => {
    await (await load())(args);

    expect(fetchMock.mock.calls[0]![1].cache).toBe("no-store");
  });
});

describe("sendViaGraph — outcome", () => {
  it("resolves on 202 Accepted, which sendMail returns with no body", async () => {
    fetchMock.mockResolvedValue(graphResponse(202));

    await expect((await load())(args)).resolves.toBeUndefined();
  });

  it("treats any other 2xx as a failure, since sendMail only ever returns 202", async () => {
    fetchMock.mockResolvedValue(graphResponse(200, {}));

    await expect((await load())(args)).rejects.toThrow(/Graph sendMail failed/);
  });

  it("surfaces the Graph error code and message", async () => {
    fetchMock.mockResolvedValue(
      graphResponse(403, {
        error: {
          code: "ErrorAccessDenied",
          message: "Access to OData is disabled.",
        },
      }),
    );

    await expect((await load())(args)).rejects.toThrow(
      /ErrorAccessDenied: Access to OData is disabled\./,
    );
  });

  it("falls back to the status when the error body has no code", async () => {
    fetchMock.mockResolvedValue(graphResponse(500, { error: {} }));

    await expect((await load())(args)).rejects.toThrow(/500: no message/);
  });

  it("falls back to the status when the error body is not JSON", async () => {
    // Graph returns an HTML error page for some gateway failures.
    fetchMock.mockResolvedValue(graphResponse(502));

    await expect((await load())(args)).rejects.toThrow(/HTTP 502/);
  });

  it("propagates a token failure rather than attempting the send", async () => {
    getAccessToken.mockRejectedValue(new Error("Entra token request failed (401)"));

    await expect((await load())(args)).rejects.toThrow(/Entra token request failed/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
