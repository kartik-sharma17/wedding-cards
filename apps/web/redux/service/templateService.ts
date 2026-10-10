import { RootApiService } from "./root";
import type { ApiResponse } from "./authService";

export type TemplateCategory = "wedding" | "reception" | "anniversary" | "engagement" | "birthday" | "baby_shower";

/** Mirrors `TemplateSummary` in templateSchema.py */
export type TemplateSummary = {
  id: string;
  templateName: string;
  slug: string;
  category: TemplateCategory;
  templateType: "card" | "video";
  current_version: number;
  price: number;
  currency: string;
  is_free: boolean;
  thumbnail_url: string | null;
  preview_images: string[];
};

/** Mirrors `TemplateDetail` in templateSchema.py */
export type TemplateDetail = TemplateSummary & {
  max_photos: number;
  requires_video: boolean;
  supportedFields: string[];
  manifest: Record<string, unknown>;
};

export type TemplateList = { items: TemplateSummary[]; page: number; limit: number; total: number };
export type TemplateListParams = { category?: TemplateCategory; page?: number; limit?: number };

export const templateService = RootApiService.injectEndpoints({
  endpoints: (build) => ({
    // GET /templates?category=&page=&limit=
    getTemplates: build.query<ApiResponse<TemplateList>, TemplateListParams | void>({
      query: (args) => {
        const { category, page = 1, limit = 12 } = args ?? {};
        return { url: "/templates", method: "GET", params: { page, limit, ...(category && { category }) } };
      },
      providesTags: ["Template"],
    }),

    // GET /templates/{slug}
    getTemplateBySlug: build.query<ApiResponse<TemplateDetail>, string>({
      query: (slug) => ({ url: `/templates/${encodeURIComponent(slug)}`, method: "GET" }),
      providesTags: ["Template"],
    }),
  }),
  overrideExisting: false,
});

export const { useGetTemplatesQuery, useGetTemplateBySlugQuery } = templateService;

// ---------- small shared helpers ----------
export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  wedding: "Wedding",
  reception: "Reception",
  anniversary: "Anniversary",
  engagement: "Engagement",
  birthday: "Birthday",
  baby_shower: "Baby shower",
};

export const isFreeTemplate = (t: Pick<TemplateSummary, "price" | "is_free">) => t.is_free || t.price <= 0;

export const formatPrice = (t: Pick<TemplateSummary, "price" | "is_free" | "currency">) =>
  isFreeTemplate(t)
    ? "Free"
    : new Intl.NumberFormat("en-IN", { style: "currency", currency: t.currency || "INR", maximumFractionDigits: 0 }).format(t.price);

/** Thumbnail first, then previews, no duplicates. */
export const getTemplateImages = (t: Pick<TemplateSummary, "thumbnail_url" | "preview_images">) =>
  Array.from(new Set([t.thumbnail_url, ...t.preview_images].filter((u): u is string => Boolean(u))));
