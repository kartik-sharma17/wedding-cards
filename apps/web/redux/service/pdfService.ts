import { RootApiService } from "./root";
import type { ApiResponse } from "./authService";

export type CardPdfResponse = {
  /** A short-lived (about 2 minutes) signed link straight to the PDF in storage. Open it to download. */
  downloadUrl: string;
};

export const pdfService = RootApiService.injectEndpoints({
  endpoints: (build) => ({
    createCardPdf: build.mutation<ApiResponse<CardPdfResponse>, string>({
      query: (cardId) => ({ url: `/pdf/cards/${encodeURIComponent(cardId)}`, method: "POST" }),
    }),
  }),
  overrideExisting: false,
});

export const { useCreateCardPdfMutation } = pdfService;