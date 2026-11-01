/**
 * Data layer for the Teal Lantern template.
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
export const DEMO_TEAL_LANTERN: WeddingCardView = {
  category: "wedding",
  brideName: "Pooja",
  groomName: "Rahul",
  coupleHashtag: "#PoojaWedsRahul",
  brideParents: "Mr. & Mrs. Anil Mehta",
  groomParents: "Mr. & Mrs. Vikram Kapoor",
  hostLine: null,
  eventDate: "2027-05-23T18:00:00+05:30",
  timezone: "Asia/Kolkata",
  venueName: "The Ocean Palace",
  venueAddress: "Sea Breeze Avenue, Coastal Road, Mumbai, India",
  mapUrl: "https://maps.google.com/?q=Mumbai",
  events: [
    {
      name: "Sangeet Evening",
      date: "2027-05-22T19:00:00+05:30",
      startTime: null,
      venueName: "The Pearl Terrace",
      venueAddress: null,
    },
    {
      name: "Wedding Ceremony",
      date: "2027-05-23T18:00:00+05:30",
      startTime: null,
      venueName: "The Ocean Palace",
      venueAddress: null,
    },
    {
      name: "Reception to Follow",
      date: "2027-05-23T20:30:00+05:30",
      startTime: null,
      venueName: "The Ocean Palace",
      venueAddress: null,
    },
  ],
  yearsTogether: null,
  invitationMessage:
    "With joyful hearts and the blessings of our families, we invite you to celebrate the beginning of our forever by the sea. Your presence will make our day truly complete.",
  rsvpContactName: "Neha Mehta",
  rsvpPhone: "+91 98100 12345",
  rsvpEmail: "rsvp@poojaandrahul.com",
  rsvpByDate: "2027-05-05T12:00:00+05:30",
  dressCode: "Pastels, ivory and soft teal",
  additionalNotes: "Dinner follows the ceremony. Valet parking is available at the main entrance.",
  language: "en",
};
