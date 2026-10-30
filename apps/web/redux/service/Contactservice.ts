import { RootApiService } from "./root";
import type { ApiResponse } from "./authService";

export type ContactTopic = "payment" | "card" | "account" | "feedback" | "other";

export const CONTACT_TOPICS: { value: ContactTopic; label: string }[] = [
  { value: "payment", label: "Payment or billing" },
  { value: "card", label: "A problem with my card" },
  { value: "account", label: "Account or login" },
  { value: "feedback", label: "Feedback" },
  { value: "other", label: "Something else" },
];

/** Mirrors `CreateContactSchema` in contactSchema.py */
export type ContactPayload = {
  name: string;
  email: string;
  phone?: string;
  topic: ContactTopic;
  message: string;
  /** honeypot, always sent empty by real users */
  company?: string;
};

export const contactService = RootApiService.injectEndpoints({
  endpoints: (build) => ({
    // POST /contact (public)
    submitContact: build.mutation<ApiResponse<{ id: string } | null>, ContactPayload>({
      query: (body) => ({ url: "/contact", method: "POST", body }),
    }),
  }),
  overrideExisting: false,
});

export const { useSubmitContactMutation } = contactService;