import { RootApiService } from "./root";
import type { ApiResponse } from "./authService";
import type { TemplateCategory } from "./templateService";

/** Mirrors the card items built in dashboardService.py */
export type DashboardCard = {
  id: string;
  title: string;
  category: TemplateCategory | null;
  status: "draft" | "published";
  isPaid: boolean;
  viewCount: number;
  rsvpCount: number;
  publicSlug: string | null;
  templateName: string | null;
  templateSlug: string | null;
  thumbnailUrl: string | null;
  eventDate: string | null;
  createdAt: string | null;
};

export type DashboardPayment = {
  id: string;
  cardId: string;
  cardTitle: string;
  amount: number;
  currency: string;
  status: "created" | "paid" | "failed" | "refunded";
  provider: string;
  paidAt: string | null;
};

export type DashboardData = {
  user: { name: string; email: string; avatar: string | null };
  stats: {
    totalCards: number;
    draftCards: number;
    publishedCards: number;
    paidCards: number;
    totalViews: number;
    totalRsvps: number;
    upcomingEvents: number;
  };
  cardsByCategory: { category: TemplateCategory; count: number }[];
  nextEvent: { cardId: string; templateSlug: string | null; title: string; eventDate: string | null } | null;
  recentCards: DashboardCard[];
  payments: {
    /** true while payments are sample data */
    isDemo: boolean;
    currency: string;
    totalSpent: number;
    totalPayments: number;
    recent: DashboardPayment[];
  };
};

export const dashboardService = RootApiService.injectEndpoints({
  endpoints: (build) => ({
    // GET /dashboard (needs the bearer token, which root.ts already attaches)
    getDashboard: build.query<ApiResponse<DashboardData>, void>({
      query: () => ({ url: "/dashboard", method: "GET" }),
    }),
  }),
  overrideExisting: false,
});

export const { useGetDashboardQuery } = dashboardService;