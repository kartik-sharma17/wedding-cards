import { Check } from "lucide-react";
import { STEP_LABELS } from "./config";

export default function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex items-center" aria-label="Progress">
      {STEP_LABELS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} aria-current={active ? "step" : undefined} className={`flex items-center ${i < STEP_LABELS.length - 1 ? "flex-1" : ""}`}>
            <span className="flex items-center gap-3">
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm transition-colors duration-300 ${
                  done
                    ? "bg-brand-gold text-brand-deep"
                    : active
                      ? "bg-brand-deep text-white"
                      : "border border-brand-deep/25 text-brand-deep/50"
                }`}
              >
                {done ? <Check className="size-4" /> : i + 1}
              </span>
              <span className={`text-sm ${active ? "font-medium text-brand-deep" : "text-brand-deep/55"}`}>{label}</span>
            </span>
            {i < STEP_LABELS.length - 1 && (
              <span aria-hidden className={`mx-4 h-px flex-1 transition-colors duration-500 ${done ? "bg-brand-gold" : "bg-brand-deep/15"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
