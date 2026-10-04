import { RootApiService } from "./root";

/** Generic API envelope used across services (assumes backend `response()` returns { status, message, data }). */
export type ApiResponse<T = unknown> = {
  status: boolean;
  message: string;
  data: T;
};

export type LoginRequest = { email: string; password: string };

export type RegisterRequest = {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
  avatar?: string;
};

export type AuthData = {
  token: string;
  name: string;
  email: string;
  last_login: string | null;
};

export const authService = RootApiService.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<ApiResponse<AuthData>, LoginRequest>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
    }),

    // Sends a verification email – no token is returned until the email is verified.
    register: build.mutation<ApiResponse<null>, RegisterRequest>({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
    }),

    // Backend declares `email: str` as a plain parameter, so FastAPI expects it as a query param.
    resendVerification: build.mutation<ApiResponse<null>, string>({
      query: (email) => ({
        url: "/auth/resend-verification",
        method: "POST",
        params: { email },
      }),
    }),

    // For the future /verify-email/[token] page.
    verifyEmail: build.query<ApiResponse<AuthData>, string>({
      query: (token) => ({ url: `/auth/verify-email/${token}`, method: "GET" }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useResendVerificationMutation,
  useVerifyEmailQuery,
} = authService;
