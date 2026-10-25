import type { TemplateCategory } from "@/redux/service/templateService";

export const STEP_LABELS = ["Event", "Organiser", "Venue"] as const;

type CategoryCopy = {
  nameOneLabel: string;
  nameOnePlaceholder: string;
  nameTwoLabel?: string;
  nameTwoPlaceholder?: string;
  dateLabel: string;
};

export const CATEGORY_COPY: Record<TemplateCategory, CategoryCopy> = {
  wedding: {
    nameOneLabel: "Bride's name",
    nameOnePlaceholder: "Ananya",
    nameTwoLabel: "Groom's name",
    nameTwoPlaceholder: "Rohan",
    dateLabel: "Wedding date and time",
  },
  reception: {
    nameOneLabel: "Bride's name",
    nameOnePlaceholder: "Ananya",
    nameTwoLabel: "Groom's name",
    nameTwoPlaceholder: "Rohan",
    dateLabel: "Reception date and time",
  },
  engagement: {
    nameOneLabel: "Bride's name",
    nameOnePlaceholder: "Ananya",
    nameTwoLabel: "Groom's name",
    nameTwoPlaceholder: "Rohan",
    dateLabel: "Engagement date and time",
  },
  anniversary: {
    nameOneLabel: "First partner's name",
    nameOnePlaceholder: "Meera",
    nameTwoLabel: "Second partner's name",
    nameTwoPlaceholder: "Arjun",
    dateLabel: "Celebration date and time",
  },
  birthday: {
    nameOneLabel: "Celebrant's name",
    nameOnePlaceholder: "Aarav",
    dateLabel: "Party date and time",
  },
  baby_shower: {
    nameOneLabel: "Parents-to-be",
    nameOnePlaceholder: "Priya & Karan",
    dateLabel: "Baby shower date and time",
  },
};

const toOptions = (labels: string[]) => labels.map((l) => ({ value: l, label: l }));

export const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "gu", label: "Gujarati" },
  { value: "mr", label: "Marathi" },
  { value: "bn", label: "Bengali" },
  { value: "ta", label: "Tamil" },
];

export const DRESS_CODE_OPTIONS = toOptions([
  "Traditional",
  "Indian festive",
  "Formal",
  "Semi-formal",
  "Cocktail",
  "Casual",
  "Theme-based",
]);

export const HOST_LINE_OPTIONS = toOptions([
  "Together with their families",
  "Request the honour of your presence",
  "Joyfully invite you to celebrate",
  "Invite you to share in their happiness",
]);

export const BIRTHDAY_THEMES = toOptions([
  "Superhero",
  "Princess",
  "Jungle safari",
  "Space",
  "Garden party",
  "Cartoon",
  "Under the sea",
  "Classic and elegant",
]);

export const BABY_SHOWER_THEMES = toOptions([
  "Boy",
  "Girl",
  "Gender reveal",
  "Gender neutral",
  "Floral",
  "Boho",
]);

export const FUNCTION_SUGGESTIONS = [
  "Mehendi",
  "Haldi",
  "Sangeet",
  "Tilak",
  "Baraat",
  "Ring ceremony",
  "Cocktail night",
  "Reception",
];

export const MAX_EXTRA_FUNCTIONS = 6;
