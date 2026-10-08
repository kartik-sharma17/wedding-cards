"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Props = {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  fit?: "cover" | "contain";
  /** Skip Next's image optimiser. Use for images from hosts not listed in next.config. */
  unoptimized?: boolean;
};

/** next/image that falls back to a brand gradient if the remote image fails. Parent must be `relative`. */
export default function SafeImage({
  src,
  alt,
  sizes = "100vw",
  priority,
  className = "",
  fit = "cover",
  unoptimized,
}: Props) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="absolute inset-0 bg-gradient-to-br from-brand-teal via-brand-deep to-brand-deep"
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={unoptimized}
      onError={() => setFailed(true)}
      className={`${fit === "contain" ? "object-contain" : "object-cover"} ${className}`}
    />
  );
}
