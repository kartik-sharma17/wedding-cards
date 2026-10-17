"use client";

import { useEffect, useId, useState } from "react";
import { Loader2, X } from "lucide-react";
import {
  useAdminCreateCouponMutation,
  useAdminUpdateCouponMutation,
  type AdminCoupon,
  type DiscountType,
  type UpdateCouponBody,
} from "@/redux/service/adminCouponService";
import { getApiErrorMessage } from "@/lib/auth";

const CODE_PATTERN = /^[A-Z0-9_-]{3,40}$/;

const field =
  "w-full border border-input bg-white px-4 py-3 text-sm text-brand-deep outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/30 disabled:bg-brand-cream/60 disabled:text-brand-deep/60";
const label = "mb-1.5 block text-sm font-medium text-brand-deep";
const hint = "mt-1.5 text-xs text-muted-foreground";

const pad = (n: number) => String(n).padStart(2, "0");
/** ISO instant -> "YYYY-MM-DD" in the admin's own timezone (for <input type="date">). */
const toLocalDate = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
/** "2027-01-31" -> end of that day in the admin's timezone, as an ISO instant. */
const endOfLocalDay = (date: string) => new Date(`${date}T23:59:59`).toISOString();
const todayLocal = () => toLocalDate(new Date().toISOString());

type Props = {
  /** null = create a new coupon, otherwise edit this one. */
  coupon: AdminCoupon | null;
  onClose: () => void;
  onSaved: (message: string) => void;
};

/** Mount this only while it's open, so every open starts with fresh state. */
export default function CouponFormDialog({ coupon, onClose, onSaved }: Props) {
  const editing = coupon !== null;
  const uid = useId();

  const [code, setCode] = useState(coupon?.code ?? "");
  const [discountType, setDiscountType] = useState<DiscountType>(coupon?.discountType ?? "percent");
  const [value, setValue] = useState(coupon ? String(coupon.value) : "");
  const [maxDiscount, setMaxDiscount] = useState(coupon?.maxDiscount != null ? String(coupon.maxDiscount) : "");
  const initialExpires = toLocalDate(coupon?.expiresAt ?? null);
  const [expires, setExpires] = useState(initialExpires);
  const [maxRedemptions, setMaxRedemptions] = useState(coupon?.maxRedemptions != null ? String(coupon.maxRedemptions) : "");
  const [isActive, setIsActive] = useState(coupon?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);

  const [createCoupon, { isLoading: creating }] = useAdminCreateCouponMutation();
  const [updateCoupon, { isLoading: updating }] = useAdminUpdateCouponMutation();
  const saving = creating || updating;

  // Scroll lock + Escape to close.
  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [saving, onClose]);

  const validate = (): string | null => {
    if (!editing && !CODE_PATTERN.test(code.trim().toUpperCase())) {
      return "The code must be 3-40 characters: letters, numbers, - or _.";
    }

    const v = Number(value);
    if (!value.trim() || !Number.isFinite(v) || v <= 0) return "Enter a discount value greater than 0.";
    if (discountType === "percent" && v > 100) return "A percent discount can't be more than 100.";

    if (discountType === "percent" && maxDiscount.trim()) {
      const m = Number(maxDiscount);
      if (!Number.isFinite(m) || m <= 0) return "Max discount must be greater than 0, or left empty.";
    }

    if (maxRedemptions.trim()) {
      const r = Number(maxRedemptions);
      if (!Number.isInteger(r) || r < 1) return "Max redemptions must be a whole number of at least 1, or left empty.";
      if (editing && r < coupon.redeemedCount) return `It was already used ${coupon.redeemedCount} times, so the limit can't be lower than that.`;
    }

    const expiryChanged = expires !== initialExpires;
    if (expires && expiryChanged && expires < todayLocal()) return "The expiry date can't be in the past.";

    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);

    const base = {
      discountType,
      value: Number(value),
      maxDiscount: discountType === "percent" && maxDiscount.trim() ? Number(maxDiscount) : null,
      maxRedemptions: maxRedemptions.trim() ? Number(maxRedemptions) : null,
      isActive,
    };

    try {
      if (editing) {
        const body: UpdateCouponBody = { ...base };
        // Only send the expiry if the admin changed it, so editing other fields never shifts it.
        if (expires !== initialExpires) body.expiresAt = expires ? endOfLocalDay(expires) : null;
        const res = await updateCoupon({ id: coupon.id, body }).unwrap();
        onSaved(res.message || `${coupon.code} was updated.`);
      } else {
        const res = await createCoupon({
          ...base,
          code: code.trim().toUpperCase(),
          expiresAt: expires ? endOfLocalDay(expires) : null,
        }).unwrap();
        onSaved(res.message || "Coupon created.");
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "We couldn't save this coupon."));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-brand-deep/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        onSubmit={submit}
        noValidate
        className="relative my-auto w-full max-w-lg border border-border bg-white p-6 shadow-2xl sm:p-8"
      >
        <button type="button" onClick={onClose} disabled={saving} aria-label="Close" className="absolute top-3 right-3 rounded p-2 text-brand-deep/60 hover:bg-brand-cream hover:text-brand-deep disabled:opacity-40">
          <X className="size-5" />
        </button>

        <h2 id={`${uid}-title`} className="font-serif text-3xl text-brand-deep">
          {editing ? "Edit coupon" : "New coupon"}
        </h2>
        {editing && (
          <p className="mt-1 text-sm text-muted-foreground">
            Used {coupon.redeemedCount} {coupon.redeemedCount === 1 ? "time" : "times"} so far.
          </p>
        )}

        <div className="mt-6 space-y-5">
          <div>
            <label htmlFor={`${uid}-code`} className={label}>
              Coupon code
            </label>
            <input
              id={`${uid}-code`}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={editing}
              autoFocus={!editing}
              autoComplete="off"
              maxLength={40}
              placeholder="WELCOME20"
              className={`${field} font-mono tracking-wider uppercase`}
            />
            <p className={hint}>{editing ? "The code can't be changed after it's created." : "Letters, numbers, - and _ (3-40). Customers type this at checkout."}</p>
          </div>

          <fieldset>
            <legend className={label}>Discount type</legend>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["percent", "Percent off"],
                  ["flat", "Flat amount off"],
                ] as const
              ).map(([type, text]) => (
                <label
                  key={type}
                  className={`flex cursor-pointer items-center gap-2 border px-4 py-3 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-gold/40 ${discountType === type ? "border-brand-deep bg-brand-cream text-brand-deep" : "border-input text-brand-deep/70 hover:border-brand-deep/50"}`}
                >
                  <input type="radio" name={`${uid}-type`} value={type} checked={discountType === type} onChange={() => setDiscountType(type)} className="accent-brand-deep" />
                  {text}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor={`${uid}-value`} className={label}>
                {discountType === "percent" ? "Percent (1-100)" : "Amount off (₹)"}
              </label>
              <input id={`${uid}-value`} type="number" inputMode="decimal" min={0} step="any" value={value} onChange={(e) => setValue(e.target.value)} autoFocus={editing} className={field} />
            </div>
            {discountType === "percent" && (
              <div>
                <label htmlFor={`${uid}-max`} className={label}>
                  Max discount (₹)
                </label>
                <input id={`${uid}-max`} type="number" inputMode="decimal" min={0} step="any" value={maxDiscount} onChange={(e) => setMaxDiscount(e.target.value)} placeholder="No cap" className={field} />
              </div>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor={`${uid}-exp`} className={label}>
                Expires on
              </label>
              <input id={`${uid}-exp`} type="date" value={expires} min={editing ? undefined : todayLocal()} onChange={(e) => setExpires(e.target.value)} className={field} />
              <p className={hint}>Valid until the end of this day. Empty = never expires.</p>
            </div>
            <div>
              <label htmlFor={`${uid}-red`} className={label}>
                Max redemptions
              </label>
              <input id={`${uid}-red`} type="number" inputMode="numeric" min={1} step={1} value={maxRedemptions} onChange={(e) => setMaxRedemptions(e.target.value)} placeholder="Unlimited" className={field} />
              <p className={hint}>Total uses across all customers.</p>
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 text-sm text-brand-deep">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="mt-0.5 size-4 accent-brand-deep" />
            <span>
              <span className="font-medium">Active</span>
              <span className="block text-xs text-muted-foreground">Turn off to stop customers using it without deleting it.</span>
            </span>
          </label>
        </div>

        {error && (
          <p role="alert" className="mt-5 border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-7 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={saving} className="border border-brand-deep px-6 py-3 text-sm text-brand-deep transition-colors hover:bg-brand-deep hover:text-white disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 bg-brand-deep px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-teal disabled:opacity-60">
            {saving && <Loader2 className="size-4 animate-spin" />}
            {editing ? "Save changes" : "Create coupon"}
          </button>
        </div>
      </form>
    </div>
  );
}