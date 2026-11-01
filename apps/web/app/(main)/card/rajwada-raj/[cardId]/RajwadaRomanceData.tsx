/**
 * Data layer for the Rajwada Romance template.
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
export const DEMO_RAJWADA: WeddingCardView = {
  category: "wedding",
  brideName: "Siya",
  groomName: "Arjun",
  coupleHashtag: "#ArjunWedsSiya",
  brideParents: "Mr. & Mrs. Rajesh Sharma",
  groomParents: "Mr. & Mrs. Vikram Malhotra",
  hostLine: null,
  eventDate: "2027-02-20T19:30:00+05:30",
  timezone: "Asia/Kolkata",
  venueName: "The Lake Palace Gardens",
  venueAddress: "Pichola Lake Road, Udaipur, Rajasthan",
  mapUrl: "https://maps.google.com/?q=Udaipur+Rajasthan",
  events: [
    {
      name: "Haldi & Mehendi",
      date: "2027-02-19T11:00:00+05:30",
      startTime: null,
      venueName: "Haveli Courtyard",
      venueAddress: null,
    },
    {
      name: "Sangeet Night",
      date: "2027-02-19T19:00:00+05:30",
      startTime: null,
      venueName: "The Lake Palace Gardens",
      venueAddress: null,
    },
  ],
  yearsTogether: null,
  invitationMessage:
    "With the blessings of our elders and the love of our families, we invite you to be part of the beginning of our forever.",
  rsvpContactName: "Kavita Sharma",
  rsvpPhone: "+91 98765 43210",
  rsvpEmail: "rsvp@arjunwedssiya.com",
  rsvpByDate: "2027-02-05T12:00:00+05:30",
  dressCode: "Traditional Indian attire in jewel tones",
  additionalNotes: "Dinner follows the ceremony. Shuttle service runs from the main gate every 15 minutes.",
  language: "en",
};
