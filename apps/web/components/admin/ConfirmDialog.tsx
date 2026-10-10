"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({ open, title, message, confirmLabel, busy = false, onConfirm, onCancel }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onCancel();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div data-lenis-prevent className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-deep/70 p-6 backdrop-blur-sm">
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-md bg-white p-6 shadow-2xl sm:p-8">
        <h2 id="confirm-title" className="font-serif text-3xl text-brand-deep">
          {title}
        </h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">{message}</p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} disabled={busy} autoFocus className="border border-brand-deep px-6 py-3 text-sm text-brand-deep hover:bg-brand-deep hover:text-white disabled:opacity-60">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={busy} className="inline-flex items-center justify-center gap-2 bg-destructive px-6 py-3 text-sm text-white hover:opacity-90 disabled:opacity-60">
            {busy && <Loader2 className="size-4 animate-spin" />} {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
