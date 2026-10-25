"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SafeImage from "@/components/ui/SafeImage";

type Props = { images: string[]; name: string };

export default function TemplateGallery({ images, name }: Props) {
  const [active, setActive] = useState(0);
  const activeSrc = images[active] ?? images[0];

  if (!activeSrc) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center bg-gradient-to-br from-brand-teal to-brand-deep p-8 text-center font-script text-6xl text-brand-gold">
        {name}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-[4/5] overflow-hidden bg-brand-cream">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSrc}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
          >
            <SafeImage
              src={activeSrc}
              alt={`${name} invitation, view ${active + 1} of ${images.length}`}
              sizes="(min-width:1024px) 50vw, 100vw"
              fit="contain"
              unoptimized
              priority
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {images.length > 1 && (
        <ul className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {images.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show view ${i + 1}`}
                aria-current={i === active}
                className={`relative block aspect-[4/5] w-full overflow-hidden bg-brand-cream outline-offset-2 transition-opacity focus-visible:outline-2 focus-visible:outline-brand-gold ${
                  i === active ? "ring-2 ring-brand-gold" : "opacity-60 hover:opacity-100"
                }`}
              >
                <SafeImage src={src} alt="" sizes="120px" unoptimized />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}