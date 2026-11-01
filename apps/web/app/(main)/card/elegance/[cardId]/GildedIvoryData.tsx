/**
 * Data layer for the Gilded Ivory template.
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
export const DEMO_GILDED: WeddingCardView = {
  category: "wedding",
  brideName: "Radhika",
  groomName: "Aarav",
  coupleHashtag: "#AaravWedsRadhika",
  brideParents: "Mr. & Mrs. Suresh Iyer",
  groomParents: "Mr. & Mrs. Anil Kapoor",
  hostLine: null,
  eventDate: "2027-05-22T18:00:00+05:30",
  timezone: "Asia/Kolkata",
  venueName: "The Grand Palace",
  venueAddress: "Colaba, Mumbai",
  mapUrl: "https://maps.google.com/?q=Colaba+Mumbai",
  events: [
    {
      name: "Mehendi & Sangeet",
      date: "2027-05-21T17:00:00+05:30",
      startTime: null,
      venueName: "The Grand Palace Lawns",
      venueAddress: null,
    },
    {
      name: "Reception Dinner",
      date: "2027-05-22T20:30:00+05:30",
      startTime: null,
      venueName: "The Grand Palace",
      venueAddress: null,
    },
  ],
  yearsTogether: null,
  invitationMessage:
    "Two hearts, two families, one beautiful beginning. We would be honoured to have you with us as we say “I do”.",
  rsvpContactName: "Meera Iyer",
  rsvpPhone: "+91 99887 76655",
  rsvpEmail: "rsvp@aaravandradhika.com",
  rsvpByDate: "2027-05-05T12:00:00+05:30",
  dressCode: "Ivory, champagne and gold",
  additionalNotes: "Dinner follows the ceremony. Valet parking is available at the main entrance.",
  language: "en",
};
