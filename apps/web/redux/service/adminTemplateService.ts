import { RootApiService } from "./root";
import type { ApiResponse } from "./authService";
import type { TemplateCategory, TemplateDetail } from "./templateService";

export type AdminTemplate = TemplateDetail & {
  is_active: boolean;
  createAt: string | null;
  updateAt: string | null;
};

export type AdminTemplateList = { items: AdminTemplate[]; page: number; limit: number; total: number };

export type AdminListParams = {
  search?: string;
  category?: TemplateCategory;
  status?: "active" | "inactive";
  page?: number;
  limit?: number;
};

/** The JSON half of the multipart body. Mirrors Create/UpdateTemplateSchema. */
export type TemplateFormData = {
  templateName: string;
  slug: string;
  category: TemplateCategory;
  templateType: "card" | "video";
  price: number;
  currency: string;
  is_free: boolean;
  max_photos: number;
  requires_video: boolean;
  is_active: boolean;
  supportedFields: string[];
  manifest: Record<string, unknown>;
  /** Update only: preview URLs to keep. */
  existingPreviewImages?: string[];
};

/** Builds the multipart body the admin endpoints expect: `data` (JSON) plus the image files. */
export function buildTemplateFormData(data: Partial<TemplateFormData>, thumbnail?: File | null, previews: File[] = []) {
  const body = new FormData();
  body.append("data", JSON.stringify(data));
  if (thumbnail) body.append("thumbnail", thumbnail);
  previews.forEach((file) => body.append("previewImages", file));
  return body;
}

export const adminTemplateService = RootApiService.injectEndpoints({
  endpoints: (build) => ({
    adminGetTemplates: build.query<ApiResponse<AdminTemplateList>, AdminListParams | void>({
      query: (args) => {
        const { search, category, status, page = 1, limit = 10 } = args ?? {};
        return {
          url: "/admin/templates",
          method: "GET",
          params: { page, limit, ...(search && { search }), ...(category && { category }), ...(status && { status }) },
        };
      },
      providesTags: ["Template"],
    }),

    adminGetTemplate: build.query<ApiResponse<AdminTemplate>, string>({
      query: (id) => ({ url: `/admin/templates/${id}`, method: "GET" }),
      providesTags: ["Template"],
    }),

    adminCreateTemplate: build.mutation<ApiResponse<AdminTemplate>, FormData>({
      query: (body) => ({ url: "/admin/templates", method: "POST", body }),
      invalidatesTags: ["Template"],
    }),

    adminUpdateTemplate: build.mutation<ApiResponse<AdminTemplate>, { id: string; body: FormData }>({
      query: ({ id, body }) => ({ url: `/admin/templates/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Template"],
    }),

    adminDeleteTemplate: build.mutation<ApiResponse<{ deleted: boolean; deactivated: boolean }>, string>({
      query: (id) => ({ url: `/admin/templates/${id}`, method: "DELETE" }),
      invalidatesTags: ["Template"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useAdminGetTemplatesQuery,
  useAdminGetTemplateQuery,
  useAdminCreateTemplateMutation,
  useAdminUpdateTemplateMutation,
  useAdminDeleteTemplateMutation,
} = adminTemplateService;
