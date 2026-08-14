/**
 * Backend contract for `POST /api/contact`.
 */
export interface ContactRequest {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  subject?: string;
  message: string;
  /**
   * Honeypot. Hidden from people, so anything here means a bot filled the form
   * blindly. Named to look like a field worth filling.
   */
  website?: string;
}

export interface ContactResponse {
  ok: boolean;
}
