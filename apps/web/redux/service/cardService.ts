import { RootApiService } from "./root";
import type { ApiResponse } from "./authService";
import type { TemplateCategory } from "./templateService";

/** POST /cards, from cardRouter.py (prefix "/cards", empty path). */
export const CARD_CREATE_ENDPOINT = "/cards";

export type WeddingCategory = "wedding" | "reception" | "anniversary" | "engagement";
export type CelebrationCategory = "birthday" | "baby_shower";

/* ------------------------------------------------------------------ */
/* REQUEST types (what the create/update forms send)                   */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/* RESPONSE types (what GET /cards/{cardId} returns)                   */
/* Pydantic `X | None` fields come back as `null`, not missing.        */
/* ------------------------------------------------------------------ */
export type EventScheduleResponse = {
  name: string;
  date: string; // ISO datetime
  startTime: string | null;
  venueName: string | null;
  venueAddress: string | null;
};

export type WeddingDetailsResponse = {
  category: WeddingCategory;
  brideName: string;
  groomName: string;
  coupleHashtag: string | null;
  brideParents: string | null;
  groomParents: string | null;
  hostLine: string | null;
  eventDate: string;
  venueName: string | null;
  venueAddress: string | null;
  mapUrl: string | null;
  events: EventScheduleResponse[];
  yearsTogether: number | null;
};

export type BirthdayDetailsResponse = {
  category: CelebrationCategory;
  celebrantName: string;
  celebrantAge: number | null;
  theme: string | null;
  parentNames: string | null;
  eventDate: string;
  venueName: string | null;
  venueAddress: string | null;
  mapUrl: string | null;
};

/** Mirrors `CardDetails` in cardDetails.py (plus the _id the service stringifies). */
export type CardDetailsPayload = {
  _id: string;
  /** Not on the CardDetails model any more, but createCard still stores it, so it may be present. */
  cardId?: string;
  templateId: string;
  templateCategory: TemplateCategory;
  specificDetails: WeddingDetailsResponse | BirthdayDetailsResponse;
  invitationMessage: string | null;
  rsvpContactName: string | null;
  rsvpPhone: string | null;
  rsvpEmail: string | null;
  rsvpByDate: string | null;
  dressCode: string | null;
  additionalNotes: string | null;
  language: string;
};

/** Returned by GET /cards/{cardId}: both the card and its details. */
export type CardPayload = {
  card: {
    _id: string;
    ownerId: string;
    templateId: string;
    templateVersion: number;
    publicSlug: string;
    cardDetailsId: string;
    customization: Record<string, unknown>;
    photoUrls: string[];
    status: "draft" | "published";
    isPaid: boolean;
    paidAt: string | null;
    paymentId: string | null;
    viewCount: number;
    rsvpCount: number;
  };
  details: CardDetailsPayload;
};

export const cardService = RootApiService.injectEndpoints({
  endpoints: (build) => ({
    createCard: build.mutation<ApiResponse<CreateCardResponse>, CreateCardRequest>({
      query: (body) => ({ url: CARD_CREATE_ENDPOINT, method: "POST", body }),
      invalidatesTags: ["Card"],
    }),
    getCard: build.query<ApiResponse<CardPayload>, string>({
      query: (cardId) => ({ url: `/cards/${encodeURIComponent(cardId)}`, method: "GET" }),
      providesTags: ["Card"], // add "Card" to tagTypes in RootApiService if it isn't there yet
    }),
  }),
  overrideExisting: false,
});

export const { useCreateCardMutation, useGetCardQuery } = cardService;