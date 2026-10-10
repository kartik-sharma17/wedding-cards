"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, X } from "lucide-react";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

type Props = {
  label: string;
  hint?: string;
  /** 1 = single image (a new pick replaces the old one). */
  max: number;
  /** URLs already saved on the template. */
  existing: string[];
  onExistingChange: (urls: string[]) => void;
  /** New files, not uploaded yet. */
  files: File[];
  onFilesChange: (files: File[]) => void;
  error?: string;
};

export default function ImageField({ label, hint, max, existing, onExistingChange, files, onFilesChange, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState("");

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const count = existing.length + files.length;
  const single = max === 1;

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    setLocalError("");

    const valid: File[] = [];
    for (const file of picked) {
      if (!ALLOWED.includes(file.type)) setLocalError("Only JPG, PNG or WEBP images are allowed.");
      else if (file.size > MAX_BYTES) setLocalError("Each image must be 5 MB or smaller.");
      else valid.push(file);
    }
    if (valid.length === 0) return;

    if (single) {
      onFilesChange([valid[0]]);
      onExistingChange([]);
      return;
    }
    const room = max - count;
    if (valid.length > room) setLocalError(`You can add up to ${max} images.`);
    onFilesChange([...files, ...valid.slice(0, Math.max(room, 0))]);
  };

  const shown = error || localError;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-brand-deep">{label}</span>
        {!single && (
          <span className="text-xs text-muted-foreground">
            {count}/{max}
          </span>
        )}
      </div>

      <ul className={`grid gap-3 ${single ? "grid-cols-2" : "grid-cols-3"}`}>
        {existing.map((url) => (
          <li key={url} className="relative aspect-[3/4] overflow-hidden bg-brand-cream">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="size-full object-cover" />
            <button type="button" aria-label="Remove image" onClick={() => onExistingChange(existing.filter((u) => u !== url))} className="absolute top-1.5 right-1.5 rounded-full bg-brand-deep/80 p-1 text-white hover:bg-brand-deep">
              <X className="size-4" />
            </button>
          </li>
        ))}
        {files.map((file, i) => (
          <li key={`${file.name}-${i}`} className="relative aspect-[3/4] overflow-hidden bg-brand-cream ring-2 ring-brand-gold">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previews[i]} alt="" className="size-full object-cover" />
            <span className="absolute bottom-0 left-0 bg-brand-gold px-2 py-0.5 text-[10px] font-medium text-brand-deep">New</span>
            <button type="button" aria-label="Remove image" onClick={() => onFilesChange(files.filter((_, j) => j !== i))} className="absolute top-1.5 right-1.5 rounded-full bg-brand-deep/80 p-1 text-white hover:bg-brand-deep">
              <X className="size-4" />
            </button>
          </li>
        ))}
        {count < max && (
          <li>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 border border-dashed border-brand-deep/30 text-sm text-brand-deep/70 transition-colors hover:border-brand-deep hover:text-brand-deep"
            >
              <ImagePlus className="size-6" /> Add image
            </button>
          </li>
        )}
      </ul>

      {single && count === 1 && (
        <button type="button" onClick={() => inputRef.current?.click()} className="self-start text-sm text-brand-deep underline underline-offset-4">
          Replace image
        </button>
      )}

      <input ref={inputRef} type="file" accept={ALLOWED.join(",")} multiple={!single} onChange={onPick} className="sr-only" tabIndex={-1} />

      {shown ? (
        <p role="alert" className="text-sm text-destructive">
          {shown}
        </p>
      ) : (
        hint && <p className="text-sm text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
