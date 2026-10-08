import type { TemplateCategory } from "@/services/templateService";

export type EventRow = {
  id: string;
  name: string;
  date: string; // yyyy-mm-dd
  startTime: string; // HH:MM
  venueName: string;
  venueAddress: string;
};

export type CardFormValues = {
  // Step 1 – event
  nameOne: string; // bride / celebrant / first partner
  nameTwo: string; // groom / second partner (wedding-style only)
  eventDate: string; // yyyy-mm-ddTHH:mm
  yearsTogether: string;
  celebrantAge: string;
  theme: string;
  coupleHashtag: string;
  language: string;
  dressCode: string;
  invitationMessage: string;
  // Step 2 – organiser
  hostLinePreset: string; // "", a preset line, or CUSTOM_HOST_LINE
  hostLine: string; // used when preset is CUSTOM_HOST_LINE
  brideParents: string;
  groomParents: string;
  parentNames: string;
  rsvpContactName: string;
  rsvpPhone: string;
  rsvpEmail: string;
  rsvpByDate: string; // yyyy-mm-dd
  // Step 3 – venue
  venueName: string;
  venueAddress: string;
  mapEnabled: boolean;
  mapUrl: string;
  events: EventRow[];
  additionalNotes: string;
};

export type FormErrors = Record<string, string>;

export const CUSTOM_HOST_LINE = "__custom";

export const INITIAL_VALUES: CardFormValues = {
  nameOne: "",
  nameTwo: "",
  eventDate: "",
  yearsTogether: "",
  celebrantAge: "",
  theme: "",
  coupleHashtag: "",
  language: "en",
  dressCode: "",
  invitationMessage: "",
  hostLinePreset: "",
  hostLine: "",
  brideParents: "",
  groomParents: "",
  parentNames: "",
  rsvpContactName: "",
  rsvpPhone: "",
  rsvpEmail: "",
  rsvpByDate: "",
  venueName: "",
  venueAddress: "",
  mapEnabled: false,
  mapUrl: "",
  events: [],
  additionalNotes: "",
};

export type StepProps = {
  form: import("./useCreateCardForm").CreateCardForm;
  category: TemplateCategory;
};
