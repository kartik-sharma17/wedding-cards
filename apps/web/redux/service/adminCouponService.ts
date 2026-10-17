import { RootApiService } from "./root";
import type { ApiResponse } from "./authService";

export type DiscountType = "percent" | "flat";
export type CouponState = "active" | "inactive" | "expired" | "exhausted";

/** Mirrors the dict returned by AdminCouponService._serialize */
export type AdminCoupon = {
  id: string;
  code: string;
  discountType: DiscountType;
  value: number;
  maxDiscount: number | null; 
  isActive: boolean;
  expiresAt: string | null; 
  maxRedemptions: number | null;
  redeemedCount: number;
  state: CouponState;
  createAt?: string | null;
  updateAt?: string | null;
};

export type CouponInput = {
  discountType: DiscountType;
  value: number;
  maxDiscount: number | null;
  expiresAt: string | null;
  maxRedemptions: number | null;
  isActive: boolean;
};
export type CreateCouponBody = CouponInput & { code: string };
export type UpdateCouponBody = Partial<CouponInput>;

export type CouponList = { items: AdminCoupon[]; page: number; limit: number; total: number };
export type CouponListParams = {
  search?: string;
  status?: "active" | "inactive";
  page?: number;
  limit?: number;
};

export const adminCouponService = RootApiService.injectEndpoints({
  endpoints: (build) => ({
    // GET /admin/coupons?search=&status=&page=&limit=
    adminGetCoupons: build.query<ApiResponse<CouponList>, CouponListParams | void>({
      query: (args) => {
        const { search, status, page = 1, limit = 10 } = args ?? {};
        return {
          url: "/admin/coupons",
          method: "GET",
          params: { page, limit, ...(search && { search }), ...(status && { status }) },
        };
      },
      providesTags: ["Coupon"],
    }),

    // POST /admin/coupons
    adminCreateCoupon: build.mutation<ApiResponse<AdminCoupon>, CreateCouponBody>({
      query: (body) => ({ url: "/admin/coupons", method: "POST", body }),
      invalidatesTags: ["Coupon"],
    }),

    // PATCH /admin/coupons/{id}
    adminUpdateCoupon: build.mutation<ApiResponse<AdminCoupon>, { id: string; body: UpdateCouponBody }>({
      query: ({ id, body }) => ({ url: `/admin/coupons/${encodeURIComponent(id)}`, method: "PATCH", body }),
      invalidatesTags: ["Coupon"],
    }),

    // DELETE /admin/coupons/{id}  (a coupon that was already used is deactivated instead)
    adminDeleteCoupon: build.mutation<ApiResponse<{ deactivated: boolean }>, string>({
      query: (id) => ({ url: `/admin/coupons/${encodeURIComponent(id)}`, method: "DELETE" }),
      invalidatesTags: ["Coupon"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useAdminGetCouponsQuery,
  useAdminCreateCouponMutation,
  useAdminUpdateCouponMutation,
  useAdminDeleteCouponMutation,
} = adminCouponService;

// ---------- small shared helpers ----------
export const rupees = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);

export const describeDiscount = (c: Pick<AdminCoupon, "discountType" | "value" | "maxDiscount">) =>
  c.discountType === "percent"
    ? `${c.value}% off${c.maxDiscount ? `, up to ${rupees(c.maxDiscount)}` : ""}`
    : `${rupees(c.value)} off`;