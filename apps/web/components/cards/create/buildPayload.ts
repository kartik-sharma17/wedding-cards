import type { TemplateSummary } from "@/redux/service/templateService";
import type { UpdateCardRequest } from "@/redux/service/cardService";
import type { CreateCardRequest, EventSchedule, SpecificDetails } from "./payloadTypes";
import { isWeddingStyle } from "@/lib/templates";
import { dateToNaiveIso, toNaiveIso } from "@/lib/dates";
import { CUSTOM_HOST_LINE, type CardFormValues } from "./types";

/** Empty strings become `undefined` so they are dropped from the JSON body. */
const clean = (value: string) => value.trim() || undefined;

/** Everything the form collects, shaped for the API. Shared by create and edit. */
function buildCardBody(category: TemplateSummary["category"], v: CardFormValues) {
  const venue = {
    venueName: clean(v.venueName),
    venueAddress: clean(v.venueAddress),
    mapUrl: v.mapEnabled ? clean(v.mapUrl) : undefined,
  };

  let specificDetails: SpecificDetails;

  if (isWeddingStyle(category)) {
    const events: EventSchedule[] = v.events
      .filter((row) => row.name.trim() && row.date)
      .map((row) => ({
        name: row.name.trim(),
        date: dateToNaiveIso(row.date),
        startTime: clean(row.startTime),
        venueName: clean(row.venueName),
        venueAddress: clean(row.venueAddress),
      }));

    specificDetails = {
      category,
      brideName: v.nameOne.trim(),
      groomName: v.nameTwo.trim(),
      coupleHashtag: clean(v.coupleHashtag),
      brideParents: clean(v.brideParents),
      groomParents: clean(v.groomParents),
      hostLine: clean(v.hostLinePreset === CUSTOM_HOST_LINE ? v.hostLine : v.hostLinePreset),
      eventDate: toNaiveIso(v.eventDate),
      ...venue,
      events: events.length ? events : undefined,
      yearsTogether: category === "anniversary" && v.yearsTogether ? Number(v.yearsTogether) : undefined,
    };
  } else {
    specificDetails = {
      category,
      celebrantName: v.nameOne.trim(),
      celebrantAge: category === "birthday" && v.celebrantAge ? Number(v.celebrantAge) : undefined,
      theme: clean(v.theme),
      parentNames: clean(v.parentNames),
      eventDate: toNaiveIso(v.eventDate),
      ...venue,
    };
  }

  return {
    specificDetails,
    invitationMessage: clean(v.invitationMessage),
    rsvpContactName: clean(v.rsvpContactName),
    rsvpPhone: clean(v.rsvpPhone),
    rsvpEmail: clean(v.rsvpEmail),
    rsvpByDate: v.rsvpByDate ? dateToNaiveIso(v.rsvpByDate, "23:59") : undefined,
    dressCode: clean(v.dressCode),
    additionalNotes: clean(v.additionalNotes),
    language: v.language || "en",
  };
}

export function buildCreateCardRequest(template: Pick<TemplateSummary, "id" | "category">, v: CardFormValues): CreateCardRequest {
  return {
    templateId: template.id,
    templateCategory: template.category,
    ...buildCardBody(template.category, v),
    customization: {},
  };
}

/**
 * For editing, a field the person emptied must be sent as null, otherwise the old
 * value would stay on the card. specificDetails is replaced as a whole.
 */
export function buildUpdateCardRequest(category: TemplateSummary["category"], v: CardFormValues): UpdateCardRequest {
  const b = buildCardBody(category, v);
  return {
    ...b,
    invitationMessage: b.invitationMessage ?? null,
    rsvpContactName: b.rsvpContactName ?? null,
    rsvpPhone: b.rsvpPhone ?? null,
    rsvpEmail: b.rsvpEmail ?? null,
    rsvpByDate: b.rsvpByDate ?? null,
    dressCode: b.dressCode ?? null,
    additionalNotes: b.additionalNotes ?? null,
  };
}
