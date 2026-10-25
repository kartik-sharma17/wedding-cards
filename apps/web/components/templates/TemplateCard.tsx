"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Video } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { CATEGORY_LABELS, formatPrice, getTemplateImages, isFreeTemplate } from "@/lib/templates";
import { ROUTES } from "@/lib/routes";
import { EASE } from "@/lib/motion";
import type { TemplateSummary } from "@/redux/service/templateService";

export default function TemplateCard({ template, index = 0 }: { template: TemplateSummary; index?: number }) {
  const [main, hover] = getTemplateImages(template);
  const free = isFreeTemplate(template);

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.8, delay: (index % 4) * 0.08, ease: EASE }}
    >
      <Link
        href={ROUTES.template(template.slug)}
        className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-gold"
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-brand-cream">
          {main ? (
            <>
              <SafeImage
                src={main}
                alt={`${template.templateName} invitation preview`}
                sizes="(min-width:1280px) 22vw, (min-width:768px) 30vw, 48vw"
                unoptimized
                className="transition-transform duration-[1200ms] ease-out group-hover:scale-105"
              />
              {hover && (
                <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <SafeImage src={hover} alt="" sizes="(min-width:1280px) 22vw, 48vw" unoptimized />
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-teal to-brand-deep p-6 text-center font-script text-4xl text-brand-gold">
              {template.templateName}
            </div>
          )}

          <span
            className={`absolute top-3 right-3 px-3 py-1 text-xs font-medium ${
              free ? "bg-brand-gold text-brand-deep" : "bg-white/95 text-brand-deep"
            }`}
          >
            {formatPrice(template)}
          </span>
          {template.templateType === "video" && (
            <span className="absolute top-3 left-3 flex items-center gap-1.5 bg-brand-deep/85 px-3 py-1 text-xs text-white">
              <Video className="size-3.5" /> Video
            </span>
          )}
        </div>

        <div className="pt-4">
          <p className="text-xs tracking-wide text-brand-teal">{CATEGORY_LABELS[template.category]}</p>
          <h3 className="mt-1 font-serif text-2xl leading-tight text-brand-deep">{template.templateName}</h3>
          <span className="mt-2 inline-block border-b border-transparent text-sm text-brand-deep/70 transition-colors group-hover:border-brand-gold group-hover:text-brand-deep">
            Preview design
          </span>
        </div>
      </Link>
    </motion.article>
  );
}
