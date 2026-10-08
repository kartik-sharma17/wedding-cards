"use client";

import { useId, type TextareaHTMLAttributes } from "react";
import { fieldClass } from "./field-styles";

type Props = {
  label: string;
  error?: string;
  hint?: string;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className">;

export default function TextAreaField({ label, error, hint, rows = 3, ...rest }: Props) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-brand-deep">
        {label}
      </label>
      <textarea id={id} rows={rows} aria-invalid={Boolean(error)} className={`${fieldClass(Boolean(error))} resize-y`} {...rest} />
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="text-sm text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
