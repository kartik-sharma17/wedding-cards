"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { EASE } from "@/lib/motion";
import { loadRazorpay, type RazorpaySuccess } from "@/lib/razorpay";
import { useGetCardQuery } from "@/redux/service/cardService";
import { useCreatePaymentOrderMutation, useVerifyPaymentMutation } from "@/redux/service/paymentservice";
/**
 * Shared "unlock this card" UI. Works with every template because it lives in the card
 * route layout, not inside a template.
 *
 *  - Reads the card with the same query the page uses (RTK Query dedupes it: one request).
 *  - Renders nothing until the card loads, and nothing once the card is paid.
 *  - Opens the benefits popup `delayMs` after the card loads (once per session per card).
 *  - Keeps a small floating "Pay now" button for afterwards.
 *  - Only ever sends the cardId to the backend; the price is decided server-side.
 */

type Feature = { title: string; text: string };

const DEFAULT_FEATURES: Feature[] = [
  { title: "Download your card", text: "Save the finished card to keep or share anywhere." },
  { title: "No ads", text: "Your guests see only your card, nothing else." },
  { title: "No watermark", text: "A clean card with nothing added to it." },
];

type Props = {
  cardId: string;
  features?: Feature[];
  delayMs?: number;
  brandName?: string;
};

type Phase = "idle" | "creating" | "paying" | "verifying" | "success";

/* Brand classes live here so you can retune them in one place. */
const btnPrimary =
  "inline-flex h-12 w-full items-center justify-center gap-2 bg-brand-deep px-6 text-sm font-medium tracking-wide text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep disabled:cursor-not-allowed disabled:opacity-60";
const btnGhost =
  "mt-2 h-11 w-full text-sm text-brand-deep/70 underline-offset-4 transition hover:text-brand-deep hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-deep";

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
    /* storage unavailable: popup may show again, which is fine */
  }
};

function themeColor() {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--color-brand-deep").trim();
  return v || "#1b2133";
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  const e = error as { status?: number | string; data?: { message?: string; detail?: unknown } } | undefined;
  if (e?.data?.message) return e.data.message;
  if (typeof e?.data?.detail === "string") return e.data.detail;
  if (e?.status === 401) return "Please sign in again to continue.";
  if (e?.status === "FETCH_ERROR") return "Check your internet connection and try again.";
  return "Something went wrong. Please try again.";
}

const Check = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="mt-0.5 shrink-0 text-brand-deep">
    <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.2" />
    <path d="m6 10.3 2.8 2.8L14 7.9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
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
}: Props) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const primaryRef = useRef<HTMLButtonElement>(null);

  const { data } = useGetCardQuery(cardId);
  const loaded = Boolean(data?.data?.card);
  const isPaid = Boolean(data?.data?.card?.isPaid);

  const [createOrder] = useCreatePaymentOrderMutation();
  const [verifyPayment] = useVerifyPaymentMutation();

  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  /** Set when Razorpay took the money but our verify call failed, so we never ask to pay twice. */
  const [pending, setPending] = useState<RazorpaySuccess | null>(null);

  const busy = phase === "creating" || phase === "paying" || phase === "verifying";

  /* Open the popup N seconds after the card details arrive. */
  useEffect(() => {
    if (!loaded || isPaid || wasDismissed(cardId)) return;
    const id = window.setTimeout(() => setOpen(true), delayMs);
    return () => window.clearTimeout(id);
  }, [loaded, isPaid, cardId, delayMs]);

  /* Warm up checkout.js while the user reads the popup. */
  useEffect(() => {
    if (loaded && !isPaid) loadRazorpay().catch(() => {});
  }, [loaded, isPaid]);

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

  /* ---------------- payment flow ---------------- */
  const confirm = async (resp: RazorpaySuccess) => {
    setError(null);
    setPending(resp);
    setPhase("verifying");
    setOpen(true);
    try {
      await verifyPayment(resp).unwrap();
      setPending(null);
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
      const [order] = await Promise.all([createOrder({ cardId }).unwrap(), loadRazorpay()]);
      const o = order.data;
      if (!o?.orderId || !window.Razorpay) throw new Error("Couldn't start the payment. Please try again.");

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

  if (!loaded || (isPaid && phase !== "success")) return null;

  const onPrimary = () => (pending ? void confirm(pending) : void startPayment());
  const primaryLabel = pending ? "Retry confirmation" : "Pay now";

  return (
    <>
      {/* Floating button, shown whenever the popup is closed */}
      {!open && !isPaid && (
        <button
          type="button"
          onClick={() => (pending ? setOpen(true) : void startPayment())}
          disabled={busy}
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-[900] inline-flex h-11 items-center gap-2 rounded-full bg-brand-deep px-5 text-sm font-medium text-white shadow-lg ring-1 ring-white/20 transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep disabled:opacity-70"
        >
          {busy && <Spinner />}
          {pending ? "Confirm payment" : busy ? "Please wait" : "Pay now"}
        </button>
      )}

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
                  className="absolute right-3 top-3 grid h-9 w-9 place-items-center text-brand-deep/60 transition hover:text-brand-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-deep"
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
                    Payment successful
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-brand-deep/75">
                    Your card is unlocked. The ads and watermark are gone, and you can download it now.
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
                    <ul className="mt-6 space-y-4">
                      {features.map((f) => (
                        <li key={f.title} className="flex gap-3">
                          <Check />
                          <div>
                            <p className="font-medium">{f.title}</p>
                            <p className="text-sm text-brand-deep/70">{f.text}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  {error && (
                    <p role="alert" className="mt-5 border-l-2 border-red-700 bg-red-50 px-3 py-2 text-sm text-red-800">
                      {error}
                    </p>
                  )}

                  <button ref={primaryRef} type="button" onClick={onPrimary} disabled={busy} className={`${btnPrimary} mt-7`}>
                    {busy && <Spinner />}
                    {phase === "creating" ? "Preparing payment" : phase === "paying" ? "Complete the payment" : primaryLabel}
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