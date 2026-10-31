import type { CardDetailsPayload } from "@/redux/service/cardService";
import { HOST_LINE_OPTIONS } from "./config";
import { CUSTOM_HOST_LINE, INITIAL_VALUES, type CardFormValues } from "./types";

const str = (v: string | null | undefined) => v ?? "";
const num = (v: number | null | undefined) => (v == null ? "" : String(v));

/**
 * Turns a saved card back into form values. Dates are plain wall-clock ISO strings
 * ("2026-12-10T18:30:00"), so slicing gives exactly what the inputs expect.
 */
export function detailsToFormValues(d: CardDetailsPayload): CardFormValues {
  const s = d.specificDetails;

  const base: CardFormValues = {
    ...INITIAL_VALUES,
    eventDate: s.eventDate.slice(0, 16),
    venueName: str(s.venueName),
    venueAddress: str(s.venueAddress),
    mapEnabled: Boolean(s.mapUrl),
    mapUrl: str(s.mapUrl),
    language: d.language || "en",
    dressCode: str(d.dressCode),
    invitationMessage: str(d.invitationMessage),
    rsvpContactName: str(d.rsvpContactName),
    rsvpPhone: str(d.rsvpPhone),
    rsvpEmail: str(d.rsvpEmail),
    rsvpByDate: d.rsvpByDate ? d.rsvpByDate.slice(0, 10) : "",
    additionalNotes: str(d.additionalNotes),
  };

  if ("brideName" in s) {
    const hostLine = str(s.hostLine);
    const isPreset = HOST_LINE_OPTIONS.some((o) => o.value === hostLine);
    return {
      ...base,
      nameOne: s.brideName,
      nameTwo: s.groomName,
      coupleHashtag: str(s.coupleHashtag),
      brideParents: str(s.brideParents),
      groomParents: str(s.groomParents),
      yearsTogether: num(s.yearsTogether),
      hostLinePreset: !hostLine ? "" : isPreset ? hostLine : CUSTOM_HOST_LINE,
      hostLine: hostLine && !isPreset ? hostLine : "",
      events: s.events.map((e) => ({
        id: crypto.randomUUID(),
        name: e.name,
        date: e.date.slice(0, 10),
        startTime: str(e.startTime),
        venueName: str(e.venueName),
        venueAddress: str(e.venueAddress),
      })),
    };
  }

  return {
    ...base,
    nameOne: s.celebrantName,
    celebrantAge: num(s.celebrantAge),
    theme: str(s.theme),
    parentNames: str(s.parentNames),
  };
}
