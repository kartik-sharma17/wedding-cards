import { RootApiService } from "./root";
import type { ApiResponse } from "./authService";
import type { TemplateCategory } from "./templateService";

/** POST /cards, from cardRouter.py (prefix "/cards", empty path). */
export const CARD_CREATE_ENDPOINT = "/cards";

export type WeddingCategory = "wedding" | "reception" | "anniversary" | "engagement";
export type CelebrationCategory = "birthday" | "baby_shower";

export type EventSchedule = {
  name: string;
  date: string; // naive ISO, e.g. 2026-12-10T00:00:00
  startTime?: string; // "HH:MM"
  venueName?: string;
  venueAddress?: string;
};

/** Mirrors `WeddingDetails` in cardDetails.py */
export type WeddingDetails = {
  category: WeddingCategory;
  brideName: string;
  groomName: string;
  coupleHashtag?: string;
  brideParents?: string;
  groomParents?: string;
  hostLine?: string;
  eventDate: string;
  venueName?: string;
  venueAddress?: string;
  mapUrl?: string;
  events?: EventSchedule[];
  yearsTogether?: number;
};

/** Mirrors `BirthdayDetails` in cardDetails.py */
export type BirthdayDetails = {
  category: CelebrationCategory;
  celebrantName: string;
  celebrantAge?: number;
  theme?: string;
  parentNames?: string;
  eventDate: string;
  venueName?: string;
  venueAddress?: string;
  mapUrl?: string;
};

export type CreateCardRequest = {
  templateId: string;
  templateCategory: TemplateCategory;
  specificDetails: WeddingDetails | BirthdayDetails;
  invitationMessage?: string;
  rsvpContactName?: string;
  rsvpPhone?: string;
  rsvpEmail?: string;
  rsvpByDate?: string;
  dressCode?: string;
  additionalNotes?: string;
  language?: string;
  customization?: Record<string, unknown>;
};

export type CreateCardResponse = { cardId: string; publicSlug: string };

export const cardService = RootApiService.injectEndpoints({
  endpoints: (build) => ({
    createCard: build.mutation<ApiResponse<CreateCardResponse>, CreateCardRequest>({
      query: (body) => ({ url: CARD_CREATE_ENDPOINT, method: "POST", body }),
    }),
  }),
  overrideExisting: false,
});

export const { useCreateCardMutation } = cardService;
