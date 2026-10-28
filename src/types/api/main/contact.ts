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
   * The visitor ticked the box agreeing to the privacy policy and terms. The
   * route rejects anything but `true`: under the PDPA the consent has to be
   * given, not assumed.
   */
  consent: boolean;
  /**
   * reCAPTCHA v3 token for the `contact` action. Absent when the deployment has
   * no site key; the route then decides whether that is acceptable.
   */
  recaptchaToken?: string;
  /**
   * Honeypot. Hidden from people, so anything here means a bot filled the form
   * blindly. Named to look like a field worth filling.
   */
  website?: string;
}

export interface ContactResponse {
  ok: boolean;
}
