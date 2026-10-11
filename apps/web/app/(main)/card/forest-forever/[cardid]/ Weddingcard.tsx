/**
 * Data layer for the wedding template.
 *  - WeddingCardView   : the ONE shape the template renders (demo and API both use it)
 *  - mapCardToWeddingView : turns GET /cards/{cardId} -> data.details into that shape
 *  - DEMO_WEDDING      : sample data, only used when the URL has no cardId
 */

export type WeddingCategory = "wedding" | "reception" | "anniversary" | "engagement";

const WEDDING_CATEGORIES: readonly string[] = ["wedding", "reception", "anniversary", "engagement"];

type Maybe<T> = T | null | undefined;

export type EventItem = {
  name: string;
  date: string; // ISO datetime
  startTime?: Maybe<string>;
  venueName?: Maybe<string>;
  venueAddress?: Maybe<string>;
};

export type WeddingCardView = {
  category: WeddingCategory;

  // page 1
  brideName: string;
  groomName: string;
  coupleHashtag: string | null;
  brideParents: string | null;
  groomParents: string | null;
  hostLine: string | null;

  // page 2
  eventDate: string;
  timezone: string | null; // IANA name, e.g. "Asia/Kolkata" (optional, see notes)
  venueName: string | null;
  venueAddress: string | null;
  mapUrl: string | null;
  events: EventItem[];
  yearsTogether: number | null;

  // page 3
  invitationMessage: string | null;
  rsvpContactName: string | null;
  rsvpPhone: string | null;
  rsvpEmail: string | null;
  rsvpByDate: string | null;
  dressCode: string | null;
  additionalNotes: string | null;
  language: string;
};

/** Shape of `data.details` from GET /cards/{cardId} (mirrors cardSchema.py). */
export type CardDetailsApi = {
  templateCategory: string;
  specificDetails?: {
    brideName?: Maybe<string>;
    groomName?: Maybe<string>;
    coupleHashtag?: Maybe<string>;
    brideParents?: Maybe<string>;
    groomParents?: Maybe<string>;
    hostLine?: Maybe<string>;
    eventDate?: Maybe<string>;
    timezone?: Maybe<string>;
    venueName?: Maybe<string>;
    venueAddress?: Maybe<string>;
    mapUrl?: Maybe<string>;
    events?: Maybe<EventItem[]>;
    yearsTogether?: Maybe<number>;
  } | null;
  invitationMessage?: Maybe<string>;
  rsvpContactName?: Maybe<string>;
  rsvpPhone?: Maybe<string>;
  rsvpEmail?: Maybe<string>;
  rsvpByDate?: Maybe<string>;
  dressCode?: Maybe<string>;
  additionalNotes?: Maybe<string>;
  language?: Maybe<string>;
};

const clean = (v: Maybe<string>): string | null => {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s : null;
};

/** Only allow http(s) links so a saved "javascript:" URL can never reach an <a href>. */
export const safeHttpUrl = (v: Maybe<string>): string | null => {
  const s = clean(v);
  if (!s) return null;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
};

/**
 * Parses an API datetime. FastAPI/Mongo can return naive datetimes (no "Z"),
 * which are UTC in practice, so we treat "no offset" as UTC instead of letting
 * the browser guess local time.
 */
export const parseDate = (v: Maybe<string>): Date | null => {
  const s = clean(v);
  if (!s) return null;
  let iso = s;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) iso = `${s}T12:00:00Z`;
  else if (!/(Z|[+-]\d{2}:?\d{2})$/i.test(s)) iso = `${s}Z`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};

export function mapCardToWeddingView(details: CardDetailsApi): WeddingCardView {
  if (!WEDDING_CATEGORIES.includes(details.templateCategory)) {
    throw new Error(`This template is for wedding-style cards, but this card is "${details.templateCategory}".`);
  }

  const s = details.specificDetails;
  const brideName = clean(s?.brideName);
  const groomName = clean(s?.groomName);
  const eventDate = clean(s?.eventDate);

  if (!s || !brideName || !groomName || !eventDate || !parseDate(eventDate)) {
    throw new Error("This card is missing the couple's names or a valid event date.");
  }

  return {
    category: details.templateCategory as WeddingCategory,
    brideName,
    groomName,
    coupleHashtag: clean(s.coupleHashtag),
    brideParents: clean(s.brideParents),
    groomParents: clean(s.groomParents),
    hostLine: clean(s.hostLine),
    eventDate,
    timezone: clean(s.timezone),
    venueName: clean(s.venueName),
    venueAddress: clean(s.venueAddress),
    mapUrl: safeHttpUrl(s.mapUrl),
    events: (s.events ?? []).filter((e) => e?.name && parseDate(e.date)),
    yearsTogether: typeof s.yearsTogether === "number" ? s.yearsTogether : null,
    invitationMessage: clean(details.invitationMessage),
    rsvpContactName: clean(details.rsvpContactName),
    rsvpPhone: clean(details.rsvpPhone),
    rsvpEmail: clean(details.rsvpEmail),
    rsvpByDate: clean(details.rsvpByDate),
    dressCode: clean(details.dressCode),
    additionalNotes: clean(details.additionalNotes),
    language: clean(details.language) ?? "en",
  };
}

export const DEMO_WEDDING: WeddingCardView = {
  category: "wedding",
  brideName: "Rachael Nichols",
  groomName: "Matthew Devies",
  coupleHashtag: "#RachaelAndMatthew",
  brideParents: "Mr. & Mrs. David Nichols",
  groomParents: "Mr. & Mrs. James Devies",
  hostLine: null,
  eventDate: "2027-02-13T17:00:00-08:00",
  timezone: "America/Los_Angeles",
  venueName: "Leach Botanical Gardens",
  venueAddress: "64586 Woodland Avenue, Portland, Oregon",
  mapUrl: "https://maps.google.com/?q=Leach+Botanical+Garden+Portland",
  events: [
    {
      name: "Cocktail, Dinner and Dancing",
      date: "2027-02-13T18:00:00-08:00",
      startTime: null,
      venueName: "The Garden Pavilion",
      venueAddress: null,
    },
  ],
  yearsTogether: null,
  invitationMessage:
    "Two families, one garden, and a day we want to share with the people who shaped us. Your presence is the best gift we could ask for.",
  rsvpContactName: "Olivia Nichols",
  rsvpPhone: "+1 503 555 0142",
  rsvpEmail: "rsvp@rachaelandmatthew.com",
  rsvpByDate: "2027-01-20T12:00:00-08:00",
  dressCode: "Black tie optional",
  additionalNotes: "The ceremony is outdoors on garden paths, so flat shoes are a good idea.",
  language: "en",
};