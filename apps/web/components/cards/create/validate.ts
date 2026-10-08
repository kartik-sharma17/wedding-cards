import type { TemplateCategory } from "@/services/templateService";
import { isWeddingStyle } from "@/lib/templates";
import { isGoogleMapsUrl, isValidEmail, isValidPhone } from "@/lib/validators";
import { CATEGORY_COPY } from "./config";
import { CUSTOM_HOST_LINE, type CardFormValues, type FormErrors } from "./types";

const isWholeNumber = (v: string, min: number, max: number) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= min && n <= max;
};

export function validateStep(step: number, v: CardFormValues, category: TemplateCategory): FormErrors {
  const errors: FormErrors = {};
  const copy = CATEGORY_COPY[category];

  if (step === 0) {
    if (!v.nameOne.trim()) errors.nameOne = `Enter ${copy.nameOneLabel.toLowerCase()}.`;
    if (isWeddingStyle(category) && !v.nameTwo.trim()) {
      errors.nameTwo = `Enter ${(copy.nameTwoLabel ?? "the second name").toLowerCase()}.`;
    }

    if (!v.eventDate) errors.eventDate = "Choose a date and time.";
    else if (new Date(v.eventDate).getTime() <= Date.now()) errors.eventDate = "Choose a date in the future.";

    if (category === "anniversary" && v.yearsTogether && !isWholeNumber(v.yearsTogether, 1, 100)) {
      errors.yearsTogether = "Enter a whole number between 1 and 100.";
    }
    if (category === "birthday" && v.celebrantAge && !isWholeNumber(v.celebrantAge, 0, 120)) {
      errors.celebrantAge = "Enter a whole number between 0 and 120.";
    }
  }

  if (step === 1) {
    if (v.hostLinePreset === CUSTOM_HOST_LINE && !v.hostLine.trim()) {
      errors.hostLine = "Write your line, or choose one from the list.";
    }
    if (v.rsvpPhone.trim() && !isValidPhone(v.rsvpPhone)) errors.rsvpPhone = "Enter a valid phone number, digits only.";
    if (v.rsvpEmail.trim() && !isValidEmail(v.rsvpEmail)) errors.rsvpEmail = "Enter a valid email address.";
    if (v.rsvpByDate && v.eventDate && v.rsvpByDate > v.eventDate.slice(0, 10)) {
      errors.rsvpByDate = "Choose a date on or before the event.";
    }
  }

  if (step === 2) {
    if (v.mapEnabled && v.mapUrl.trim() && !isGoogleMapsUrl(v.mapUrl)) {
      errors.mapUrl = "Paste a Google Maps link, for example from the Share button in Google Maps.";
    }
    v.events.forEach((row, i) => {
      const hasContent = row.name || row.date || row.startTime || row.venueName || row.venueAddress;
      if (!hasContent) return;
      if (!row.name.trim()) errors[`events.${i}.name`] = "Name this function.";
      if (!row.date) errors[`events.${i}.date`] = "Choose a date.";
    });
  }

  return errors;
}
