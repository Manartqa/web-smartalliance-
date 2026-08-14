import type { ContactRequest, ContactResponse } from "@/types/api/main/contact";

import { mainClient } from "./client";

/** One function per endpoint. Raw typed calls only — no business logic here. */
export const postContactApi = (payload: ContactRequest) =>
  mainClient.post<ContactResponse>("/api/contact", payload);
