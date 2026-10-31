"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Eye, Lock, Pencil, Trash2, Users } from "lucide-react";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import BrandButton from "@/components/ui/BrandButton";
import StatusMessage from "@/components/templates/StatusMessage"; // adjust if it lives elsewhere
import { getToken } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { CATEGORY_LABELS } from "@/redux/service/templateService";
import { useGetDashboardQuery, type DashboardCard, type DashboardPayment } from "@/redux/service/dashboardservice";
import { useDeleteCardMutation } from "@/redux/service/cardService";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import EditCardDialog from "@/components/cards/create/EditCardDialog";
import { getApiErrorMessage } from "@/lib/auth";

const money = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: currency || "INR", maximumFractionDigits: 0 }).format(amount);

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Date not set";

const cardHref = (c: { id: string; templateSlug: string | null }) =>
  c.templateSlug ? ROUTES.card(c.templateSlug, c.id) : ROUTES.templates;

const PAYMENT_LABELS: Record<DashboardPayment["status"], string> = {
  created: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="flex flex-col gap-2 bg-white p-6 lg:p-8">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-serif text-4xl leading-none text-brand-deep">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <h2 className="font-serif text-2xl text-brand-deep md:text-3xl">{children}</h2>
      {action}
    </div>
  );
}

function CardTile({ card, onEdit, onDelete }: { card: DashboardCard; onEdit: () => void; onDelete: () => void }) {
  const published = card.status === "published";
  const actionBtn = "inline-flex items-center gap-2 border px-4 py-2 text-sm transition-colors";
  return (
    <div className="flex flex-col gap-4">
      <Link href={cardHref(card)} className="group flex flex-col gap-4">
        <div className="relative aspect-[4/5] overflow-hidden bg-brand-cream">
          {card.thumbnailUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={card.thumbnailUrl}
              alt={card.templateName ?? card.title}
              className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          )}
          <span
            className={`absolute left-3 top-3 px-3 py-1 text-xs ${
              published ? "bg-brand-deep text-white" : "bg-white text-brand-deep"
            }`}
          >
            {published ? "Published" : "Draft"}
          </span>
        </div>
        <div>
          <h3 className="font-serif text-xl text-brand-deep">{card.title}</h3>
          <p className="text-sm text-muted-foreground">
            {card.templateName ?? "Template unavailable"}
            {card.eventDate && `, ${fmtDate(card.eventDate)}`}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Eye className="size-3.5" /> {card.viewCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5" /> {card.rsvpCount} RSVPs
          </span>
          <span className="ml-auto">{card.isPaid ? "Paid" : "Unpaid"}</span>
        </div>
      </Link>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onEdit}
          disabled={card.isPaid}
          title={card.isPaid ? "Editing is locked after payment" : "Edit card"}
          className={`${actionBtn} border-brand-deep text-brand-deep hover:bg-brand-deep hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-brand-deep`}
        >
          <Pencil className="size-4" /> Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          className={`${actionBtn} border-border text-brand-deep/70 hover:border-destructive hover:text-destructive`}
        >
          <Trash2 className="size-4" /> Delete
        </button>
      </div>

      {card.isPaid && (
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Lock className="mt-0.5 size-3.5 shrink-0" /> Editing is locked after payment. Please contact our support team for any changes.
        </p>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState<DashboardCard | null>(null);
  const [deleting, setDeleting] = useState<DashboardCard | null>(null);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [deleteCard, { isLoading: isDeleting }] = useDeleteCardMutation();

  // Dashboard is for signed-in users only.
  useEffect(() => {
    if (!getToken()) {
      router.replace(ROUTES.login(pathname));
      return;
    }
    setReady(true);
  }, [router, pathname]);

  const { data, isLoading, isError, error, refetch } = useGetDashboardQuery(undefined, {
    skip: !ready,
    refetchOnMountOrArgChange: true,
  });
  const dashboard = data?.data;

  // Expired or invalid token: send them back to log in.
  const status = (error as FetchBaseQueryError | undefined)?.status;
  useEffect(() => {
    if (isError && status === 401) router.replace(ROUTES.login(pathname));
  }, [isError, status, router, pathname]);

  // Clear the notice after a few seconds.
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(id);
  }, [notice]);

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteCard(deleting.id).unwrap();
      setNotice({ kind: "success", text: `"${deleting.title}" was deleted.` });
      void refetch();
    } catch (err) {
      setNotice({ kind: "error", text: getApiErrorMessage(err, "We couldn't delete this card. Please try again.") });
    } finally {
      setDeleting(null);
    }
  };

  const onEditSaved = () => {
    setEditing(null);
    setNotice({ kind: "success", text: "Your changes were saved." });
    void refetch();
  };

  if (!ready || isLoading) {
    return (
      <div className="bg-white pt-32 pb-24 md:pt-40" aria-busy>
        <div className="mx-auto max-w-7xl animate-pulse px-6 lg:px-10">
          <div className="mb-10 h-12 w-80 bg-brand-cream" />
          <div className="mb-16 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-brand-cream" />
            ))}
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] bg-brand-cream" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !dashboard) {
    return (
      <div className="bg-white pt-32">
        <StatusMessage title="We couldn't load your dashboard" text="Check your connection and try again.">
          <BrandButton onClick={() => refetch()}>Try again</BrandButton>
          <BrandButton href={ROUTES.templates} variant="outline">
            Browse templates
          </BrandButton>
        </StatusMessage>
      </div>
    );
  }

  const { user, stats, cardsByCategory, nextEvent, recentCards, payments } = dashboard;
  const firstName = user.name.split(" ")[0] || "there";
  const maxCategory = Math.max(1, ...cardsByCategory.map((c) => c.count));
  const daysToGo = nextEvent?.eventDate
    ? Math.max(0, Math.ceil((new Date(nextEvent.eventDate).getTime() - Date.now()) / 86_400_000))
    : null;

  return (
    <section className="bg-white pt-28 pb-24 md:pt-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        {/* Header */}
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="font-serif text-4xl text-brand-deep md:text-5xl">Welcome back, {firstName}</h1>
            <p className="mt-3 text-muted-foreground">Everything you've created and paid for, in one place.</p>
          </div>
          <BrandButton href={ROUTES.templates} variant="deep">
            Create a new card
          </BrandButton>
        </div>

        {notice && (
          <p
            role={notice.kind === "error" ? "alert" : "status"}
            className={`mb-8 border px-4 py-3 text-sm ${
              notice.kind === "error"
                ? "border-destructive/30 bg-destructive/5 text-destructive"
                : "border-brand-teal/30 bg-brand-teal/5 text-brand-teal"
            }`}
          >
            {notice.text}
          </p>
        )}

        {/* Key numbers */}
        <div className="mb-16 grid grid-cols-2 gap-px border border-border bg-border lg:grid-cols-4">
          <Stat
            label="Cards created"
            value={stats.totalCards}
            hint={`${stats.publishedCards} published, ${stats.draftCards} in draft`}
          />
          <Stat
            label="Total spent"
            value={money(payments.totalSpent, payments.currency)}
            hint={`${payments.totalPayments} successful ${payments.totalPayments === 1 ? "payment" : "payments"}`}
          />
          <Stat label="Card views" value={stats.totalViews} hint="Across all published cards" />
          <Stat label="RSVPs received" value={stats.totalRsvps} hint={`${stats.upcomingEvents} upcoming events`} />
        </div>

        {stats.totalCards === 0 ? (
          <div className="bg-brand-cream px-6 py-20 text-center">
            <h2 className="font-serif text-3xl text-brand-deep">Your first card starts with a design</h2>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              Pick a template, add your details and share a link with your guests.
            </p>
            <div className="mt-8 flex justify-center">
              <BrandButton href={ROUTES.templates} variant="deep">
                Browse templates
              </BrandButton>
            </div>
          </div>
        ) : (
          <>
            {/* Next event */}
            {nextEvent && (
              <div className="mb-16 flex flex-wrap items-center justify-between gap-6 bg-brand-cream p-6 lg:p-8">
                <div>
                  <p className="text-sm text-muted-foreground">Your next event</p>
                  <p className="mt-1 font-serif text-2xl text-brand-deep">{nextEvent.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {fmtDate(nextEvent.eventDate)}
                    {daysToGo !== null && `, ${daysToGo === 0 ? "today" : `in ${daysToGo} ${daysToGo === 1 ? "day" : "days"}`}`}
                  </p>
                </div>
                <BrandButton href={cardHref({ id: nextEvent.cardId, templateSlug: nextEvent.templateSlug })} variant="outline">
                  Open card
                </BrandButton>
              </div>
            )}

            {/* Recent cards */}
            <div className="mb-20">
              <SectionTitle>Your recent cards</SectionTitle>
              <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {recentCards.map((card) => (
                  <CardTile key={card.id} card={card} onEdit={() => setEditing(card)} onDelete={() => setDeleting(card)} />
                ))}
              </div>
            </div>

            <div className="grid gap-12 lg:grid-cols-3 lg:gap-16">
              {/* Payments */}
              <div className="lg:col-span-2">
                <SectionTitle>Payments</SectionTitle>
                {payments.recent.length === 0 ? (
                  <p className="border border-border p-6 text-muted-foreground">
                    No payments yet. They'll appear here after you download a paid card.
                  </p>
                ) : (
                  <>
                    <ul className="divide-y divide-border border border-border">
                      {payments.recent.map((p) => (
                        <li key={p.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                          <div>
                            <p className="font-serif text-lg text-brand-deep">{p.cardTitle}</p>
                            <p className="text-sm text-muted-foreground">
                              {fmtDate(p.paidAt)} via {p.provider}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-serif text-lg text-brand-deep">{money(p.amount, p.currency)}</p>
                            <p className={`text-sm ${p.status === "failed" ? "text-red-600" : "text-muted-foreground"}`}>
                              {PAYMENT_LABELS[p.status]}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                    {payments.isDemo && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Sample data: online payments aren't live yet, so these entries are placeholders.
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Category breakdown */}
              <div>
                <SectionTitle>Cards by occasion</SectionTitle>
                <ul className="flex flex-col gap-5">
                  {cardsByCategory.map((c) => (
                    <li key={c.category}>
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="text-brand-deep">{CATEGORY_LABELS[c.category] ?? c.category}</span>
                        <span className="text-muted-foreground">{c.count}</span>
                      </div>
                      <div className="h-2 bg-brand-cream">
                        <div className="h-full bg-brand-deep" style={{ width: `${(c.count / maxCategory) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>

      {editing && (
        <EditCardDialog
          key={editing.id}
          cardId={editing.id}
          templateName={editing.templateName ?? editing.title}
          templateSlug={editing.templateSlug}
          onClose={() => setEditing(null)}
          onSaved={onEditSaved}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this card?"
        message={
          deleting
            ? `"${deleting.title}" will be removed from your dashboard and its link will stop working.${deleting.isPaid ? " Your payment record is kept." : ""}`
            : ""
        }
        confirmLabel="Delete"
        busy={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </section>
  );
}