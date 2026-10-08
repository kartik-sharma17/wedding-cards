"use client";

import { motion } from "framer-motion";
import { Check, Clock, Video } from "lucide-react";
import BrandButton from "@/components/ui/BrandButton";
import { CATEGORY_FIELDS, CATEGORY_LABELS, formatPrice, isFreeTemplate } from "@/lib/templates";
import { EASE } from "@/lib/motion";
import type { TemplateSummary } from "@/services/templateService";

type Props = { template: TemplateSummary; onCreate: () => void };

export default function TemplateInfo({ template, onCreate }: Props) {
  const free = isFreeTemplate(template);
  const price = formatPrice(template);

  const included = [
    "Add your own names, date and venue",
    "Share a private link with relatives, free",
    free ? "Download included at no charge" : "High-quality download after payment",
    ...(free ? [] : ["Google Maps link on your card after payment"]),
  ];

  return (
    <motion.div
      className="flex flex-col gap-8"
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
    >
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="bg-brand-cream px-3 py-1 text-brand-teal">{CATEGORY_LABELS[template.category]}</span>
          <span className="flex items-center gap-1.5 bg-brand-cream px-3 py-1 text-brand-teal">
            {template.templateType === "video" && <Video className="size-3.5" />}
            {template.templateType === "video" ? "Video invitation" : "Card"}
          </span>
        </div>
        <h1 className="font-serif text-5xl leading-[1.05] text-brand-deep md:text-6xl">{template.templateName}</h1>
      </header>

      <div className="flex flex-col gap-1 border-y border-border py-6">
        <p className="font-serif text-5xl leading-none text-brand-deep">{price}</p>
        <p className="text-sm text-muted-foreground">
          {free ? "Free template" : "to download. Creating and sharing online is free."}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <BrandButton onClick={onCreate} variant="deep" arrow className="w-full">
          Create your own card
        </BrandButton>
        <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Clock className="size-4" /> Takes about 3 minutes
        </p>
      </div>

      <section aria-labelledby="included-heading">
        <h2 id="included-heading" className="mb-4 font-serif text-2xl text-brand-deep">
          What&apos;s included
        </h2>
        <ul className="flex flex-col gap-3">
          {included.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-brand-deep/85">
              <Check className="mt-0.5 size-4 shrink-0 text-brand-gold" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="personalise-heading">
        <h2 id="personalise-heading" className="mb-4 font-serif text-2xl text-brand-deep">
          What you&apos;ll personalise
        </h2>
        <ul className="flex flex-wrap gap-2">
          {CATEGORY_FIELDS[template.category].map((f) => (
            <li key={f} className="border border-brand-deep/15 px-3 py-1.5 text-sm text-brand-deep/80">
              {f}
            </li>
          ))}
        </ul>
      </section>
    </motion.div>
  );
}
