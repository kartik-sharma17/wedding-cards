"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import { EASE } from "@/lib/motion";

type Props = { price: string; free: boolean };

export default function TemplateFaq({ price, free }: Props) {
  const [open, setOpen] = useState<number | null>(0);

  const faqs = [
    {
      q: "Is it really free to share?",
      a: "Yes. You can create your card and send the link to as many relatives as you like without paying anything.",
    },
    {
      q: "What do I pay for?",
      a: free
        ? "Nothing. This template is free, including the download."
        : `Only the download. A high-quality copy of this design costs ${price}. You can also add a Google Maps link, which appears on your card once you've paid.`,
    },
    {
      q: "Can I change my details after creating the card?",
      a: "Yes. Your card is saved as a draft, so you can update names, dates and venue before you share it.",
    },
    {
      q: "How long does it take?",
      a: "Most people finish in about three minutes. You'll answer questions in three short steps: the event, the hosts and the venue.",
    },
  ];

  return (
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-6">
        <SectionHeading eyebrow="Questions" title={"Good to know\nbefore you start"} />
        <ul className="mt-12 divide-y divide-border border-y border-border">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <li key={f.q}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-6 py-6 text-left focus-visible:outline-2 focus-visible:outline-brand-gold"
                >
                  <span className="font-serif text-2xl text-brand-deep">{f.q}</span>
                  <Plus className={`size-5 shrink-0 text-brand-gold transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <p className="pb-6 leading-relaxed text-muted-foreground">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
