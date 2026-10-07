import { RootApiService } from "./root";
import type { ApiResponse } from "./authService";

export type TemplateCategory =
  | "wedding"
  | "reception"
  | "anniversary"
  | "engagement"
  | "birthday"
  | "baby_shower";

export type TemplateType = "card" | "video";

/** Mirrors `TemplateSummary` in templateSchema.py */
export type TemplateSummary = {
  id: string;
  templateName: string;
  slug: string;
  category: TemplateCategory;
  templateType: TemplateType;
  current_version: number;
  price: number;
  currency: string;
  is_free: boolean;
  thumbnail_url: string | null;
  preview_images: string[];
};

export type TemplateList = {
  items: TemplateSummary[];
  page: number;
  limit: number;
  total: number;
};

export type TemplateListParams = {
  category?: TemplateCategory;
  page?: number;
  limit?: number;
};

export const templateService = RootApiService.injectEndpoints({
  endpoints: (build) => ({
    getTemplates: build.query<ApiResponse<TemplateList>, TemplateListParams | void>({
      query: (args) => {
        const { category, page = 1, limit = 12 } = args ?? {};
        return {
          url: "/templates",
          method: "GET",
          params: { page, limit, ...(category && { category }) },
        };
      },
    }),
  }),
  overrideExisting: false,
});

export const { useGetTemplatesQuery } = templateService;
