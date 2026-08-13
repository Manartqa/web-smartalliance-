"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { ChevronRight } from "@/components/ui/icons";

type FieldName = "name" | "email" | "company" | "phone" | "subject" | "message";
type Status = "idle" | "submitting" | "success" | "error";

const FIELD_ICONS: Record<FieldName, string> = {
  name: "/assets/ic-user-field.png",
  email: "/assets/ic-mail-field.png",
  company: "/assets/ic-company.png",
  phone: "/assets/ic-phone-field.png",
  subject: "/assets/ic-subject-field.png",
  message: "/assets/ic-message-field.png",
};

const EMPTY: Record<FieldName, string> = {
  name: "",
  email: "",
  company: "",
  phone: "",
  subject: "",
  message: "",
};

function FieldIcon({ field }: { field: FieldName }) {
  return (
    <Image
      src={FIELD_ICONS[field]}
      alt=""
      width={20}
      height={20}
      aria-hidden
      className="pointer-events-none absolute left-3.5 top-4 h-5 w-5 object-contain"
    />
  );
}

function FieldError({ field, message }: { field: FieldName; message?: string }) {
  if (!message) return null;
  return (
    <p id={`${field}-error`} role="alert" className="mt-1.5 text-xs text-red-600">
      {message}
    </p>
  );
}

const inputClass =
  "w-full rounded-[10px] border border-field-border bg-field-bg py-3.5 pl-11 pr-4 " +
  "text-sm text-ink placeholder:text-placeholder focus:border-navy focus:outline-none";

export function ContactForm() {
  const t = useTranslations("contact.form");
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [status, setStatus] = useState<Status>("idle");

  const set = (field: FieldName) => (value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const validate = () => {
    const next: Partial<Record<FieldName, string>> = {};
    if (!values.name.trim()) next.name = t("errors.nameRequired");
    if (!values.email.trim()) next.email = t("errors.emailRequired");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
      next.email = t("errors.emailInvalid");
    if (!values.message.trim()) next.message = t("errors.messageRequired");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    setStatus("submitting");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      setStatus("success");
      setValues(EMPTY);
    } catch {
      setStatus("error");
    }
  };

  const fieldProps = (field: FieldName, required = false) => ({
    id: field,
    name: field,
    value: values[field],
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => set(field)(e.target.value),
    placeholder: `${t(field)}${required ? ` ${t("required")}` : ""}`,
    "aria-label": t(field),
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field] ? `${field}-error` : undefined,
    className: inputClass,
  });

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {(["name", "email", "company", "phone"] as const).map((field) => (
          <div key={field}>
            <div className="relative">
              <FieldIcon field={field} />
              <input
                type={
                  field === "email" ? "email" : field === "phone" ? "tel" : "text"
                }
                autoComplete={
                  field === "name"
                    ? "name"
                    : field === "email"
                      ? "email"
                      : field === "phone"
                        ? "tel"
                        : "organization"
                }
                {...fieldProps(field, field === "name" || field === "email")}
              />
            </div>
            <FieldError field={field} message={errors[field]} />
          </div>
        ))}
      </div>

      <div className="relative">
        <FieldIcon field="subject" />
        <input type="text" {...fieldProps("subject")} />
      </div>

      <div>
        <div className="relative">
          <FieldIcon field="message" />
          <textarea rows={6} {...fieldProps("message", true)} />
        </div>
        <FieldError field="message" message={errors.message} />
      </div>

      <Button
        type="submit"
        disabled={status === "submitting"}
        className="mt-2 w-full uppercase"
      >
        {status === "submitting" ? t("submitting") : t("submit")}
        <ChevronRight />
      </Button>

      <p aria-live="polite" className="min-h-5">
        {status === "success" && (
          <span className="text-sm font-medium text-green-700">
            {t("success")}
          </span>
        )}
        {status === "error" && (
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
