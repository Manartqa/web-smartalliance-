"use client";

import Image from "next/image";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslations } from "next-intl";

import { BaseButton } from "@/components/ui/Button";
import { ChevronRight } from "@/components/ui/Icon";
import { BaseInput, BaseTextarea } from "@/components/ui/Input";
import { useContactSubmit } from "@/hooks/contact";
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
  const [values, setValues] = useState<ContactFormValues>(CONTACT_FORM_DEFAULTS);
  const [errors, setErrors] = useState<ContactFieldErrors>({});
  const { submit, isPending, isSuccess, isError, reset } = useContactSubmit();

  const set = (field: ContactFieldName, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
    // Clear a stale success/error banner as soon as the user edits again.
    if (isSuccess || isError) reset();
  };

  const validate = () => {
    const next: ContactFieldErrors = {};
    if (!values.name.trim()) next.name = t("errors.nameRequired");
    if (!values.email.trim()) next.email = t("errors.emailRequired");
    else if (!EMAIL_PATTERN.test(values.email))
      next.email = t("errors.emailInvalid");
    if (!values.message.trim()) next.message = t("errors.messageRequired");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      await submit(values);
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
      "aria-invalid": errors[field] ? true : undefined,
      "aria-describedby": errors[field] ? `${field}-error` : undefined,
    };
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
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
        {isError && (
          <span className="text-sm font-medium text-red-600">{t("error")}</span>
        )}
      </p>

      <p className="flex items-start gap-2 text-xs font-light text-placeholder">
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
    </form>
  );
}
