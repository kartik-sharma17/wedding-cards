"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Plus, Power, Search, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import CouponFormDialog from "@/components/admin/CouponFormDialog";
import {
  describeDiscount,
  useAdminDeleteCouponMutation,
  useAdminGetCouponsQuery,
  useAdminUpdateCouponMutation,
  type AdminCoupon,
  type CouponState,
} from "@/redux/service/adminCouponService";
import { getApiErrorMessage } from "@/lib/auth";

const PAGE_SIZE = 10;

const filterControl = "border border-input bg-white px-4 py-3 text-sm text-brand-deep outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/30";
const iconBtn = "rounded p-2 text-brand-deep/60 transition-colors hover:bg-brand-cream hover:text-brand-deep disabled:pointer-events-none disabled:opacity-40";

const STATE_BADGE: Record<CouponState, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-brand-teal/10 text-brand-teal" },
  inactive: { label: "Inactive", className: "bg-brand-deep/10 text-brand-deep/60" },
  expired: { label: "Expired", className: "bg-destructive/10 text-destructive" },
  exhausted: { label: "Used up", className: "bg-brand-gold/25 text-brand-deep" },
};

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Never";

function useDebounced<T>(value: T, ms = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

export default function AdminCouponsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"active" | "inactive" | "">("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<{ coupon: AdminCoupon | null } | null>(null); // null = closed
  const [toDelete, setToDelete] = useState<AdminCoupon | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const debouncedSearch = useDebounced(search.trim());
  useEffect(() => setPage(1), [debouncedSearch, status]);

  const { data, isLoading, isFetching, isError, refetch } = useAdminGetCouponsQuery({
    search: debouncedSearch || undefined,
    status: status || undefined,
    page,
    limit: PAGE_SIZE,
  });
  const [updateCoupon] = useAdminUpdateCouponMutation();
  const [deleteCoupon, { isLoading: deleting }] = useAdminDeleteCouponMutation();

  const items = data?.data.items ?? [];
  const total = data?.data.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filtered = Boolean(debouncedSearch || status);

  // Clear the notice after a few seconds.
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(id);
  }, [notice]);

  const toggleActive = async (c: AdminCoupon) => {
    setTogglingId(c.id);
    try {
      await updateCoupon({ id: c.id, body: { isActive: !c.isActive } }).unwrap();
      setNotice({ kind: "success", text: `${c.code} is now ${c.isActive ? "inactive" : "active"}.` });
    } catch (err) {
      setNotice({ kind: "error", text: getApiErrorMessage(err, "We couldn't update this coupon.") });
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      const res = await deleteCoupon(toDelete.id).unwrap();
      setNotice({ kind: "success", text: res.message });
      if (items.length === 1 && page > 1) setPage(page - 1); // don't strand the user on an empty page
    } catch (err) {
      setNotice({ kind: "error", text: getApiErrorMessage(err, "We couldn't delete this coupon.") });
    } finally {
      setToDelete(null);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl text-brand-deep">Coupons</h1>
          <p className="mt-1 text-sm text-muted-foreground">{isLoading ? "Loading…" : `${total} ${total === 1 ? "coupon" : "coupons"}${filtered ? " found" : ""}`}</p>
        </div>
        <button type="button" onClick={() => setForm({ coupon: null })} className="inline-flex items-center gap-2 bg-brand-deep px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-teal">
          <Plus className="size-4" /> New coupon
        </button>
      </div>

      {notice && (
        <p role={notice.kind === "error" ? "alert" : "status"} className={`mt-6 border px-4 py-3 text-sm ${notice.kind === "error" ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-brand-teal/30 bg-brand-teal/5 text-brand-teal"}`}>
          {notice.text}
        </p>
      )}

      {/* Filters */}
      <div className="mt-8 flex flex-wrap gap-3">
        <div className="relative min-w-60 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-brand-deep/40" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by code" aria-label="Search coupons" className={`${filterControl} w-full pl-11`} />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value as "active" | "inactive" | "")} aria-label="Filter by status" className={filterControl}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="mt-6 overflow-x-auto border border-border bg-white">
        {isLoading ? (
          <div className="animate-pulse divide-y divide-border" aria-busy>
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="h-4 w-28 bg-brand-cream" />
                <div className="h-4 w-48 bg-brand-cream" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <h2 className="font-serif text-3xl text-brand-deep">We couldn&apos;t load the coupons</h2>
            <p className="text-muted-foreground">Check your connection and try again.</p>
            <button type="button" onClick={() => refetch()} className="bg-brand-deep px-6 py-3 text-sm text-white hover:bg-brand-teal">
              Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <h2 className="font-serif text-3xl text-brand-deep">{filtered ? "No coupons match" : "No coupons yet"}</h2>
            <p className="text-muted-foreground">{filtered ? "Try a different search or clear the filters." : "Create your first coupon to offer a discount."}</p>
            {filtered ? (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatus("");
                }}
                className="border border-brand-deep px-6 py-3 text-sm text-brand-deep hover:bg-brand-deep hover:text-white"
              >
                Clear filters
              </button>
            ) : (
              <button type="button" onClick={() => setForm({ coupon: null })} className="bg-brand-deep px-6 py-3 text-sm text-white hover:bg-brand-teal">
                New coupon
              </button>
            )}
          </div>
        ) : (
          <table className={`w-full min-w-[820px] text-left text-sm transition-opacity ${isFetching ? "opacity-60" : ""}`}>
            <thead className="border-b border-border bg-brand-cream/60 text-xs tracking-wide text-brand-deep/60 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Discount</th>
                <th className="px-4 py-3 font-medium">Used</th>
                <th className="px-4 py-3 font-medium">Expires</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((c) => {
                const badge = STATE_BADGE[c.state];
                return (
                  <tr key={c.id}>
                    <td className="px-4 py-3 font-mono font-medium tracking-wider text-brand-deep">{c.code}</td>
                    <td className="px-4 py-3 text-brand-deep/80">{describeDiscount(c)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-brand-deep/80">
                      {c.redeemedCount}
                      {c.maxRedemptions != null ? ` / ${c.maxRedemptions}` : ""}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-brand-deep/80">{formatDate(c.expiresAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 text-xs ${badge.className}`}>{badge.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" onClick={() => setForm({ coupon: c })} aria-label={`Edit ${c.code}`} title="Edit" className={iconBtn}>
                          <Pencil className="size-4" />
                        </button>
                        <button type="button" onClick={() => toggleActive(c)} disabled={togglingId === c.id} aria-label={c.isActive ? `Deactivate ${c.code}` : `Activate ${c.code}`} title={c.isActive ? "Deactivate" : "Activate"} className={iconBtn}>
                          <Power className={`size-4 ${c.isActive ? "text-brand-teal" : ""}`} />
                        </button>
                        <button type="button" onClick={() => setToDelete(c)} aria-label={`Delete ${c.code}`} title="Delete" className={`${iconBtn} hover:!text-destructive`}>
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {!isLoading && !isError && totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button type="button" aria-label="Previous page" disabled={page === 1} onClick={() => setPage(page - 1)} className="flex size-10 items-center justify-center border border-border bg-white hover:border-brand-deep disabled:opacity-40">
              <ChevronLeft className="size-5" />
            </button>
            <button type="button" aria-label="Next page" disabled={page === totalPages} onClick={() => setPage(page + 1)} className="flex size-10 items-center justify-center border border-border bg-white hover:border-brand-deep disabled:opacity-40">
              <ChevronRight className="size-5" />
            </button>
          </div>
        </nav>
      )}

      {form && (
        <CouponFormDialog
          coupon={form.coupon}
          onClose={() => setForm(null)}
          onSaved={(text) => {
            setForm(null);
            setNotice({ kind: "success", text });
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this coupon?"
        message={`${toDelete?.code ?? "This coupon"} will be removed. If customers have already used it, it is deactivated instead so past payments keep their record.`}
        confirmLabel="Delete"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}