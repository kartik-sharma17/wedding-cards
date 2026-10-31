/**
 * Data layer for the Lavender Bloom template.
 * It uses the same wedding data shape as Forest Forever, so the type, the mapper and the
 * helpers are re-exported from there (one place to fix bugs). Only the demo is its own.
 *
 * ADJUST THIS PATH if your forest-forever data file lives somewhere else.
 */
import type { WeddingCardView } from "../../forest-forever/[cardId]/Weddingcard";

export {
  mapCardToWeddingView,
  parseDate,
  safeHttpUrl,
  type CardDetailsApi,
  type EventItem,
  type WeddingCardView,
  type WeddingCategory,
} from "../../forest-forever/[cardId]/Weddingcard";

/** Sample data, only used when the URL has no cardId. */
export const DEMO_LAVENDER: WeddingCardView = {
  category: "wedding",
  brideName: "Olivia",
  groomName: "Aaron",
  coupleHashtag: "#AaronAndOlivia",
  brideParents: "Mr. & Mrs. Daniel Reed",
  groomParents: "Mr. & Mrs. Samuel Brooks",
  hostLine: null,
  eventDate: "2027-04-24T20:00:00+05:30",
  timezone: "Asia/Kolkata",
  venueName: "Liceria Grand Ballroom",
  venueAddress: "12 Rose Garden Road, New Delhi",
  mapUrl: "https://maps.google.com/?q=New+Delhi",
  events: [
    {
      name: "Mehendi & High Tea",
      date: "2027-04-23T16:00:00+05:30",
      startTime: null,
      venueName: "The Lavender Lawn",
      venueAddress: null,
    },
    {
      name: "Dinner & Dancing",
      date: "2027-04-24T21:00:00+05:30",
      startTime: null,
      venueName: "Liceria Grand Ballroom",
      venueAddress: null,
    },
  ],
  yearsTogether: null,
  invitationMessage:
    "With hearts full of gratitude, we invite you to share the beginning of our forever. Your blessings and your company will make our day complete.",
  rsvpContactName: "Grace Reed",
  rsvpPhone: "+91 98100 12345",
  rsvpEmail: "rsvp@aaronandolivia.com",
  rsvpByDate: "2027-04-05T12:00:00+05:30",
  dressCode: "Pastels and lavender tones",
  additionalNotes: "Dinner follows the ceremony. Valet parking is available at the main entrance.",
  language: "en",
};
