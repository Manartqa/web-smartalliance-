"use client";

import Image from "next/image";
import Script from "next/script";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";

import { BaseButton } from "@/components/ui/Button";
import { ChevronRight } from "@/components/ui/Icon";
import { BaseInput, BaseTextarea } from "@/components/ui/Input";
import { useContactSubmit } from "@/hooks/contact";
import { Link } from "@/i18n/navigation";
import { ApiError } from "@/lib/api/interceptor";
import { getRecaptchaToken, recaptchaScriptSrc } from "@/lib/recaptcha/client";
import type {
  ContactFieldErrors,
  ContactFieldName,
  ContactFormValues,
} from "@/types/app/contact";

import {
  CONTACT_FIELD_AUTOCOMPLETE,
  CONTACT_FIELD_INPUT_TYPE,
  CONTACT_FORM_DEFAULTS,
  CONTACT_GRID_FIELDS,
  CONTACT_REQUIRED_FIELDS,
  EMAIL_PATTERN,
} from "./Contact.config";
import { ContactFieldError, ContactFieldIcon } from "./ContactField";

export default function ContactForm() {
  const t = useTranslations("contact.form");
  const locale = useLocale();
  const [values, setValues] = useState<ContactFormValues>(CONTACT_FORM_DEFAULTS);
  const [errors, setErrors] = useState<ContactFieldErrors>({});
  // Set when no reCAPTCHA token could be had (script blocked or failed), which
  // happens before the mutation runs and so is not in its error state.
  const [captchaUnavailable, setCaptchaUnavailable] = useState(false);
  // reCAPTCHA is a heavy third-party script; it loads once the visitor starts
  // on the form, not with the page. A submit waits for it if it is still on
  // its way (see `getRecaptchaToken`).
  const [captchaWanted, setCaptchaWanted] = useState(false);
  const wantCaptcha = () => setCaptchaWanted(true);
  const { submit, isPending, isSuccess, isError, error, reset } =
    useContactSubmit();

  // Too-many-submissions is worth naming; everything else is one generic
  // failure, since the visitor can't act on the difference.
  const errorMessage =
    error instanceof ApiError && error.code === "rate_limited"
      ? t("errors.tooMany")
      : error instanceof ApiError && error.code === "captcha_failed"
        ? t("errors.captcha")
        : t("error");

  const set = (field: ContactFieldName, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
    // Clear a stale success/error banner as soon as the user edits again.
    if (isSuccess || isError) reset();
    setCaptchaUnavailable(false);
  };

  const setConsent = (consent: boolean) => {
    setValues((v) => ({ ...v, consent }));
    setErrors((e) => ({ ...e, consent: undefined }));
    if (isSuccess || isError) reset();
    setCaptchaUnavailable(false);
  };

  const validate = () => {
    const next: ContactFieldErrors = {};
    if (!values.name.trim()) next.name = t("errors.nameRequired");
    if (!values.email.trim()) next.email = t("errors.emailRequired");
    else if (!EMAIL_PATTERN.test(values.email))
      next.email = t("errors.emailInvalid");
    if (!values.message.trim()) next.message = t("errors.messageRequired");
    if (!values.consent) next.consent = t("errors.consentRequired");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    let recaptchaToken: string | undefined;
    try {
      recaptchaToken = await getRecaptchaToken();
    } catch {
      setCaptchaUnavailable(true);
      return;
    }

    try {
      await submit({ ...values, recaptchaToken });
      setValues(CONTACT_FORM_DEFAULTS);
    } catch {
      // `isError` from the mutation drives the banner below.
    }
  };

  const fieldProps = (field: ContactFieldName) => {
    const required = CONTACT_REQUIRED_FIELDS.includes(field);

    return {
      id: field,
      name: field,
      value: values[field],
      onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        set(field, e.target.value),
      placeholder: `${t(field)}${required ? ` ${t("required")}` : ""}`,
      "aria-label": t(field),
      // The "*" lives in the placeholder, which assistive technology and
      // browsing agents cannot rely on. Not `required`: validation is ours.
      "aria-required": required || undefined,
      "aria-invalid": errors[field] ? true : undefined,
      "aria-describedby": errors[field] ? `${field}-error` : undefined,
    };
  };

  return (
    <form
      onSubmit={handleSubmit}
      onFocus={wantCaptcha}
      onPointerDown={wantCaptcha}
      noValidate
      className="grid gap-4"
    >
      {/* Honeypot: off-screen rather than display:none, since some bots skip
          hidden inputs. Never focusable, never announced; `inert` also keeps
          browsing agents, which act on the DOM, from filling it.

          The id/name deliberately match no autofill category. Named `website`
          it was filled with the visitor's own email by Chrome and by password
          managers — and a tripped honeypot silently discards the message, so
          real enquiries vanished. The `data-*` opt-outs below cover
          1Password / LastPass / Dashlane, which ignore `autoComplete="off"`. */}
      <div aria-hidden inert className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
        <label htmlFor="contact-ref">Leave this field empty</label>
        <input
          id="contact-ref"
          name="contact-ref"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          data-form-type="other"
          value={values.website}
          onChange={(e) =>
            setValues((v) => ({ ...v, website: e.target.value }))
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {CONTACT_GRID_FIELDS.map((field) => (
          <div key={field}>
            <div className="relative">
              <ContactFieldIcon field={field} />
              <BaseInput
                type={CONTACT_FIELD_INPUT_TYPE[field] ?? "text"}
                autoComplete={CONTACT_FIELD_AUTOCOMPLETE[field]}
                {...fieldProps(field)}
              />
            </div>
            <ContactFieldError field={field} message={errors[field]} />
          </div>
        ))}
      </div>

      <div className="relative">
        <ContactFieldIcon field="subject" />
        <BaseInput type="text" {...fieldProps("subject")} />
      </div>

      <div>
        <div className="relative">
          <ContactFieldIcon field="message" />
          <BaseTextarea rows={6} {...fieldProps("message")} />
        </div>
        <ContactFieldError field="message" message={errors.message} />
      </div>

      {/* Consent is its own required step, ticked by the visitor — never
          pre-checked, which the PDPA does not accept as consent. The policy
          links open in a new tab so following one does not lose the form. */}
      <fieldset className="mt-2">
        <legend className="text-sm font-semibold text-ink">
          {t("consent.label")}{" "}
          <span aria-hidden className="text-red-600">
            {t("required")}
          </span>
        </legend>
        <div className="mt-2 flex items-start gap-3">
          <input
            id="consent"
            name="consent"
            type="checkbox"
            checked={values.consent}
            onChange={(e) => setConsent(e.target.checked)}
            required
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? "consent-error" : undefined}
            className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-blue-cta"
          />
          <label
            htmlFor="consent"
            className="cursor-pointer text-[15px] leading-relaxed text-ink"
          >
            {t.rich("consent.agree", {
              privacy: (chunks) => (
                <Link
                  href="/privacy-policy"
                  target="_blank"
                  className="text-blue-cta underline-offset-2 hover:underline"
                >
                  {chunks}
                </Link>
              ),
              terms: (chunks) => (
                <Link
                  href="/terms"
                  target="_blank"
                  className="text-blue-cta underline-offset-2 hover:underline"
                >
                  {chunks}
                </Link>
              ),
            })}
          </label>
        </div>
        <ContactFieldError field="consent" message={errors.consent} />
      </fieldset>

      <BaseButton
        type="submit"
        disabled={isPending}
        className="mt-2 w-full uppercase"
      >
        {isPending ? t("submitting") : t("submit")}
        <ChevronRight />
      </BaseButton>

      <p aria-live="polite" className="min-h-5">
        {isSuccess && (
          <span className="text-sm font-medium text-green-700">
            {t("success")}
          </span>
        )}
        {(isError || captchaUnavailable) && (
          <span className="text-sm font-medium text-red-600">
            {captchaUnavailable ? t("errors.captcha") : errorMessage}
          </span>
        )}
      </p>

      <p className="flex items-start gap-2 text-xs font-light text-body">
        <Image
          src="/assets/ic-privacy.png"
          alt=""
          width={19}
          height={19}
          aria-hidden
          className="mt-px h-4 w-4"
        />
        {t("privacy")}
      </p>

      {/* reCAPTCHA v3 shows its own badge; nothing loads without a site key. */}
      {captchaWanted && recaptchaScriptSrc(locale) && (
        <Script src={recaptchaScriptSrc(locale)} strategy="afterInteractive" />
      )}
    </form>
  );
}
