import { RootApiService } from "./root";
import type { ApiResponse } from "./authService";

/** What guests get from GET /public/cards/{publicSlug}. No owner info, no internal ids. */
export type PublicCardPayload = {
  templateSlug: string; // the template folder this card belongs to, e.g. "forest-forever"
  isPaid: boolean; // for hiding ads / watermark later
  details: Record<string, unknown>; // same shape as the owner's `details`, minus internal ids
};

export const publicCardService = RootApiService.injectEndpoints({
  endpoints: (build) => ({
    // GET /public/cards/{publicSlug}   (no login; also counts the visit)
    getPublicCard: build.query<ApiResponse<PublicCardPayload>, string>({
      query: (publicSlug) => ({ url: `/public/cards/${encodeURIComponent(publicSlug)}`, method: "GET" }),
      keepUnusedDataFor: 60,
    }),
  }),
  overrideExisting: false,
});

export const { useGetPublicCardQuery } = publicCardService;