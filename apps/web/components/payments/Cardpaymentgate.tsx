"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { EASE } from "@/lib/motion";
import { getApiErrorMessage } from "@/lib/apiError";
import { loadRazorpay, type RazorpaySuccess } from "@/lib/razorpay";
import { useGetCardQuery } from "@/redux/service/cardService";
import { useCreateCardPdfMutation } from "@/redux/service/pdfService";
import {
  useCreatePaymentOrderMutation,
  useGetPaymentQuoteQuery,
  useLazyGetPaymentQuoteQuery,
  useVerifyPaymentMutation,
  type PaymentQuote,
} from "@/redux/service/paymentService";

/**
 * Shared "unlock this card" UI, mounted once in the card layout so every template gets it.
 *
 *  Panel   : desktop (lg+) floats on the right, vertically centred; on smaller screens it sits
 *            below the card. Holds "Pay now <amount>" (becomes "Paid") and a locked "Download PDF".
 *  Dialog  : opens 5s after the card loads, or when Pay now / the locked Download is clicked.
 *            Coupon entry, price summary, PDF disclaimer, then it creates the order.
 *  Only the cardId (and an optional coupon code) is sent to the backend; the price is decided server-side.
 */

type Feature = { title: string; text: string };

const DEFAULT_FEATURES: Feature[] = [
  { title: "Download your card", text: "Save the finished card as a PDF to keep or share." },
  { title: "No ads", text: "Your guests see only your card, nothing else." },
  { title: "No watermark", text: "A clean card with nothing added to it." },
];

type Props = {
  /** Folder name of the template (e.g. "forest-forever"); used to build the share link. */
  templateSlug?: string;
  cardId: string;
  features?: Feature[];
  delayMs?: number;
  brandName?: string;
  /** Called when the (paid) user clicks Download. Wire this to your PDF endpoint. */
  onDownload?: (cardId: string) => Promise<void> | void;
};

type Phase = "idle" | "creating" | "paying" | "verifying" | "success";

/* ---- brand classes: retune the look here ---- */
const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep";
const btnPrimary = `inline-flex h-12 w-full items-center justify-center gap-2 bg-brand-deep px-6 text-sm font-medium tracking-wide text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;
const btnGhost = `mt-2 h-11 w-full text-sm text-brand-deep/70 underline-offset-4 transition hover:text-brand-deep hover:underline ${focusRing}`;
const panelFilled = `flex h-14 w-full items-center justify-between gap-3 bg-brand-deep px-5 text-left text-white transition hover:opacity-90 disabled:opacity-70 ${focusRing}`;
const panelOutline = `flex h-14 w-full items-center justify-between gap-3 border border-brand-deep/40 px-5 text-left text-brand-deep transition hover:border-brand-deep ${focusRing}`;

const dismissKey = (id: string) => `card-pay-popup:${id}`;
const wasDismissed = (id: string) => {
  try {
    return sessionStorage.getItem(dismissKey(id)) === "1";
  } catch {
    return false;
  }
};
const markDismissed = (id: string) => {
  try {
    sessionStorage.setItem(dismissKey(id), "1");
  } catch {
    /* storage unavailable: the popup may show again, which is fine */
  }
};

function themeColor() {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--color-brand-deep").trim();
  return v || "#1b2133";
}

const getErrorMessage = (error: unknown) => getApiErrorMessage(error);

/** paise -> "₹499" or "₹499.50" */
const formatMoney = (paise: number, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: paise % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(paise / 100);

/* ---------------- icons ---------------- */
const Check = ({ className = "" }: { className?: string }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={`shrink-0 ${className}`}>
    <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.2" />
    <path d="m6 10.3 2.8 2.8L14 7.9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Lock = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
    <rect x="4.5" y="9" width="11" height="8" rx="1" />
    <path d="M7 9V6.5a3 3 0 0 1 6 0V9" />
  </svg>
);
const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
    <path d="M10 3v10m0 0-3.5-3.5M10 13l3.5-3.5M4 16.5h12" />
  </svg>
);
const CopyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
    <rect x="7" y="7" width="9.5" height="9.5" rx="1.2" />
    <path d="M13 7V4.7A1.2 1.2 0 0 0 11.8 3.5H4.7A1.2 1.2 0 0 0 3.5 4.7v7.1A1.2 1.2 0 0 0 4.7 13H7" />
  </svg>
);
const ShareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
    <circle cx="15" cy="4.5" r="2" />
    <circle cx="5" cy="10" r="2" />
    <circle cx="15" cy="15.5" r="2" />
    <path d="m6.8 9 6.4-3.5M6.8 11l6.4 3.5" />
  </svg>
);
const Info = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true" className="mt-px shrink-0">
    <circle cx="10" cy="10" r="8.5" />
    <path d="M10 9v5M10 6.2v.1" />
  </svg>
);
const Spinner = () => (
  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity=".25" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export default function CardPaymentGate({
  cardId,
  features = DEFAULT_FEATURES,
  delayMs = 5000,
  brandName = "Wedding Cards",
  templateSlug,
  onDownload,
}: Props) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const couponId = useId();
  const primaryRef = useRef<HTMLButtonElement>(null);

  const { data } = useGetCardQuery(cardId);
  const loaded = Boolean(data?.data?.card);

  const [createOrder] = useCreatePaymentOrderMutation();
  const [verifyPayment] = useVerifyPaymentMutation();
  const [fetchQuote] = useLazyGetPaymentQuoteQuery();
  const [createPdf] = useCreateCardPdfMutation();

  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  /** Set when Razorpay took the money but our verify call failed, so we never ask to pay twice. */
  const [pending, setPending] = useState<RazorpaySuccess | null>(null);
  const [justPaid, setJustPaid] = useState(false);

  // coupon
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applied, setApplied] = useState<{ code: string; quote: PaymentQuote } | null>(null);

  // download
  const [downloading, setDownloading] = useState(false);
  const [downloadMsg, setDownloadMsg] = useState<string | null>(null);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const paid = Boolean(data?.data?.card?.isPaid) || justPaid;
  const busy = phase === "creating" || phase === "paying" || phase === "verifying";

  const { data: baseQuoteRes } = useGetPaymentQuoteQuery({ cardId }, { skip: !loaded || paid });
  const quote: PaymentQuote | undefined = applied?.quote ?? baseQuoteRes?.data;

  /* Open the popup N seconds after the card details arrive. */
  useEffect(() => {
    if (!loaded || paid || wasDismissed(cardId)) return;
    const id = window.setTimeout(() => setOpen(true), delayMs);
    return () => window.clearTimeout(id);
  }, [loaded, paid, cardId, delayMs]);

  /* Warm up checkout.js while the user reads the popup. */
  useEffect(() => {
    if (loaded && !paid) loadRazorpay().catch(() => {});
  }, [loaded, paid]);

  const close = useCallback(() => {
    if (busy) return;
    setOpen(false);
    if (phase === "success") setPhase("idle");
    else markDismissed(cardId);
  }, [busy, phase, cardId]);

  /* Modal behaviour: scroll lock, focus in, focus back out, Esc to close. */
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    if (open) primaryRef.current?.focus();
  }, [open, phase, pending]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  /* ---------------- coupon ---------------- */
  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponError("Enter a coupon code.");
      return;
    }
    setCouponBusy(true);
    setCouponError(null);
    try {
      const res = await fetchQuote({ cardId, couponCode: code }).unwrap();
      if (res.data) setApplied({ code: res.data.couponCode ?? code, quote: res.data });
    } catch (e) {
      setCouponError(getErrorMessage(e));
    } finally {
      setCouponBusy(false);
    }
  };

  const removeCoupon = () => {
    setApplied(null);
    setCouponInput("");
    setCouponError(null);
  };

  /* ---------------- payment flow ---------------- */
  const confirm = async (resp: RazorpaySuccess) => {
    setError(null);
    setPending(resp);
    setPhase("verifying");
    setOpen(true);
    try {
      await verifyPayment(resp).unwrap();
      setPending(null);
      setJustPaid(true);
      setPhase("success");
    } catch (e) {
      setError(getErrorMessage(e));
      setPhase("idle");
    }
  };

  const startPayment = async () => {
    setError(null);
    setPhase("creating");
    try {
      const order = await createOrder({ cardId, couponCode: applied?.code }).unwrap();
      const o = order.data;

      // Free template or a 100% coupon: the backend already unlocked the card.
      if (o?.free) {
        setJustPaid(true);
        setPhase("success");
        return;
      }

      await loadRazorpay();
      if (!o?.orderId || !o.keyId || !window.Razorpay) throw new Error("Couldn't start the payment. Please try again.");

      const rzp = new window.Razorpay({
        key: o.keyId,
        order_id: o.orderId,
        amount: o.amount,
        currency: o.currency,
        name: brandName,
        description: "Unlock your card",
        theme: { color: themeColor() },
        handler: (resp) => {
          void confirm(resp);
        },
        modal: { ondismiss: () => setPhase((p) => (p === "paying" ? "idle" : p)) },
      });
      rzp.on("payment.failed", (r) => {
        setError(r.error?.description || "The payment didn't go through. You can try again.");
      });

      setPhase("paying");
      rzp.open();
    } catch (e) {
      setError(getErrorMessage(e));
      setPhase("idle");
    }
  };

  /* ---------------- share ---------------- */
  const publicSlug = data?.data?.card?.publicSlug;
  const shareUrl = () => `${window.location.origin}/card/${templateSlug}/${publicSlug}/share`;

  const copyLink = async () => {
    if (!templateSlug || !publicSlug) return;
    const url = shareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setShareMsg(`Link copied: ${url}`);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setShareMsg(`Copy this link: ${url}`); // clipboard blocked: show it so it can be copied by hand
    }
  };

  // The system share sheet (Messages, WhatsApp, AirDrop...). Handy on phones; Copy link is the main action.
  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const nativeShare = async () => {
    if (!templateSlug || !publicSlug) return;
    try {
      await navigator.share({ title: "You're invited", url: shareUrl() });
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return; // the user closed the sheet
      void copyLink();
    }
  };

  /* ---------------- download ---------------- */
  // 1) the server makes (or reuses) the PDF, 2) the browser follows a short-lived signed link,
  // so the file downloads natively (this also works in in-app browsers).
  const defaultDownload = async (id: string) => {
    const res = await createPdf(id).unwrap();
    const path = res.data?.downloadPath;
    if (!path) throw new Error("The PDF isn't ready yet. Please try again.");
    const base = process.env.NEXT_PUBLIC_API_URL;
    if (!base) throw new Error("NEXT_PUBLIC_API_URL is not set, so the download link can't be built.");
    window.location.assign(`${base.replace(/\/$/, "")}${path}`);
  };

  const handleDownload = async () => {
    if (!paid) {
      setOpen(true); // locked: explain and offer to pay
      return;
    }
    setDownloadMsg(null);
    setDownloading(true);
    try {
      await (onDownload ?? defaultDownload)(cardId);
    } catch (e) {
      setDownloadMsg(getErrorMessage(e));
    } finally {
      setDownloading(false);
    }
  };

  if (!loaded) return null;

  const currency = quote?.currency ?? "INR";
  const money = (p: number) => formatMoney(p, currency);
  const hasDiscount = (quote?.discountAmount ?? 0) > 0;
  const onPrimary = () => (pending ? void confirm(pending) : void startPayment());

  const primaryLabel =
    phase === "creating"
      ? "Preparing payment"
      : phase === "paying"
        ? "Complete the payment"
        : pending
          ? "Retry confirmation"
          : quote?.isFree
            ? "Unlock for free"
            : quote
              ? `Pay ${money(quote.amount)}`
              : "Pay now";

  return (
    <>
      {/* ------------ Panel: right of the card on lg+, below the card on smaller screens ------------ */}
      <section
        aria-label="Card actions"
        className="relative z-10 mx-auto my-8 w-[min(92vw,26rem)] border border-brand-deep/15 bg-brand-cream p-5 text-brand-deep shadow-xl lg:fixed lg:right-6 lg:top-1/2 lg:z-[900] lg:my-0 lg:w-64 lg:-translate-y-1/2"
      >
        <p className="text-xs uppercase tracking-[0.22em] text-brand-deep/60">Your card</p>
        <p className="mt-1 font-serif text-xl leading-snug">{paid ? "Unlocked and ready" : "Unlock to download"}</p>

        <div className="mt-4 space-y-3">
          {paid ? (
            <button type="button" disabled className="flex h-14 w-full cursor-default items-center justify-center gap-2 border border-brand-deep/40 text-brand-deep">
              <Check />
              <span className="font-medium">Paid</span>
            </button>
          ) : (
            <button type="button" onClick={() => setOpen(true)} className={panelFilled}>
              <span className="font-medium">{pending ? "Confirm payment" : "Pay now"}</span>
              {quote && !pending && (
                <span className="flex items-baseline gap-2">
                  {hasDiscount && <s className="text-xs opacity-60">{money(quote.originalAmount)}</s>}
                  <span className="font-serif text-xl">{quote.isFree ? "Free" : money(quote.amount)}</span>
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={downloading}
            aria-disabled={!paid}
            className={`${paid ? panelFilled : `${panelOutline} text-brand-deep/70 hover:text-brand-deep`}`}
          >
            <span className="font-medium">{downloading ? "Preparing PDF" : "Download PDF"}</span>
            {downloading ? <Spinner /> : paid ? <DownloadIcon /> : <Lock />}
          </button>

          {templateSlug && publicSlug && (
            <div className="flex gap-2">
              <button type="button" onClick={() => void copyLink()} className={`${panelOutline} min-w-0 flex-1`}>
                <span className="font-medium">{copied ? "Copied" : "Copy link"}</span>
                {copied ? <Check /> : <CopyIcon />}
              </button>
              {canNativeShare && (
                <button
                  type="button"
                  onClick={() => void nativeShare()}
                  aria-label="Share the link"
                  title="Share"
                  className={`flex h-14 w-14 shrink-0 items-center justify-center border border-brand-deep/40 text-brand-deep transition hover:border-brand-deep ${focusRing}`}
                >
                  <ShareIcon />
                </button>
              )}
            </div>
          )}
        </div>

        {shareMsg && (
          <p role="status" className="mt-3 break-all text-xs leading-relaxed text-brand-deep/75">
            {shareMsg}
          </p>
        )}
        {downloadMsg && (
          <p role="status" className="mt-3 text-xs leading-relaxed text-brand-deep/75">
            {downloadMsg}
          </p>
        )}
        <p className="mt-3 text-xs leading-relaxed text-brand-deep/60">The PDF is a still copy with no animation.</p>
      </section>

      {/* ------------ Dialog ------------ */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[1000] grid place-items-center bg-brand-deep/60 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.3 }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) close();
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="relative max-h-[92dvh] w-full max-w-md overflow-y-auto border border-brand-deep/15 bg-brand-cream p-7 text-brand-deep shadow-2xl sm:p-9"
              initial={{ opacity: 0, y: reduceMotion ? 0 : 24, scale: reduceMotion ? 1 : 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: reduceMotion ? 0 : 12, scale: reduceMotion ? 1 : 0.98 }}
              transition={{ duration: reduceMotion ? 0 : 0.5, ease: EASE }}
            >
              {!busy && (
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close"
                  className={`absolute right-3 top-3 grid h-9 w-9 place-items-center text-brand-deep/60 transition hover:text-brand-deep ${focusRing}`}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                    <path d="m3 3 10 10M13 3 3 13" />
                  </svg>
                </button>
              )}

              {phase === "success" ? (
                <div className="text-center">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-brand-deep/30">
                    <svg width="26" height="26" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path d="m5 10.5 3.2 3.2L15 6.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h2 id={titleId} className="mt-5 font-serif text-3xl leading-tight">
                    {quote?.isFree ? "Card unlocked" : "Payment successful"}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-brand-deep/75">
                    Your card is unlocked. The ads and watermark are gone, and you can download the PDF now.
                  </p>
                  <button ref={primaryRef} type="button" onClick={close} className={`${btnPrimary} mt-7`}>
                    Done
                  </button>
                </div>
              ) : phase === "verifying" ? (
                <div className="py-6 text-center" aria-live="polite">
                  <div className="mx-auto w-fit text-brand-deep">
                    <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" opacity=".2" />
                      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <h2 id={titleId} className="mt-5 font-serif text-2xl">
                    Confirming your payment
                  </h2>
                  <p className="mt-2 text-sm text-brand-deep/75">This takes a moment. Please keep this page open.</p>
                </div>
              ) : (
                <>
                  <p className="text-xs uppercase tracking-[0.22em] text-brand-deep/60">Unlock your card</p>
                  <h2 id={titleId} className="mt-3 font-serif text-3xl leading-tight">
                    {pending ? "One last step" : "Make your card complete"}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-brand-deep/75">
                    {pending
                      ? "Your payment went through, but we couldn't confirm it yet. Please don't pay again. Tap retry below."
                      : "One payment unlocks everything below for this card."}
                  </p>

                  {!pending && (
                    <>
                      <ul className="mt-6 space-y-4">
                        {features.map((f) => (
                          <li key={f.title} className="flex gap-3">
                            <Check className="mt-0.5 text-brand-deep" />
                            <div>
                              <p className="font-medium">{f.title}</p>
                              <p className="text-sm text-brand-deep/70">{f.text}</p>
                            </div>
                          </li>
                        ))}
                      </ul>

                      {/* Coupon */}
                      <div className="mt-6 border-t border-brand-deep/15 pt-4">
                        {applied ? (
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <p className="flex items-center gap-2">
                              <Check className="h-4 w-4" />
                              <span>
                                <span className="font-medium tracking-wide">{applied.code}</span> applied
                              </span>
                            </p>
                            <button type="button" onClick={removeCoupon} disabled={busy} className={`text-brand-deep/70 underline underline-offset-4 hover:text-brand-deep ${focusRing}`}>
                              Remove
                            </button>
                          </div>
                        ) : couponOpen ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              void applyCoupon();
                            }}
                          >
                            <label htmlFor={couponId} className="sr-only">
                              Coupon code
                            </label>
                            <div className="flex gap-2">
                              <input
                                id={couponId}
                                value={couponInput}
                                onChange={(e) => setCouponInput(e.target.value)}
                                placeholder="Coupon code"
                                autoComplete="off"
                                autoCapitalize="characters"
                                autoFocus
                                maxLength={40}
                                aria-invalid={Boolean(couponError)}
                                aria-describedby={couponError ? `${couponId}-err` : undefined}
                                className={`h-11 min-w-0 flex-1 border border-brand-deep/30 bg-white/60 px-3 text-sm uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal placeholder:text-brand-deep/45 ${focusRing}`}
                              />
                              <button
                                type="submit"
                                disabled={couponBusy || busy}
                                className={`inline-flex h-11 items-center gap-2 border border-brand-deep px-4 text-sm font-medium transition hover:bg-brand-deep hover:text-white disabled:opacity-60 ${focusRing}`}
                              >
                                {couponBusy && <Spinner />}
                                Apply
                              </button>
                            </div>
                            {couponError && (
                              <p id={`${couponId}-err`} role="alert" className="mt-2 text-sm text-red-800">
                                {couponError}
                              </p>
                            )}
                          </form>
                        ) : (
                          <button type="button" onClick={() => setCouponOpen(true)} className={`text-sm text-brand-deep underline underline-offset-4 ${focusRing}`}>
                            Have a coupon code?
                          </button>
                        )}
                      </div>

                      {/* Price summary */}
                      {quote && (
                        <dl className="mt-4 space-y-2 text-sm">
                          {hasDiscount && (
                            <>
                              <div className="flex justify-between text-brand-deep/70">
                                <dt>Card price</dt>
                                <dd>{money(quote.originalAmount)}</dd>
                              </div>
                              <div className="flex justify-between text-brand-deep/70">
                                <dt>Coupon {quote.couponCode}</dt>
                                <dd>−{money(quote.discountAmount)}</dd>
                              </div>
                            </>
                          )}
                          <div className="flex items-baseline justify-between">
                            <dt className="font-medium">Total</dt>
                            <dd className="font-serif text-2xl">{quote.isFree ? "Free" : money(quote.amount)}</dd>
                          </div>
                        </dl>
                      )}

                      {/* PDF disclaimer */}
                      <p className="mt-5 flex gap-2 border border-brand-deep/15 bg-brand-deep/[0.04] px-3 py-2 text-xs leading-relaxed text-brand-deep/75">
                        <Info />
                        <span>The downloaded card is a PDF. It doesn&apos;t include any animation or the page-turning effect.</span>
                      </p>
                    </>
                  )}

                  {error && (
                    <p role="alert" className="mt-5 border-l-2 border-red-700 bg-red-50 px-3 py-2 text-sm text-red-800">
                      {error}
                    </p>
                  )}

                  <button ref={primaryRef} type="button" onClick={onPrimary} disabled={busy} className={`${btnPrimary} mt-6`}>
                    {busy && <Spinner />}
                    {primaryLabel}
                  </button>
                  {!pending && (
                    <button type="button" onClick={close} disabled={busy} className={btnGhost}>
                      Maybe later
                    </button>
                  )}
                  <p className="mt-4 text-center text-xs text-brand-deep/55">Secure payment by Razorpay</p>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}