"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ExternalLink, Pencil, Plus, Power, Search, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import {
  buildTemplateFormData,
  useAdminDeleteTemplateMutation,
  useAdminGetTemplatesQuery,
  useAdminUpdateTemplateMutation,
  type AdminTemplate,
} from "@/redux/service/adminTemplateService";
import { CATEGORY_LABELS, formatPrice, type TemplateCategory } from "@/redux/service/templateService";
import { getApiErrorMessage } from "@/lib/auth";

const PAGE_SIZE = 10;
const CATEGORIES = Object.keys(CATEGORY_LABELS) as TemplateCategory[];

const filterControl = "border border-input bg-white px-4 py-3 text-sm text-brand-deep outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/30";
const iconBtn = "rounded p-2 text-brand-deep/60 transition-colors hover:bg-brand-cream hover:text-brand-deep disabled:pointer-events-none disabled:opacity-40";

function useDebounced<T>(value: T, ms = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

export default function AdminTemplatesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<TemplateCategory | "">("");
  const [status, setStatus] = useState<"active" | "inactive" | "">("");
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<AdminTemplate | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const debouncedSearch = useDebounced(search.trim());
  useEffect(() => setPage(1), [debouncedSearch, category, status]);

  const { data, isLoading, isFetching, isError, refetch } = useAdminGetTemplatesQuery({
    search: debouncedSearch || undefined,
    category: category || undefined,
    status: status || undefined,
    page,
    limit: PAGE_SIZE,
  });
  const [updateTemplate] = useAdminUpdateTemplateMutation();
  const [deleteTemplate, { isLoading: deleting }] = useAdminDeleteTemplateMutation();

  const items = data?.data.items ?? [];
  const total = data?.data.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filtered = Boolean(debouncedSearch || category || status);

  // Clear the notice after a few seconds.
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(id);
  }, [notice]);

  const toggleActive = async (t: AdminTemplate) => {
    setTogglingId(t.id);
    try {
      await updateTemplate({ id: t.id, body: buildTemplateFormData({ is_active: !t.is_active }) }).unwrap();
      setNotice({ kind: "success", text: `${t.templateName} is now ${t.is_active ? "inactive" : "active"}.` });
    } catch (err) {
      setNotice({ kind: "error", text: getApiErrorMessage(err, "We couldn't update this template.") });
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      const res = await deleteTemplate(toDelete.id).unwrap();
      setNotice({ kind: "success", text: res.message });
      if (items.length === 1 && page > 1) setPage(page - 1); // don't strand the user on an empty page
    } catch (err) {
      setNotice({ kind: "error", text: getApiErrorMessage(err, "We couldn't delete this template.") });
    } finally {
      setToDelete(null);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl text-brand-deep">Templates</h1>
          <p className="mt-1 text-sm text-muted-foreground">{isLoading ? "Loading…" : `${total} ${total === 1 ? "template" : "templates"}${filtered ? " found" : ""}`}</p>
        </div>
        <Link href="/admin/templates/new" className="inline-flex items-center gap-2 bg-brand-deep px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-teal">
          <Plus className="size-4" /> New template
        </Link>
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
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or slug" aria-label="Search templates" className={`${filterControl} w-full pl-11`} />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value as TemplateCategory | "")} aria-label="Filter by category" className={filterControl}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
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
                <div className="h-16 w-12 bg-brand-cream" />
                <div className="h-4 w-48 bg-brand-cream" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <h2 className="font-serif text-3xl text-brand-deep">We couldn&apos;t load the templates</h2>
            <p className="text-muted-foreground">Check your connection and try again.</p>
            <button type="button" onClick={() => refetch()} className="bg-brand-deep px-6 py-3 text-sm text-white hover:bg-brand-teal">
              Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <h2 className="font-serif text-3xl text-brand-deep">{filtered ? "No templates match" : "No templates yet"}</h2>
            <p className="text-muted-foreground">{filtered ? "Try a different search or clear the filters." : "Create your first template to get started."}</p>
            {filtered ? (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategory("");
                  setStatus("");
                }}
                className="border border-brand-deep px-6 py-3 text-sm text-brand-deep hover:bg-brand-deep hover:text-white"
              >
                Clear filters
              </button>
            ) : (
              <Link href="/admin/templates/new" className="bg-brand-deep px-6 py-3 text-sm text-white hover:bg-brand-teal">
                New template
              </Link>
            )}
          </div>
        ) : (
          <table className={`w-full min-w-[820px] text-left text-sm transition-opacity ${isFetching ? "opacity-60" : ""}`}>
            <thead className="border-b border-border bg-brand-cream/60 text-xs tracking-wide text-brand-deep/60 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Template</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-16 w-12 shrink-0 overflow-hidden bg-brand-cream">
                        {t.thumbnail_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={t.thumbnail_url} alt="" className="size-full object-cover" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-brand-deep">{t.templateName}</p>
                        <p className="font-mono text-xs text-muted-foreground">{t.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-brand-deep/80">{CATEGORY_LABELS[t.category]}</td>
                  <td className="px-4 py-3 text-brand-deep/80 capitalize">{t.templateType}</td>
                  <td className="px-4 py-3 text-brand-deep/80">{formatPrice(t)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 text-xs ${t.is_active ? "bg-brand-teal/10 text-brand-teal" : "bg-brand-deep/10 text-brand-deep/60"}`}>{t.is_active ? "Active" : "Inactive"}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-brand-deep/70">{t.updateAt ? new Date(t.updateAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/templates/${t.slug}`} target="_blank" aria-label={`View ${t.templateName} on the site`} title="View on site" className={iconBtn}>
                        <ExternalLink className="size-4" />
                      </Link>
                      <Link href={`/admin/templates/${t.id}/edit`} aria-label={`Edit ${t.templateName}`} title="Edit" className={iconBtn}>
                        <Pencil className="size-4" />
                      </Link>
                      <button type="button" onClick={() => toggleActive(t)} disabled={togglingId === t.id} aria-label={t.is_active ? `Deactivate ${t.templateName}` : `Activate ${t.templateName}`} title={t.is_active ? "Deactivate" : "Activate"} className={iconBtn}>
                        <Power className={`size-4 ${t.is_active ? "text-brand-teal" : ""}`} />
                      </button>
                      <button type="button" onClick={() => setToDelete(t)} aria-label={`Delete ${t.templateName}`} title="Delete" className={`${iconBtn} hover:!text-destructive`}>
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this template?"
        message={`${toDelete?.templateName ?? "This template"} will be removed. If customers have already made cards with it, it is deactivated instead so their cards keep working.`}
        confirmLabel="Delete"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
