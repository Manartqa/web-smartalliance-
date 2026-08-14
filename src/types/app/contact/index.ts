/** Frontend domain types for the contact feature. */

export type ContactFieldName =
  | "name"
  | "email"
  | "company"
  | "phone"
  | "subject"
  | "message";

export type ContactFormValues = Record<ContactFieldName, string>;

export type ContactFieldErrors = Partial<Record<ContactFieldName, string>>;

/** Result of a submission, already normalised away from the HTTP layer. */
export interface ContactSubmitResult {
  ok: boolean;
}
