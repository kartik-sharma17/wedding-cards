"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = { page: number; totalPages: number; onChange: (page: number) => void };

const base =
  "flex size-11 items-center justify-center border text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold disabled:pointer-events-none disabled:opacity-40";

export default function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav aria-label="Pagination" className="mt-16 flex items-center justify-center gap-2">
      <button type="button" aria-label="Previous page" disabled={page === 1} onClick={() => onChange(page - 1)} className={`${base} border-brand-deep/20 hover:border-brand-deep`}>
        <ChevronLeft className="size-5" />
      </button>

      {totalPages <= 7 ? (
        pages.map((p) => (
          <button
            key={p}
            type="button"
            aria-current={p === page ? "page" : undefined}
            onClick={() => onChange(p)}
            className={`${base} ${p === page ? "border-brand-deep bg-brand-deep text-white" : "border-brand-deep/20 hover:border-brand-deep"}`}
          >
            {p}
          </button>
        ))
      ) : (
        <span className="px-4 text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>
      )}

      <button type="button" aria-label="Next page" disabled={page === totalPages} onClick={() => onChange(page + 1)} className={`${base} border-brand-deep/20 hover:border-brand-deep`}>
        <ChevronRight className="size-5" />
      </button>
    </nav>
  );
}
