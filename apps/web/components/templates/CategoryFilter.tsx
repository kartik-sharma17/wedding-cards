"use client";

import { CATEGORY_OPTIONS } from "@/lib/templates";
import type { TemplateCategory } from "@/services/templateService";

export type CategoryValue = TemplateCategory | "all";

type Props = { value: CategoryValue; onChange: (value: CategoryValue) => void };

export default function CategoryFilter({ value, onChange }: Props) {
  const options: { value: CategoryValue; label: string }[] = [{ value: "all", label: "All designs" }, ...CATEGORY_OPTIONS];

  return (
    <div role="group" aria-label="Filter templates by occasion" className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-2 md:mx-0 md:flex-wrap md:justify-center md:px-0">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={`shrink-0 rounded-full border px-5 py-2.5 text-sm transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold ${
              active
                ? "border-brand-deep bg-brand-deep text-white"
                : "border-brand-deep/20 bg-white text-brand-deep hover:border-brand-deep"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
