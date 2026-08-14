import Image from "next/image";

import type { ContactFieldName } from "@/types/app/contact";

import { CONTACT_FIELD_ICONS } from "./Contact.config";

interface ContactFieldIconProps {
  field: ContactFieldName;
}

export function ContactFieldIcon({ field }: ContactFieldIconProps) {
  return (
    <Image
      src={CONTACT_FIELD_ICONS[field]}
      alt=""
      width={20}
      height={20}
      aria-hidden
      className="pointer-events-none absolute left-3.5 top-4 h-5 w-5 object-contain"
    />
  );
}

interface ContactFieldErrorProps {
  field: ContactFieldName;
  message?: string;
}

export function ContactFieldError({ field, message }: ContactFieldErrorProps) {
  if (!message) return null;

  return (
    <p id={`${field}-error`} role="alert" className="mt-1.5 text-xs text-red-600">
      {message}
    </p>
  );
}
