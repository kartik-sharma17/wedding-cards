"use client";

import { motion } from "framer-motion";
import { Download, LayoutTemplate, PenLine, Send } from "lucide-react";
import SectionHeading from "../ui/SectionHeading";
import { STEPS } from "../../lib/constants";
import { EASE } from "../../lib/motion";

const ICONS = [LayoutTemplate, PenLine, Send, Download];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-brand-deep py-24 text-white md:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHeading
          tone="light"
          eyebrow="How it works"
          title={"From blank page\nto sent in minutes"}
          description="Four steps. The first three are free."
        />

        <ol className="relative mt-20 grid gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {/* Line that draws across the steps */}
          <motion.span
            aria-hidden
            className="absolute top-7 left-0 hidden h-px w-full origin-left bg-brand-gold/40 lg:block"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ duration: 1.8, ease: EASE }}
          />

          {STEPS.map((step, i) => {
            const Icon = ICONS[i];
            return (
              <motion.li
                key={step.title}
                className="relative flex flex-col gap-4"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.9, delay: 0.25 + i * 0.2, ease: EASE }}
              >
                <span className="relative z-10 flex size-14 items-center justify-center rounded-full border border-brand-gold bg-brand-deep text-brand-gold">
                  <Icon className="size-6" strokeWidth={1.5} />
                </span>
                <h3 className="font-serif text-2xl">
                  <span className="mr-2 text-brand-gold">{i + 1}.</span>
                  {step.title}
                </h3>
                <p className="max-w-xs leading-relaxed text-white/70">{step.text}</p>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
