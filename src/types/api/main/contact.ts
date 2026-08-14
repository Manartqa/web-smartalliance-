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
}

export interface ContactResponse {
  ok: boolean;
}
