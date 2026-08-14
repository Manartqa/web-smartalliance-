"use client";

import { useMutation } from "@tanstack/react-query";

import { submitContact } from "@/services/contact.service";
import type { ContactFormValues, ContactSubmitResult } from "@/types/app/contact";

export const CONTACT_SUBMIT_MUTATION_KEY = ["contactSubmit"] as const;

export const useContactSubmit = () => {
  const { mutateAsync, isPending, isSuccess, isError, reset } = useMutation<
    ContactSubmitResult,
    Error,
    ContactFormValues
  >({
    mutationKey: [...CONTACT_SUBMIT_MUTATION_KEY],
    mutationFn: submitContact,
  });

  return { submit: mutateAsync, isPending, isSuccess, isError, reset };
};
