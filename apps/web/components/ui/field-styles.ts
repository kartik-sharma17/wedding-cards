export const fieldClass = (hasError?: boolean) =>
  `w-full rounded-[2px] border bg-white px-4 py-3.5 text-brand-deep transition-colors outline-none placeholder:text-brand-deep/35 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/30 ${
    hasError ? "border-destructive" : "border-input"
  }`;
