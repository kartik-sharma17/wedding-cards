import type { TemplateCategory, TemplateSummary } from "@/services/templateService";
import type { WeddingCategory } from "@/services/cardService";

export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  wedding: "Wedding",
  reception: "Reception",
  anniversary: "Anniversary",
  engagement: "Engagement",
  birthday: "Birthday",
  baby_shower: "Baby shower",
};

export const CATEGORY_OPTIONS = (Object.keys(CATEGORY_LABELS) as TemplateCategory[]).map((value) => ({
  value,
  label: CATEGORY_LABELS[value],
}));

/** What the person fills in, shown on the template page so they know what to expect. */
export const CATEGORY_FIELDS: Record<TemplateCategory, string[]> = {
  wedding: ["Bride & groom names", "Both families", "Date & time", "Venue & other functions", "RSVP contact"],
  reception: ["Couple's names", "Both families", "Date & time", "Venue", "RSVP contact"],
  engagement: ["Couple's names", "Both families", "Date & time", "Venue", "RSVP contact"],
  anniversary: ["Both names", "Years together", "Date & time", "Venue", "RSVP contact"],
  birthday: ["Celebrant's name & age", "Theme", "Date & time", "Venue", "RSVP contact"],
  baby_shower: ["Parents-to-be", "Theme", "Date & time", "Venue", "RSVP contact"],
};

const WEDDING_STYLE: readonly TemplateCategory[] = ["wedding", "reception", "anniversary", "engagement"];

export const isWeddingStyle = (category: TemplateCategory): category is WeddingCategory =>
  WEDDING_STYLE.includes(category);

export const isFreeTemplate = (t: Pick<TemplateSummary, "price" | "is_free">) => t.is_free || t.price <= 0;

export function formatPrice(t: Pick<TemplateSummary, "price" | "is_free" | "currency">): string {
  if (isFreeTemplate(t)) return "Free";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: t.currency || "INR",
    maximumFractionDigits: 0,
  }).format(t.price);
}

/** Thumbnail first, then previews, without duplicates. */
export function getTemplateImages(t: Pick<TemplateSummary, "thumbnail_url" | "preview_images">): string[] {
  const all = [t.thumbnail_url, ...t.preview_images].filter((u): u is string => Boolean(u));
  return Array.from(new Set(all));
}
