import { NextResponse } from "next/server";

import { EMAIL_PATTERN } from "@/lib/validation";
import type { ApiErrorResponse } from "@/types/api/main/common";
import type { ContactRequest, ContactResponse } from "@/types/api/main/contact";

const fail = (error: ApiErrorResponse["error"], status: number) =>
  NextResponse.json<ApiErrorResponse>({ error }, { status });

export async function POST(request: Request) {
  let body: Partial<ContactRequest>;
  try {
    body = await request.json();
  } catch {
    return fail("invalid_json", 400);
  }

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const message = body.message?.trim() ?? "";

  if (!name || !email || !message || !EMAIL_PATTERN.test(email)) {
    return fail("validation_failed", 400);
  }

  // ---------------------------------------------------------------------
  // NOT WIRED YET. No mail transport is configured, so this route refuses
  // rather than accepting a submission it would silently drop.
  //
  // To go live, pick a transport (Resend, SES, company SMTP), send the mail
  // here, and delete this guard. Add spam protection (Turnstile/reCAPTCHA)
  // and rate limiting at the same time.
  // ---------------------------------------------------------------------
  if (!process.env.CONTACT_MAIL_TO) {
    console.warn("[contact] CONTACT_MAIL_TO is not set — submission rejected.", {
      name,
      email,
      hasMessage: message.length > 0,
    });
    return fail("not_configured", 503);
  }

  return NextResponse.json<ContactResponse>({ ok: true });
}
