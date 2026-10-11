import { RootApiService } from "./root";
import type { ApiResponse } from "./authService";

export type CreateOrderRequest = { cardId: string };
export type CreateOrderResponse = {
  orderId: string;
  amount: number; // paise
  currency: string;
  keyId: string; // Razorpay public key, sent by the backend
};

export type VerifyPaymentRequest = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};
export type VerifyPaymentResponse = { cardId: string; isPaid: boolean };

export const paymentService = RootApiService.injectEndpoints({
  endpoints: (build) => ({
    // POST /payments/create-order
    createPaymentOrder: build.mutation<ApiResponse<CreateOrderResponse>, CreateOrderRequest>({
      query: (body) => ({ url: "/payments/create-order", method: "POST", body }),
    }),

    // POST /payments/verify  (refetches the card so isPaid flips to true everywhere)
    verifyPayment: build.mutation<ApiResponse<VerifyPaymentResponse>, VerifyPaymentRequest>({
      query: (body) => ({ url: "/payments/verify", method: "POST", body }),
      invalidatesTags: ["Card"],
    }),
  }),
  overrideExisting: false,
});

export const { useCreatePaymentOrderMutation, useVerifyPaymentMutation } = paymentService;