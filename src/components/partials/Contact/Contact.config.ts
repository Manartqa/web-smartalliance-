import type { ContactFieldName, ContactFormValues } from "@/types/app/contact";

export const CONTACT_FIELD_ICONS: Record<ContactFieldName, string> = {
  name: "/assets/ic-user-field.png",
  email: "/assets/ic-mail-field.png",
  company: "/assets/ic-company.png",
  phone: "/assets/ic-phone-field.png",
  subject: "/assets/ic-subject-field.png",
  message: "/assets/ic-message-field.png",
};

export const CONTACT_FORM_DEFAULTS: ContactFormValues = {
  name: "",
  email: "",
  company: "",
  phone: "",
  subject: "",
  message: "",
};

/** The four fields rendered in the two-column grid at the top of the form. */
export const CONTACT_GRID_FIELDS = [
  "name",
  "email",
  "company",
  "phone",
] as const;

export const CONTACT_REQUIRED_FIELDS: ContactFieldName[] = [
  "name",
  "email",
  "message",
];

export const CONTACT_FIELD_INPUT_TYPE: Partial<
  Record<ContactFieldName, string>
> = {
  email: "email",
  phone: "tel",
};

export const CONTACT_FIELD_AUTOCOMPLETE: Partial<
  Record<ContactFieldName, string>
> = {
  name: "name",
  email: "email",
  phone: "tel",
  company: "organization",
};

/** Re-exported so the form and the route handler validate identically. */
export { EMAIL_PATTERN } from "@/lib/validation";
