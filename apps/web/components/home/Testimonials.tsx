"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SafeImage from "../ui/SafeImage";
import SectionHeading from "../ui/SectionHeading";
import { TESTIMONIALS } from "../../lib/constants";
import { EASE } from "../../lib/motion";

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const total = TESTIMONIALS.length;
  const current = TESTIMONIALS[index];

  // Auto-advance; restarts whenever the person picks a slide themselves.
  useEffect(() => {
    const id = setTimeout(() => setIndex((i) => (i + 1) % total), 8000);
    return () => clearTimeout(id);
  }, [index, total]);

  const go = (dir: 1 | -1) => setIndex((i) => (i + dir + total) % total);

  return (
    <section id="testimonials" className="scroll-mt-20 bg-brand-cream py-24 md:py-32">
      <div className="mx-auto max-w-4xl px-6 lg:px-10">
        <SectionHeading eyebrow="Reviews" title={"Kind words from\npeople we've helped"} />

        <div className="relative mt-16 min-h-[22rem] text-center md:min-h-[19rem]">
          <AnimatePresence mode="wait">
            <motion.figure
              key={index}
              className="flex flex-col items-center gap-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <blockquote className="font-serif text-2xl leading-relaxed text-brand-deep md:text-4xl">
                “{current?.quote}”
              </blockquote>
              <figcaption className="flex items-center gap-4">
                <span className="relative size-12 overflow-hidden rounded-full">
                  <SafeImage src={current?.avatar || ""} alt={current?.name || "image"} sizes="48px" />
                </span>
                <span className="text-left">
                  <span className="block font-medium text-brand-deep">{current?.name || ""}</span>
                  <span className="block text-sm text-muted-foreground">{current?.place || ""}</span>
                </span>
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>

        <div className="mt-10 flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous review"
            className="rounded-full border border-brand-deep/30 p-3 text-brand-deep transition-colors hover:bg-brand-deep hover:text-white"
          >
            <ChevronLeft className="size-5" />
          </button>
          <div className="flex gap-2">
            {TESTIMONIALS.map((t, i) => (
              <button
                key={t.name}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show review from ${t.name}`}
                aria-current={i === index}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === index ? "w-8 bg-brand-gold" : "w-1.5 bg-brand-deep/25"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next review"
            className="rounded-full border border-brand-deep/30 p-3 text-brand-deep transition-colors hover:bg-brand-deep hover:text-white"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
