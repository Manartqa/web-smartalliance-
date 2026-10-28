import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ApiErrorCode } from "@/types/api/main/common";

const sendContactMail = vi.fn();

vi.mock("@/lib/mail", () => ({
  sendContactMail: (payload: unknown) => sendContactMail(payload),
}));

/**
 * The route is imported fresh in every test (the setup file resets the module
 * registry), so the rate limiter it closes over starts empty each time.
 */
const load = async () => (await import("@/app/api/contact/route")).POST;

const post = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("https://smartalliance.co.th/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

const valid = {
  name: "Somchai Jaidee",
  email: "somchai@example.co.th",
  message: "We would like a quote for Axway MFT.",
  consent: true,
};

const errorOf = async (response: Response): Promise<ApiErrorCode> =>
  (await response.json()).error;

beforeEach(() => {
  vi.resetAllMocks();
  sendContactMail.mockResolvedValue({ status: "sent", via: "graph" });
  // Silenced because the route logs deliberately on several paths; the
  // assertions below check the call, not the terminal.
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("POST /api/contact — happy path", () => {
  it("accepts a valid submission and reports ok", async () => {
    const response = await (await load())(post(valid));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(sendContactMail).toHaveBeenCalledOnce();
  });

  it("trims every field before handing them to the mailer", async () => {
    await (await load())(
      post({
        name: "  Somchai  ",
        email: "  somchai@example.co.th  ",
        message: "  hello  ",
        company: "  Acme  ",
        phone: "  +66 2  ",
        subject: "  Quote  ",
        consent: true,
      }),
    );

    expect(sendContactMail).toHaveBeenCalledWith({
      name: "Somchai",
      email: "somchai@example.co.th",
      message: "hello",
      consent: true,
      company: "Acme",
      phone: "+66 2",
      subject: "Quote",
    });
  });

  it("omits optional fields that were left blank rather than sending empty strings", async () => {
    await (await load())(post({ ...valid, company: "   ", phone: "", subject: "" }));

    const [payload] = sendContactMail.mock.calls[0]!;
    expect(payload).not.toHaveProperty("company");
    expect(payload).not.toHaveProperty("phone");
    expect(payload).not.toHaveProperty("subject");
  });

  it("never forwards the honeypot field to the mailer", async () => {
    await (await load())(post(valid));

    expect(sendContactMail.mock.calls[0]![0]).not.toHaveProperty("website");
  });
});

describe("POST /api/contact — honeypot", () => {
  it("reports success but sends nothing when the honeypot is filled", async () => {
    // A bot that gets a 400 learns to retry differently; one that gets a 200
    // learns nothing.
    const response = await (await load())(post({ ...valid, website: "spam.example" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(sendContactMail).not.toHaveBeenCalled();
  });

  it("logs the drop so a mis-fired honeypot is diagnosable", async () => {
    // The visitor is told the message was sent, so without this line an
    // autofilled honeypot is indistinguishable from mail that never arrived.
    await (await load())(post({ ...valid, website: "spam.example" }));

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("honeypot"),
    );
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("somchai@example.co.th"),
    );
  });

  it.each(["", "   "])(
    "ignores a honeypot containing only whitespace (%j)",
    async (value) => {
      await (await load())(post({ ...valid, website: value }));

      expect(sendContactMail).toHaveBeenCalledOnce();
    },
  );

  it("is checked before validation, so a bot cannot probe the rules", async () => {
    const response = await (await load())(
      post({ name: "", email: "nope", message: "", website: "spam" }),
    );

    expect(response.status).toBe(200);
    expect(sendContactMail).not.toHaveBeenCalled();
  });
});

describe("POST /api/contact — validation", () => {
  it("rejects a body that is not JSON", async () => {
    const response = await (await load())(post("not json at all"));

    expect(response.status).toBe(400);
    await expect(errorOf(response)).resolves.toBe("invalid_json");
    expect(sendContactMail).not.toHaveBeenCalled();
  });

  it.each([
    ["name", { name: "" }],
    ["name (whitespace only)", { name: "   " }],
    ["email", { email: "" }],
    ["message", { message: "" }],
    ["message (whitespace only)", { message: "  \n  " }],
  ])("rejects a missing %s", async (_label, override) => {
    const response = await (await load())(post({ ...valid, ...override }));

    expect(response.status).toBe(400);
    await expect(errorOf(response)).resolves.toBe("validation_failed");
    expect(sendContactMail).not.toHaveBeenCalled();
  });

  it("rejects an entirely absent body object", async () => {
    const response = await (await load())(post({}));

    expect(response.status).toBe(400);
    await expect(errorOf(response)).resolves.toBe("validation_failed");
  });

  it.each(["not-an-email", "user@", "@example.com", "user@example"])(
    "rejects the malformed address %j",
    async (email) => {
      const response = await (await load())(post({ ...valid, email }));

      expect(response.status).toBe(400);
      await expect(errorOf(response)).resolves.toBe("validation_failed");
    },
  );

  it("rejects an address carrying a CRLF header-injection payload", async () => {
    const response = await (await load())(
      post({ ...valid, email: "a@b.co\r\nBcc: victim@example.com" }),
    );

    expect(response.status).toBe(400);
    expect(sendContactMail).not.toHaveBeenCalled();
  });

  it.each([
    ["name", 120],
    ["email", 200],
    ["company", 160],
    ["phone", 40],
    ["subject", 200],
    ["message", 5000],
  ])("accepts %s at exactly its %i-character limit", async (field, max) => {
    // The bound is inclusive — an off-by-one here rejects a legitimate message.
    // Email has to stay a valid address while hitting the length exactly, so it
    // is padded in the local part rather than filled with `x`.
    const value =
      field === "email"
        ? `${"a".repeat(max - "@example.co.th".length)}@example.co.th`
        : "x".repeat(max);

    const response = await (await load())(post({ ...valid, [field]: value }));

    expect(value.length, `${field} fixture length`).toBe(max);
    expect(response.status).toBe(200);
  });

  it.each([
    ["name", 120],
    ["company", 160],
    ["phone", 40],
    ["subject", 200],
    ["message", 5000],
  ])("rejects %s one character over its %i-character limit", async (field, max) => {
    const response = await (await load())(
      post({ ...valid, [field]: "x".repeat(max + 1) }),
    );

    expect(response.status).toBe(400);
    await expect(errorOf(response)).resolves.toBe("validation_failed");
  });

  it("measures length after trimming, so padding cannot trip the limit", async () => {
    const response = await (await load())(
      post({ ...valid, message: `   ${"x".repeat(5000)}   ` }),
    );

    expect(response.status).toBe(200);
  });
});

describe("POST /api/contact — rate limiting", () => {
  it("allows five submissions then rejects the sixth", async () => {
    const POST = await load();

    for (let i = 1; i <= 5; i += 1) {
      const response = await POST(post(valid));
      expect(response.status, `submission ${i}`).toBe(200);
    }

    const blocked = await POST(post(valid));
    expect(blocked.status).toBe(429);
    await expect(errorOf(blocked)).resolves.toBe("rate_limited");
  });

  it("sets Retry-After when it rejects", async () => {
    const POST = await load();
    for (let i = 0; i < 5; i += 1) await POST(post(valid));

    const blocked = await POST(post(valid));
    const retryAfter = blocked.headers.get("Retry-After");

    expect(retryAfter).toBeTruthy();
    expect(Number(retryAfter)).toBeGreaterThan(0);
  });

  it("does not send mail for a rate-limited submission", async () => {
    const POST = await load();
    for (let i = 0; i < 5; i += 1) await POST(post(valid));
    sendContactMail.mockClear();

    await POST(post(valid));
    expect(sendContactMail).not.toHaveBeenCalled();
  });

  it("does not spend a caller's budget on invalid submissions", async () => {
    // Malformed spam must not be able to lock a real visitor out.
    const POST = await load();
    for (let i = 0; i < 20; i += 1) await POST(post({ ...valid, email: "bad" }));

    const response = await POST(post(valid));
    expect(response.status).toBe(200);
  });

  it("keeps per-caller budgets separate when a proxy is trusted", async () => {
    vi.stubEnv("TRUST_PROXY", "1");
    const POST = await load();

    for (let i = 0; i < 5; i += 1) {
      await POST(post(valid, { "x-forwarded-for": "1.1.1.1" }));
    }

    expect(
      (await POST(post(valid, { "x-forwarded-for": "1.1.1.1" }))).status,
    ).toBe(429);
    expect(
      (await POST(post(valid, { "x-forwarded-for": "2.2.2.2" }))).status,
    ).toBe(200);
  });

  it("shares one budget across callers when the proxy is not trusted", async () => {
    // Coarse by design: an unverifiable header would otherwise mean a fresh
    // bucket per request, i.e. a limiter that never limits.
    const POST = await load();

    for (let i = 0; i < 5; i += 1) {
      await POST(post(valid, { "x-forwarded-for": `10.0.0.${i}` }));
    }

    expect(
      (await POST(post(valid, { "x-forwarded-for": "10.0.0.99" }))).status,
    ).toBe(429);
  });

  it("enforces the hourly site-wide ceiling across distinct callers", async () => {
    vi.stubEnv("TRUST_PROXY", "1");
    const POST = await load();

    // 60 submissions from 12 callers, each inside its own 5-per-window budget.
    for (let caller = 0; caller < 12; caller += 1) {
      for (let i = 0; i < 5; i += 1) {
        const response = await POST(
          post(valid, { "x-forwarded-for": `10.1.0.${caller}` }),
        );
        expect(response.status, `caller ${caller} submission ${i}`).toBe(200);
      }
    }

    // The 61st is inside its caller's budget but over the site ceiling.
    const blocked = await POST(post(valid, { "x-forwarded-for": "10.1.0.99" }));
    expect(blocked.status).toBe(429);
    await expect(errorOf(blocked)).resolves.toBe("rate_limited");
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("site-wide submission ceiling"),
    );
  });
});

describe("POST /api/contact — delivery failures", () => {
  it("returns 503 when SMTP is not configured", async () => {
    sendContactMail.mockResolvedValue({
      status: "not_configured",
      missing: ["SMTP_USER", "SMTP_HOST"],
    });

    const response = await (await load())(post(valid));

    expect(response.status).toBe(503);
    await expect(errorOf(response)).resolves.toBe("not_configured");
  });

  it("names the missing variables in the log, not in the response", async () => {
    // The visitor must not be shown the deployment's variable names.
    sendContactMail.mockResolvedValue({
      status: "not_configured",
      missing: ["SMTP_USER"],
    });

    const response = await (await load())(post(valid));

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("SMTP_USER"),
    );
    expect(JSON.stringify(await response.json())).not.toContain("SMTP_USER");
  });

  it("returns 502 when delivery fails", async () => {
    sendContactMail.mockResolvedValue({
      status: "send_failed",
      reason: "535 auth failed",
    });

    const response = await (await load())(post(valid));

    expect(response.status).toBe(502);
    await expect(errorOf(response)).resolves.toBe("send_failed");
  });

  it("keeps the SMTP reason out of the response body", async () => {
    sendContactMail.mockResolvedValue({
      status: "send_failed",
      reason: "535 auth failed for noreply@smartalliance.co.th",
    });

    const response = await (await load())(post(valid));

    expect(JSON.stringify(await response.json())).not.toContain("noreply@");
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("SMTP delivery failed:"),
      expect.stringContaining("535"),
    );
  });
});

describe("POST /api/contact — runtime", () => {
  it("declares the Node runtime, since nodemailer needs Node APIs", async () => {
    const mod = await import("@/app/api/contact/route");
    expect(mod.runtime).toBe("nodejs");
  });
});

describe("POST /api/contact — consent", () => {
  it("rejects a submission without consent", async () => {
    const response = await (await load())(
      post({ ...valid, consent: undefined }),
    );

    expect(response.status).toBe(400);
    expect(await errorOf(response)).toBe("validation_failed");
    expect(sendContactMail).not.toHaveBeenCalled();
  });

  it.each([false, "true", "yes", 1])(
    "accepts only a literal true, not %j",
    async (consent) => {
      const response = await (await load())(post({ ...valid, consent }));

      expect(response.status).toBe(400);
      expect(sendContactMail).not.toHaveBeenCalled();
    },
  );

  it("records the consent in what it hands the mailer", async () => {
    await (await load())(post(valid));

    expect(sendContactMail.mock.calls[0]![0]).toMatchObject({ consent: true });
  });
});

describe("POST /api/contact — reCAPTCHA", () => {
  const siteverify = vi.fn();

  const answer = (body: Record<string, unknown>) =>
    siteverify.mockResolvedValue(
      new Response(JSON.stringify(body), { status: 200 }),
    );

  beforeEach(() => {
    vi.stubGlobal("fetch", siteverify);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("skips the check entirely when no secret key is configured", async () => {
    const response = await (await load())(post(valid));

    expect(response.status).toBe(200);
    expect(siteverify).not.toHaveBeenCalled();
  });

  describe("with RECAPTCHA_SECRET_KEY set", () => {
    beforeEach(() => {
      vi.stubEnv("RECAPTCHA_SECRET_KEY", "test-secret");
    });

    it("sends a submission whose token passes", async () => {
      answer({ success: true, score: 0.9, action: "contact" });

      const response = await (await load())(
        post({ ...valid, recaptchaToken: "good-token" }),
      );

      expect(response.status).toBe(200);
      expect(sendContactMail).toHaveBeenCalledOnce();
      const [url, init] = siteverify.mock.calls[0]!;
      expect(url).toBe("https://www.google.com/recaptcha/api/siteverify");
      const params = new URLSearchParams(init.body as URLSearchParams);
      expect(params.get("secret")).toBe("test-secret");
      expect(params.get("response")).toBe("good-token");
    });

    it("rejects a submission with no token, without asking Google", async () => {
      const response = await (await load())(post(valid));

      expect(response.status).toBe(400);
      expect(await errorOf(response)).toBe("captcha_failed");
      expect(siteverify).not.toHaveBeenCalled();
      expect(sendContactMail).not.toHaveBeenCalled();
    });

    it.each([
      ["Google rejects the token", { success: false, "error-codes": ["invalid-input-response"] }],
      ["the score is below the threshold", { success: true, score: 0.1, action: "contact" }],
      ["the token was minted for another action", { success: true, score: 0.9, action: "login" }],
    ])("rejects when %s", async (_case, body) => {
      answer(body);

      const response = await (await load())(
        post({ ...valid, recaptchaToken: "token" }),
      );

      expect(response.status).toBe(400);
      expect(await errorOf(response)).toBe("captcha_failed");
      expect(sendContactMail).not.toHaveBeenCalled();
    });

    it("fails closed when Google cannot be reached", async () => {
      siteverify.mockRejectedValue(new TypeError("fetch failed"));

      const response = await (await load())(
        post({ ...valid, recaptchaToken: "token" }),
      );

      expect(response.status).toBe(400);
      expect(sendContactMail).not.toHaveBeenCalled();
    });

    it("logs why a check failed, but keeps the reason out of the response", async () => {
      answer({ success: true, score: 0.2, action: "contact" });

      const response = await (await load())(
        post({ ...valid, recaptchaToken: "token" }),
      );

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("score 0.2 below threshold"),
      );
      expect(JSON.stringify(await response.json())).not.toContain("score");
    });

    it("never forwards the token to the mailer", async () => {
      answer({ success: true, score: 0.9, action: "contact" });

      await (await load())(post({ ...valid, recaptchaToken: "good-token" }));

      expect(sendContactMail.mock.calls[0]![0]).not.toHaveProperty(
        "recaptchaToken",
      );
    });
  });
});
