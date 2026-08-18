import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const load = async () => (await import("@/lib/mail/client")).readMailConfig;

/**
 * Every variable `readMailConfig` reads. Cleared before each test so a value
 * from the developer's real `.env.local` cannot leak in and make a case pass
 * for the wrong reason.
 */
const MAIL_ENV = [
  "SMTP_USER",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_PASSWORD",
  "SMTP_PASSWORD_ENC",
  "CONTACT_MAIL_TO",
  "CONTACT_MAIL_FROM",
  "MAIL_TRANSPORT",
  "MS_TENANT_ID",
  "MS_CLIENT_ID",
  "MS_CLIENT_SECRET",
  "MS_CLIENT_SECRET_ENC",
  "CONFIG_MASTER_KEY",
] as const;

const env = (values: Partial<Record<(typeof MAIL_ENV)[number], string>>) => {
  for (const name of MAIL_ENV) vi.stubEnv(name, "");
  for (const [name, value] of Object.entries(values)) vi.stubEnv(name, value);
};

/** The minimum that selects the Graph transport. */
const GRAPH_ENV = {
  SMTP_USER: "noreply@smartalliance.co.th",
  CONTACT_MAIL_TO: "admin@smartalliance.co.th",
  MS_TENANT_ID: "tenant-id",
  MS_CLIENT_ID: "client-id",
  MS_CLIENT_SECRET: "client-secret",
};

/** The minimum that selects the password-authenticated SMTP transport. */
const SMTP_ENV = {
  SMTP_USER: "noreply@smartalliance.co.th",
  CONTACT_MAIL_TO: "admin@smartalliance.co.th",
  SMTP_HOST: "smtp.office365.com",
  SMTP_PASSWORD: "hunter2",
};

beforeEach(() => {
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("readMailConfig — transport selection", () => {
  it("chooses Graph when the Entra credentials are present", async () => {
    env(GRAPH_ENV);
    const result = (await load())();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.transport).toEqual({
      kind: "graph",
      mailbox: "noreply@smartalliance.co.th",
      oauth: {
        tenantId: "tenant-id",
        clientId: "client-id",
        clientSecret: "client-secret",
      },
    });
  });

  it("does not need SMTP_HOST for the Graph transport", async () => {
    // Graph is an HTTPS call, not an SMTP session — requiring a host would
    // block a perfectly valid configuration.
    env(GRAPH_ENV);
    expect((await load())().ok).toBe(true);
  });

  it("falls back to SMTP with a password when no Entra variable is set", async () => {
    env(SMTP_ENV);
    const result = (await load())();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.transport).toMatchObject({
      kind: "smtp",
      host: "smtp.office365.com",
      user: "noreply@smartalliance.co.th",
      auth: { kind: "password", password: "hunter2" },
    });
  });

  it("forces SMTP-with-XOAUTH2 when MAIL_TRANSPORT=smtp despite Entra credentials", async () => {
    env({ ...GRAPH_ENV, SMTP_HOST: "smtp.office365.com", MAIL_TRANSPORT: "smtp" });
    const result = (await load())();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.transport).toMatchObject({
      kind: "smtp",
      auth: { kind: "oauth2", oauth: { tenantId: "tenant-id" } },
    });
  });

  it.each(["SMTP", "Smtp"])(
    "matches MAIL_TRANSPORT=%s case-insensitively",
    async (value) => {
      env({ ...GRAPH_ENV, SMTP_HOST: "smtp.office365.com", MAIL_TRANSPORT: value });
      const result = (await load())();

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.config.transport.kind).toBe("smtp");
    },
  );

  it("ignores an unrecognised MAIL_TRANSPORT and stays on Graph", async () => {
    env({ ...GRAPH_ENV, MAIL_TRANSPORT: "carrier-pigeon" });
    const result = (await load())();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.transport.kind).toBe("graph");
  });

  it.each([
    ["MS_TENANT_ID", { MS_TENANT_ID: "tenant-id" }],
    ["MS_CLIENT_ID", { MS_CLIENT_ID: "client-id" }],
    ["MS_CLIENT_SECRET", { MS_CLIENT_SECRET: "secret" }],
  ])(
    "treats a lone %s as intent to use OAuth and reports the rest as missing",
    async (_name, partial) => {
      // The alternative — silently falling back to a password the tenant will
      // reject — produces a 535 at send time instead of a clear config error.
      env({ ...SMTP_ENV, ...partial });
      const result = (await load())();

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.missing.length).toBeGreaterThan(0);
      expect(result.missing).not.toContain(
        "SMTP_PASSWORD (or the MS_* OAuth2 variables)",
      );
    },
  );
});

describe("readMailConfig — missing variables", () => {
  it("reports SMTP_USER and CONTACT_MAIL_TO when nothing is configured", async () => {
    env({});
    const result = (await load())();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.missing).toContain("SMTP_USER");
    expect(result.missing).toContain("CONTACT_MAIL_TO");
  });

  it("asks for a password or the OAuth variables when neither is present", async () => {
    env({ SMTP_USER: "a@b.co", CONTACT_MAIL_TO: "c@d.co", SMTP_HOST: "smtp" });
    const result = (await load())();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.missing).toContain(
      "SMTP_PASSWORD (or the MS_* OAuth2 variables)",
    );
  });

  it("requires SMTP_HOST for the SMTP transport", async () => {
    env({ ...SMTP_ENV, SMTP_HOST: "" });
    const result = (await load())();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.missing).toContain("SMTP_HOST");
  });

  it("names each absent Entra variable individually", async () => {
    env({
      SMTP_USER: "a@b.co",
      CONTACT_MAIL_TO: "c@d.co",
      MS_TENANT_ID: "tenant-id",
    });
    const result = (await load())();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.missing).toEqual(
      expect.arrayContaining(["MS_CLIENT_ID", "MS_CLIENT_SECRET"]),
    );
    expect(result.missing).not.toContain("MS_TENANT_ID");
  });

  it("treats a whitespace-only value as missing", async () => {
    env({ ...SMTP_ENV, SMTP_USER: "   " });
    const result = (await load())();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.missing).toContain("SMTP_USER");
  });
});

describe("readMailConfig — recipients and sender", () => {
  it("splits CONTACT_MAIL_TO on commas and trims each address", async () => {
    env({ ...SMTP_ENV, CONTACT_MAIL_TO: " a@x.co , b@y.co ,c@z.co " });
    const result = (await load())();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.to).toEqual(["a@x.co", "b@y.co", "c@z.co"]);
  });

  it("drops empty entries left by a trailing comma", async () => {
    env({ ...SMTP_ENV, CONTACT_MAIL_TO: "a@x.co,,b@y.co," });
    const result = (await load())();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.to).toEqual(["a@x.co", "b@y.co"]);
  });

  it("reports CONTACT_MAIL_TO missing when it holds only separators", async () => {
    env({ ...SMTP_ENV, CONTACT_MAIL_TO: " , , " });
    const result = (await load())();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.missing).toContain("CONTACT_MAIL_TO");
  });

  it("defaults From to the sending mailbox", async () => {
    // Exchange rejects a From that is not the authenticated mailbox.
    env(SMTP_ENV);
    const result = (await load())();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.from).toBe("noreply@smartalliance.co.th");
  });

  it("uses CONTACT_MAIL_FROM when it is set", async () => {
    env({ ...SMTP_ENV, CONTACT_MAIL_FROM: "Smart Alliance <noreply@x.co>" });
    const result = (await load())();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.from).toBe("Smart Alliance <noreply@x.co>");
  });
});

describe("readMailConfig — port and TLS", () => {
  it("defaults to port 587 with STARTTLS", async () => {
    env(SMTP_ENV);
    const result = (await load())();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.transport).toMatchObject({ port: 587, secure: false });
  });

  it.each(["", "   "])(
    "treats a present-but-empty SMTP_PORT (%j) as unset, not as port 0",
    async (blank) => {
      // A deploy platform writes an empty string for a blank field, and a
      // stray `SMTP_PORT=` line leaves one behind. `Number("")` is 0, so this
      // silently produced an unconnectable transport.
      env({ ...SMTP_ENV, SMTP_PORT: blank });
      const result = (await load())();

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.config.transport).toMatchObject({ port: 587, secure: false });
    },
  );

  it.each(["abc", "58a7", "587.5"])(
    "rejects a non-integer SMTP_PORT (%j) by name instead of failing at connect time",
    async (bad) => {
      env({ ...SMTP_ENV, SMTP_PORT: bad });
      const result = (await load())();

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.missing.join(" ")).toMatch(/SMTP_PORT/);
    },
  );

  it("does not require a valid SMTP_PORT for the Graph transport", async () => {
    // Graph never opens an SMTP session, so a leftover port value is irrelevant.
    env({ ...GRAPH_ENV, SMTP_PORT: "" });
    expect((await load())().ok).toBe(true);
  });

  it("infers implicit TLS on port 465", async () => {
    env({ ...SMTP_ENV, SMTP_PORT: "465" });
    const result = (await load())();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.transport).toMatchObject({ port: 465, secure: true });
  });

  it.each([
    ["true", true],
    ["false", false],
  ])("lets SMTP_SECURE=%s override the port inference", async (flag, secure) => {
    env({ ...SMTP_ENV, SMTP_PORT: "465", SMTP_SECURE: flag });
    const result = (await load())();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.transport).toMatchObject({ secure });
  });
});

describe("readMailConfig — encrypted secrets", () => {
  it("propagates a SecretError rather than reporting the variable as missing", async () => {
    // `sendContactMail` catches this and reports a configuration fault; a
    // silent "missing" here would send the operator hunting for an unset
    // variable that is in fact set but undecryptable.
    env({
      SMTP_USER: "a@b.co",
      CONTACT_MAIL_TO: "c@d.co",
      MS_TENANT_ID: "tenant-id",
      MS_CLIENT_ID: "client-id",
      MS_CLIENT_SECRET_ENC: "not-prefixed",
    });

    const readMailConfig = await load();
    expect(() => readMailConfig()).toThrow(
      /MS_CLIENT_SECRET_ENC must start with/,
    );
  });

  it("decrypts an encrypted SMTP password into the transport", async () => {
    const { createCipheriv, randomBytes, scryptSync } = await import(
      "node:crypto"
    );
    const { SCRYPT_PARAMS } = await import("@/lib/secrets");

    const master = "a-master-key-at-least-16-chars";
    const salt = randomBytes(16);
    const iv = randomBytes(12);
    const cipher = createCipheriv(
      "aes-256-gcm",
      scryptSync(master, salt, 32, SCRYPT_PARAMS),
      iv,
    );
    const body = Buffer.concat([cipher.update("hunter2", "utf8"), cipher.final()]);
    const payload =
      "enc:v1:" +
      Buffer.concat([salt, iv, cipher.getAuthTag(), body]).toString("base64");

    env({
      SMTP_USER: "a@b.co",
      CONTACT_MAIL_TO: "c@d.co",
      SMTP_HOST: "smtp.office365.com",
      SMTP_PASSWORD_ENC: payload,
      CONFIG_MASTER_KEY: master,
    });

    const result = (await load())();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.transport).toMatchObject({
      auth: { kind: "password", password: "hunter2" },
    });
  });
});
