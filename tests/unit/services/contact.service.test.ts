import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ContactFormValues } from "@/types/app/contact";

const postContactApi = vi.fn();

vi.mock("@/lib/api/api-main", () => ({
  postContactApi: (payload: unknown) => postContactApi(payload),
}));

const load = async () => (await import("@/services/contact.service")).submitContact;

const values = (overrides: Partial<ContactFormValues> = {}): ContactFormValues => ({
  name: "Somchai",
  email: "somchai@example.co.th",
  company: "",
  phone: "",
  subject: "",
  message: "Please send a quote.",
  website: "",
  ...overrides,
});

beforeEach(() => {
  vi.resetAllMocks();
  postContactApi.mockResolvedValue({ data: { ok: true } });
});

describe("submitContact — request shaping", () => {
  it("trims the required fields", async () => {
    await (await load())(
      values({ name: "  Somchai  ", email: "  a@b.co  ", message: "  hi  " }),
    );

    expect(postContactApi).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Somchai", email: "a@b.co", message: "hi" }),
    );
  });

  it("drops optional fields the user left blank", async () => {
    await (await load())(values());

    const [payload] = postContactApi.mock.calls[0]!;
    expect(payload).not.toHaveProperty("company");
    expect(payload).not.toHaveProperty("phone");
    expect(payload).not.toHaveProperty("subject");
  });

  it("drops optional fields containing only whitespace", async () => {
    await (await load())(values({ company: "   ", phone: "\t", subject: "  " }));

    const [payload] = postContactApi.mock.calls[0]!;
    expect(payload).not.toHaveProperty("company");
    expect(payload).not.toHaveProperty("phone");
    expect(payload).not.toHaveProperty("subject");
  });

  it("includes and trims the optional fields that were filled in", async () => {
    await (await load())(
      values({ company: "  Acme  ", phone: "  +66 2  ", subject: "  Quote  " }),
    );

    expect(postContactApi).toHaveBeenCalledWith(
      expect.objectContaining({
        company: "Acme",
        phone: "+66 2",
        subject: "Quote",
      }),
    );
  });

  it("omits the honeypot when it is empty, as it is for every real visitor", async () => {
    await (await load())(values());

    expect(postContactApi.mock.calls[0]![0]).not.toHaveProperty("website");
  });

  it("forwards a filled honeypot verbatim for the route to judge", async () => {
    // Trimming it here would let a whitespace-only bot submission through.
    await (await load())(values({ website: "  spam.example  " }));

    expect(postContactApi).toHaveBeenCalledWith(
      expect.objectContaining({ website: "  spam.example  " }),
    );
  });
});

describe("submitContact — result", () => {
  it("returns the server's ok flag", async () => {
    postContactApi.mockResolvedValue({ data: { ok: true } });
    await expect((await load())(values())).resolves.toEqual({ ok: true });
  });

  it("passes a false ok through rather than assuming success", async () => {
    postContactApi.mockResolvedValue({ data: { ok: false } });
    await expect((await load())(values())).resolves.toEqual({ ok: false });
  });

  it.each([
    ["an absent data object", {}],
    ["a null body", { data: null }],
    ["a body without ok", { data: {} }],
  ])("defaults to ok for %s on a 2xx response", async (_label, response) => {
    // A 2xx with an unexpected shape still means the route accepted it — the
    // interceptor is what turns a non-2xx into a throw.
    postContactApi.mockResolvedValue(response);
    await expect((await load())(values())).resolves.toEqual({ ok: true });
  });

  it("propagates a rejection instead of swallowing it", async () => {
    // The form's error banner is driven by the mutation rejecting.
    postContactApi.mockRejectedValue(new Error("Network Error"));
    await expect((await load())(values())).rejects.toThrow("Network Error");
  });
});
