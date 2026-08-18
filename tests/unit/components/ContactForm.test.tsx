import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import en from "../../../messages/en.json";

import { ApiError } from "@/lib/api/interceptor";

const submitContact = vi.fn();

vi.mock("@/services/contact.service", () => ({
  submitContact: (values: unknown) => submitContact(values),
}));

/**
 * `next/image` renders a plain <img> under jsdom, which has no Next image
 * optimizer. Only the two decorative icons in this form use it.
 */
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

const ContactForm = (await import("@/components/partials/Contact/ContactForm"))
  .default;

/** Real English copy, so the assertions below match what a visitor reads. */
const renderForm = (ui: ReactElement = <ContactForm />) => {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </NextIntlClientProvider>,
  );
};

const t = en.contact.form;

/**
 * `delay: null` removes userEvent's default pause between keystrokes. With it,
 * typing the fixtures below dominates the suite's runtime (~17s) for no added
 * coverage — nothing here depends on real inter-key timing.
 */
const setupUser = () => userEvent.setup({ delay: null });

const fill = async (
  user: ReturnType<typeof userEvent.setup>,
  values: Partial<Record<string, string>> = {},
) => {
  const filled = {
    name: "Somchai Jaidee",
    email: "somchai@example.co.th",
    message: "We would like a quote.",
    ...values,
  };

  for (const [field, value] of Object.entries(filled)) {
    if (!value) continue;
    await user.type(screen.getByLabelText(t[field as keyof typeof t] as string), value);
  }
};

const submit = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: new RegExp(t.submit, "i") }));

beforeEach(() => {
  vi.resetAllMocks();
  submitContact.mockResolvedValue({ ok: true });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ContactForm — rendering", () => {
  it("renders every visible field", () => {
    renderForm();

    for (const field of ["name", "email", "company", "phone", "subject", "message"]) {
      expect(
        screen.getByLabelText(t[field as keyof typeof t] as string),
        field,
      ).toBeInTheDocument();
    }
  });

  it("marks only the required fields in their placeholders", () => {
    renderForm();

    for (const field of ["name", "email", "message"]) {
      expect(
        screen.getByLabelText(t[field as keyof typeof t] as string),
      ).toHaveAttribute("placeholder", expect.stringContaining(t.required));
    }
    for (const field of ["company", "phone", "subject"]) {
      expect(
        screen.getByLabelText(t[field as keyof typeof t] as string),
      ).not.toHaveAttribute("placeholder", expect.stringContaining(t.required));
    }
  });

  it("keeps the honeypot out of the accessibility tree and out of tab order", () => {
    // A field a screen reader announces is a field a real visitor can fill by
    // accident — and a filled honeypot silently discards their message.
    renderForm();

    const honeypot = document.querySelector<HTMLInputElement>("#contact-ref");
    expect(honeypot).not.toBeNull();
    expect(honeypot).toHaveAttribute("tabindex", "-1");
    expect(honeypot!.closest("[aria-hidden]")).not.toBeNull();

    // Queried by role, which is the only family of queries that honours
    // `aria-hidden` — the honeypot must not be among the textboxes a screen
    // reader offers.
    const reachable = screen.queryAllByRole("textbox");
    expect(reachable).not.toContain(honeypot);
    expect(
      screen.queryByRole("textbox", { name: /leave this field empty/i }),
    ).not.toBeInTheDocument();
  });

  it("opts the honeypot out of the password managers that ignore autocomplete=off", () => {
    renderForm();
    const honeypot = document.querySelector<HTMLInputElement>("#contact-ref")!;

    expect(honeypot).toHaveAttribute("autocomplete", "off");
    expect(honeypot).toHaveAttribute("data-1p-ignore");
    expect(honeypot).toHaveAttribute("data-lpignore", "true");
    expect(honeypot).toHaveAttribute("data-form-type", "other");
  });

  it("sets input types and autocomplete hints for mobile keyboards", () => {
    renderForm();

    expect(screen.getByLabelText(t.email)).toHaveAttribute("type", "email");
    expect(screen.getByLabelText(t.phone)).toHaveAttribute("type", "tel");
    expect(screen.getByLabelText(t.name)).toHaveAttribute("autocomplete", "name");
    expect(screen.getByLabelText(t.company)).toHaveAttribute(
      "autocomplete",
      "organization",
    );
  });
});

describe("ContactForm — client validation", () => {
  it("blocks an empty submission and names each missing field", async () => {
    const user = setupUser();
    renderForm();

    await submit(user);

    expect(await screen.findByText(t.errors.nameRequired)).toBeInTheDocument();
    expect(screen.getByText(t.errors.emailRequired)).toBeInTheDocument();
    expect(screen.getByText(t.errors.messageRequired)).toBeInTheDocument();
    expect(submitContact).not.toHaveBeenCalled();
  });

  it("rejects a malformed address with a different message than a missing one", async () => {
    const user = setupUser();
    renderForm();

    await fill(user, { email: "not-an-email" });
    await submit(user);

    expect(await screen.findByText(t.errors.emailInvalid)).toBeInTheDocument();
    expect(screen.queryByText(t.errors.emailRequired)).not.toBeInTheDocument();
    expect(submitContact).not.toHaveBeenCalled();
  });

  it("treats a whitespace-only required field as empty", async () => {
    const user = setupUser();
    renderForm();

    await fill(user, { name: "   " });
    await submit(user);

    expect(await screen.findByText(t.errors.nameRequired)).toBeInTheDocument();
    expect(submitContact).not.toHaveBeenCalled();
  });

  it("marks the invalid field for assistive technology", async () => {
    const user = setupUser();
    renderForm();

    await submit(user);

    await waitFor(() => {
      expect(screen.getByLabelText(t.name)).toHaveAttribute("aria-invalid", "true");
    });
    expect(screen.getByLabelText(t.name)).toHaveAttribute(
      "aria-describedby",
      "name-error",
    );
  });

  it("clears a field's error as soon as the visitor edits it", async () => {
    const user = setupUser();
    renderForm();

    await submit(user);
    expect(await screen.findByText(t.errors.nameRequired)).toBeInTheDocument();

    await user.type(screen.getByLabelText(t.name), "S");

    await waitFor(() => {
      expect(screen.queryByText(t.errors.nameRequired)).not.toBeInTheDocument();
    });
    // The other fields' errors stay until they are edited too.
    expect(screen.getByText(t.errors.emailRequired)).toBeInTheDocument();
  });

  it("does not require the optional fields", async () => {
    const user = setupUser();
    renderForm();

    await fill(user);
    await submit(user);

    await waitFor(() => expect(submitContact).toHaveBeenCalledOnce());
  });
});

describe("ContactForm — submission", () => {
  it("sends every field, with the honeypot empty", async () => {
    const user = setupUser();
    renderForm();

    await fill(user, { company: "Acme Co.", phone: "021234567", subject: "Quote" });
    await submit(user);

    await waitFor(() =>
      expect(submitContact).toHaveBeenCalledWith({
        name: "Somchai Jaidee",
        email: "somchai@example.co.th",
        company: "Acme Co.",
        phone: "021234567",
        subject: "Quote",
        message: "We would like a quote.",
        website: "",
      }),
    );
  });

  it("shows the success message and clears the form", async () => {
    const user = setupUser();
    renderForm();

    await fill(user);
    await submit(user);

    expect(await screen.findByText(t.success)).toBeInTheDocument();
    expect(screen.getByLabelText(t.name)).toHaveValue("");
    expect(screen.getByLabelText(t.email)).toHaveValue("");
    expect(screen.getByLabelText(t.message)).toHaveValue("");
  });

  it("announces the result politely rather than moving focus", async () => {
    const user = setupUser();
    renderForm();

    await fill(user);
    await submit(user);

    const banner = await screen.findByText(t.success);
    expect(banner.closest("[aria-live]")).toHaveAttribute("aria-live", "polite");
  });

  it("disables the button and shows progress while the request is in flight", async () => {
    const user = setupUser();
    let resolve!: (value: { ok: boolean }) => void;
    submitContact.mockReturnValue(
      new Promise<{ ok: boolean }>((r) => {
        resolve = r;
      }),
    );
    renderForm();

    await fill(user);
    await submit(user);

    const button = await screen.findByRole("button", {
      name: new RegExp(t.submitting, "i"),
    });
    expect(button).toBeDisabled();

    resolve({ ok: true });
    expect(await screen.findByText(t.success)).toBeInTheDocument();
  });

  it("does not submit twice when the button is clicked again mid-flight", async () => {
    const user = setupUser();
    submitContact.mockReturnValue(new Promise(() => {}));
    renderForm();

    await fill(user);
    await submit(user);

    // Queried by role alone: while pending the button's label is `submitting`,
    // so matching on the idle label would miss it.
    await user.click(await screen.findByRole("button"));

    expect(submitContact).toHaveBeenCalledOnce();
  });
});

describe("ContactForm — failure handling", () => {
  it("shows the generic error and keeps what the visitor typed", async () => {
    const user = setupUser();
    submitContact.mockRejectedValue(new ApiError(502, "send_failed"));
    renderForm();

    await fill(user);
    await submit(user);

    expect(await screen.findByText(t.error)).toBeInTheDocument();
    // Clearing the form here would lose a message the visitor has to retype.
    expect(screen.getByLabelText(t.message)).toHaveValue("We would like a quote.");
  });

  it("names the too-many-submissions case, which the visitor can act on", async () => {
    const user = setupUser();
    submitContact.mockRejectedValue(new ApiError(429, "rate_limited"));
    renderForm();

    await fill(user);
    await submit(user);

    expect(await screen.findByText(t.errors.tooMany)).toBeInTheDocument();
    expect(screen.queryByText(t.error)).not.toBeInTheDocument();
  });

  it("falls back to the generic error for a transport failure with no code", async () => {
    const user = setupUser();
    submitContact.mockRejectedValue(new Error("Network Error"));
    renderForm();

    await fill(user);
    await submit(user);

    expect(await screen.findByText(t.error)).toBeInTheDocument();
  });

  it("re-enables the button so the visitor can retry", async () => {
    const user = setupUser();
    submitContact.mockRejectedValue(new ApiError(502, "send_failed"));
    renderForm();

    await fill(user);
    await submit(user);
    await screen.findByText(t.error);

    expect(
      screen.getByRole("button", { name: new RegExp(t.submit, "i") }),
    ).toBeEnabled();
  });

  it("clears the error banner once the visitor edits a field", async () => {
    const user = setupUser();
    submitContact.mockRejectedValue(new ApiError(502, "send_failed"));
    renderForm();

    await fill(user);
    await submit(user);
    await screen.findByText(t.error);

    await user.type(screen.getByLabelText(t.name), "!");

    await waitFor(() => {
      expect(screen.queryByText(t.error)).not.toBeInTheDocument();
    });
  });

  it("succeeds on a retry after a failure", async () => {
    const user = setupUser();
    submitContact.mockRejectedValueOnce(new ApiError(502, "send_failed"));
    submitContact.mockResolvedValueOnce({ ok: true });
    renderForm();

    await fill(user);
    await submit(user);
    await screen.findByText(t.error);

    await submit(user);
    expect(await screen.findByText(t.success)).toBeInTheDocument();
  });
});
