import { RootApiService } from "./root";

export type ApiResponse<T> = {
  status: boolean;
  message: string;
  data: T;
};

export type RegisterPayload = {
  full_name: string;
  email: string;
  password: string;
  avatar?: string;
  phone?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponseData = {
  token: string;
  name: string;
  email: string;
  last_login?: string | null;
};

export const authService = RootApiService.injectEndpoints({
  endpoints: (build) => ({
    register: build.mutation<ApiResponse<string>, RegisterPayload>({
      query: (body) => ({
        url: "/auth/register",
        method: "POST",
        body,
      }),
    }),

    verifyEmail: build.query<ApiResponse<string>, string>({
      query: (token) => ({
        url: `/auth/verify-email/${token}`,
        method: "GET",
      }),
    }),

    login: build.mutation<ApiResponse<LoginResponseData>, LoginPayload>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
    }),

    resendVerification: build.mutation<ApiResponse<string>, { email: string }>({
      query: ({ email }) => ({
        url: `/auth/resend-verification?email=${encodeURIComponent(email)}`,
        method: "POST",
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useRegisterMutation,
  useLazyVerifyEmailQuery,
  useLoginMutation,
  useResendVerificationMutation,
} = authService;
