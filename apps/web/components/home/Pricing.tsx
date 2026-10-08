"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import BrandButton from "@/components/ui/BrandButton";
import { PLANS } from "@/lib/constants";
import { EASE } from "@/lib/motion";

export default function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 bg-white py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHeading
          eyebrow="Pricing"
          title={"Share for free.\nPay only to download."}
          description="Create and send as many cards as you like. A download starts at ₹249."
        />

        <div className="mt-16 grid items-stretch gap-6 lg:grid-cols-3">
          {PLANS.map((plan, i) => (
            <motion.article
              key={plan.name}
              className={`flex flex-col gap-8 p-9 ${
                plan.highlight
                  ? "bg-brand-deep text-white shadow-2xl shadow-brand-deep/25 lg:-my-4 lg:py-13"
                  : "border border-border bg-brand-cream text-brand-deep"
              }`}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.9, delay: i * 0.15, ease: EASE }}
            >
              <header className="flex flex-col gap-3">
                <h3 className={`font-serif text-2xl ${plan.highlight ? "text-brand-gold" : ""}`}>{plan.name}</h3>
                <p className="font-serif text-6xl leading-none">{plan.price}</p>
                <p className={`text-sm ${plan.highlight ? "text-white/70" : "text-muted-foreground"}`}>
                  {plan.caption}
                </p>
              </header>

              <ul className="flex flex-1 flex-col gap-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm leading-relaxed">
                    <Check className="mt-0.5 size-4 shrink-0 text-brand-gold" />
                    {f}
                  </li>
                ))}
              </ul>

              <BrandButton href="/register" variant={plan.highlight ? "gold" : "deep"} className="w-full">
                {plan.cta}
              </BrandButton>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
