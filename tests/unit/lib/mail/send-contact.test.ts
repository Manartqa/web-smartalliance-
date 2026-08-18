import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ContactRequest } from "@/types/api/main/contact";

const payload: ContactRequest = {
  name: "Somchai",
  email: "somchai@example.co.th",
  message: "Please send a quote.",
};

const readMailConfig = vi.fn();
const sendViaGraph = vi.fn();
const sendMail = vi.fn();
const getTransporter = vi.fn();

vi.mock("@/lib/mail/client", () => ({
  readMailConfig: () => readMailConfig(),
  getTransporter: (t: unknown) => getTransporter(t as never),
}));

vi.mock("@/lib/mail/graph", () => ({
  sendViaGraph: (args: unknown) => sendViaGraph(args),
}));

const load = async () => (await import("@/lib/mail/send-contact")).sendContactMail;

const graphConfig = {
  ok: true,
  config: {
    from: "noreply@x.co",
    to: ["admin@x.co"],
    transport: {
      kind: "graph",
      mailbox: "noreply@x.co",
      oauth: { tenantId: "t", clientId: "c", clientSecret: "s" },
    },
  },
};

const smtpConfig = {
  ok: true,
  config: {
    from: "noreply@x.co",
    to: ["admin@x.co", "sales@x.co"],
    transport: {
      kind: "smtp",
      host: "smtp.x.co",
      port: 587,
      secure: false,
      user: "noreply@x.co",
      auth: { kind: "password", password: "hunter2" },
    },
  },
};

beforeEach(() => {
  // `clearAllMocks` only clears recorded calls — a `mockRejectedValue` set by a
  // failure test would survive into the next one and make it pass or fail for
  // the wrong reason. Reset, then re-establish the happy-path defaults.
  vi.resetAllMocks();
  sendMail.mockResolvedValue({ messageId: "<test>" });
  getTransporter.mockResolvedValue({ sendMail });
  sendViaGraph.mockResolvedValue(undefined);
});

describe("sendContactMail — Graph transport", () => {
  it("sends via Graph and reports which transport was used", async () => {
    readMailConfig.mockReturnValue(graphConfig);

    await expect((await load())(payload)).resolves.toEqual({
      status: "sent",
      via: "graph",
    });
    expect(sendViaGraph).toHaveBeenCalledOnce();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("passes the mailbox, recipients and built message through", async () => {
    readMailConfig.mockReturnValue(graphConfig);
    await (await load())(payload);

    expect(sendViaGraph).toHaveBeenCalledWith(
      expect.objectContaining({
        mailbox: "noreply@x.co",
        to: ["admin@x.co"],
        mail: expect.objectContaining({
          subject: "[Website] New enquiry from Somchai",
          replyTo: "somchai@example.co.th",
        }),
      }),
    );
  });
});

describe("sendContactMail — SMTP transport", () => {
  it("sends via nodemailer and reports which transport was used", async () => {
    readMailConfig.mockReturnValue(smtpConfig);

    await expect((await load())(payload)).resolves.toEqual({
      status: "sent",
      via: "smtp",
    });
    expect(sendViaGraph).not.toHaveBeenCalled();
  });

  it("joins multiple recipients into one To header", async () => {
    readMailConfig.mockReturnValue(smtpConfig);
    await (await load())(payload);

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "admin@x.co, sales@x.co" }),
    );
  });

  it("keeps From as the configured mailbox and Reply-To as the visitor", async () => {
    // Spoofing the visitor in From would fail SPF/DMARC on most receivers.
    readMailConfig.mockReturnValue(smtpConfig);
    await (await load())(payload);

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "noreply@x.co",
        replyTo: "somchai@example.co.th",
      }),
    );
  });

  it("sends both a text and an html part", async () => {
    readMailConfig.mockReturnValue(smtpConfig);
    await (await load())(payload);

    const [args] = sendMail.mock.calls[0]!;
    expect(args.text).toContain("Please send a quote.");
    expect(args.html).toContain("<!doctype html>");
  });
});

describe("sendContactMail — failure mapping", () => {
  it("reports a missing configuration without attempting a send", async () => {
    readMailConfig.mockReturnValue({ ok: false, missing: ["SMTP_USER"] });

    await expect((await load())(payload)).resolves.toEqual({
      status: "not_configured",
      missing: ["SMTP_USER"],
    });
    expect(sendMail).not.toHaveBeenCalled();
    expect(sendViaGraph).not.toHaveBeenCalled();
  });

  it("treats a config-reading throw as a configuration fault, not a transport one", async () => {
    // A bad master key is the operator's problem to fix, and reporting it as a
    // send failure would point the investigation at the mail server instead.
    readMailConfig.mockImplementation(() => {
      throw new Error("CONFIG_MASTER_KEY is wrong");
    });

    await expect((await load())(payload)).resolves.toEqual({
      status: "not_configured",
      missing: ["CONFIG_MASTER_KEY is wrong"],
    });
  });

  it("stringifies a non-Error thrown while reading config", async () => {
    readMailConfig.mockImplementation(() => {
      throw "just a string";
    });

    await expect((await load())(payload)).resolves.toEqual({
      status: "not_configured",
      missing: ["just a string"],
    });
  });

  it("reports the reason when Graph delivery fails", async () => {
    readMailConfig.mockReturnValue(graphConfig);
    sendViaGraph.mockRejectedValue(new Error("403 Forbidden"));

    await expect((await load())(payload)).resolves.toEqual({
      status: "send_failed",
      reason: "403 Forbidden",
    });
  });

  it("reports the reason when SMTP delivery fails", async () => {
    readMailConfig.mockReturnValue(smtpConfig);
    sendMail.mockRejectedValue(new Error("535 auth failed"));

    await expect((await load())(payload)).resolves.toEqual({
      status: "send_failed",
      reason: "535 auth failed",
    });
  });

  it("reports a failure to build the transport as a send failure", async () => {
    readMailConfig.mockReturnValue(smtpConfig);
    getTransporter.mockRejectedValue(new Error("token request failed"));

    await expect((await load())(payload)).resolves.toEqual({
      status: "send_failed",
      reason: "token request failed",
    });
  });

  it("never throws — the route depends on a returned status", async () => {
    readMailConfig.mockReturnValue(smtpConfig);
    sendMail.mockRejectedValue("a bare string rejection");

    await expect((await load())(payload)).resolves.toEqual({
      status: "send_failed",
      reason: "a bare string rejection",
    });
  });
});
