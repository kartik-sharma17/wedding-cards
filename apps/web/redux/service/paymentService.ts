import { RootApiService } from "./root";
import type { ApiResponse } from "./authService";

export type PaymentQuoteRequest = { cardId: string; couponCode?: string };
/** All amounts are in paise (divide by 100 for rupees). */
export type PaymentQuote = {
  currency: string;
  originalAmount: number;
  discountAmount: number;
  amount: number;
  couponCode: string | null;
  isFree: boolean;
};

export type CreateOrderRequest = { cardId: string; couponCode?: string };
export type CreateOrderResponse = {
  free: boolean; // true when nothing needs to be paid and the card was unlocked directly
  amount: number; // paise
  currency: string;
  orderId?: string;
  keyId?: string; // Razorpay public key, sent by the backend
};

export type VerifyPaymentRequest = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};
export type VerifyPaymentResponse = { cardId: string; isPaid: boolean };

export const paymentService = RootApiService.injectEndpoints({
  endpoints: (build) => ({
    // GET /payments/quote?cardId=&couponCode=
    getPaymentQuote: build.query<ApiResponse<PaymentQuote>, PaymentQuoteRequest>({
      query: ({ cardId, couponCode }) => ({
        url: "/payments/quote",
        method: "GET",
        params: { cardId, ...(couponCode && { couponCode }) },
      }),
      keepUnusedDataFor: 30,
    }),

    // POST /payments/create-order
    createPaymentOrder: build.mutation<ApiResponse<CreateOrderResponse>, CreateOrderRequest>({
      query: (body) => ({ url: "/payments/create-order", method: "POST", body }),
      // a free unlock changes the card right away, so refetch it
      invalidatesTags: (result) => (result?.data?.free ? (["Card"] as const) : []),
    }),

    // POST /payments/verify  (refetches the card so isPaid flips to true everywhere)
    verifyPayment: build.mutation<ApiResponse<VerifyPaymentResponse>, VerifyPaymentRequest>({
      query: (body) => ({ url: "/payments/verify", method: "POST", body }),
      invalidatesTags: ["Card"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPaymentQuoteQuery,
  useLazyGetPaymentQuoteQuery,
  useCreatePaymentOrderMutation,
  useVerifyPaymentMutation,
} = paymentService;