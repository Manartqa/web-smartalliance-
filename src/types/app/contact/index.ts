/** Frontend domain types for the contact feature. */

export type ContactFieldName =
  | "name"
  | "email"
  | "company"
  | "phone"
  | "subject"
  | "message";

export type ContactFormValues = Record<ContactFieldName, string> & {
  /**
   * Honeypot. Hidden from people and always submitted empty; the route drops
   * anything that arrives with it filled. Kept out of `ContactFieldName` so it
   * never appears in the rendered field loops.
   */
  website: string;
};

export type ContactFieldErrors = Partial<Record<ContactFieldName, string>>;

/** Result of a submission, already normalised away from the HTTP layer. */
export interface ContactSubmitResult {
  ok: boolean;
}
