import { RootApiService } from "./root";
import type { ApiResponse } from "./authService";

export type CardPdfResponse = {
  downloadPath: string;
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