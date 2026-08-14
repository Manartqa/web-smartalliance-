import { postContactApi } from "@/lib/api/api-main";
import type { ContactRequest } from "@/types/api/main/contact";
import type { ContactFormValues, ContactSubmitResult } from "@/types/app/contact";

/** Trim everything and drop the optional fields the user left blank. */
const toRequest = (values: ContactFormValues): ContactRequest => {
  const company = values.company.trim();
  const phone = values.phone.trim();
  const subject = values.subject.trim();

  return {
    name: values.name.trim(),
    email: values.email.trim(),
    message: values.message.trim(),
    ...(company ? { company } : {}),
    ...(phone ? { phone } : {}),
    ...(subject ? { subject } : {}),
  };
};

export const submitContact = async (
  values: ContactFormValues,
): Promise<ContactSubmitResult> => {
  const res = await postContactApi(toRequest(values));
  return { ok: res.data?.ok ?? true };
};
