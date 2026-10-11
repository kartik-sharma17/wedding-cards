"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import SafeImage from "@/components/ui/SafeImage";
import SectionHeading from "@/components/ui/SectionHeading";
import BrandButton from "@/components/ui/BrandButton";
import { EASE } from "@/lib/motion";
import {
  CATEGORY_LABELS,
  formatPrice,
  getTemplateImages,
  useGetTemplatesQuery,
} from "@/redux/service/templateService";

const TILE_COUNT = 8;

export default function Gallery() {
  const { data, isLoading, isError, refetch } = useGetTemplatesQuery({ limit: TILE_COUNT });
  const templates = data?.data?.items ?? [];

  return (
    <section id="templates" className="scroll-mt-20 bg-brand-cream py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHeading
          eyebrow="Templates"
          title={"Designs ready for your\nnext celebration"}
          description="A glimpse of the styles you can start from. Every one is fully editable."
        >
          <BrandButton href="/template" variant="deep">
            Browse all templates
          </BrandButton>
        </SectionHeading>

        {isLoading && (
          <div className="mt-16 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4" aria-busy="true">
            {Array.from({ length: TILE_COUNT }, (_, i) => (
              <div key={i} className="aspect-[5/7] animate-pulse bg-brand-deep/10" />
            ))}
          </div>
        )}

        {isError && !isLoading && (
          <div role="alert" className="mt-16 text-center">
            <p className="font-serif text-xl text-brand-deep">We couldn&apos;t load the templates.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 rounded-full border border-brand-deep/40 px-5 py-2 text-sm text-brand-deep transition hover:bg-brand-deep hover:text-white"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !isError && templates.length === 0 && (
          <p className="mt-16 text-center font-serif text-xl text-brand-deep">New templates are coming soon.</p>
        )}

        {templates.length > 0 && (
          <div className="mt-16 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {templates.map((tpl, i) => (
              <motion.div
                key={tpl.id}
                initial={{ opacity: 0, scale: 0.94 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.9, delay: (i % 4) * 0.1, ease: EASE }}
              >
                <Link href={`/template/${tpl.slug}`} className="group relative block overflow-hidden">
                  <figure className="relative m-0">
                    <div className="relative aspect-[5/7] w-full">
                      <SafeImage
                        src={getTemplateImages(tpl)[0] ?? ""}
                        alt={tpl.templateName}
                        sizes="(min-width:1024px) 25vw, (min-width:768px) 33vw, 50vw"
                        className="transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                      />
                    </div>
                    <figcaption className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-brand-deep/90 to-transparent p-4 text-white transition-transform duration-500 group-hover:translate-y-0 group-focus-visible:translate-y-0">
                      <span className="block font-serif text-lg">{tpl.templateName}</span>
                      <span className="block text-xs tracking-wide opacity-80">
                        {CATEGORY_LABELS[tpl.category]} · {formatPrice(tpl)}
                      </span>
                    </figcaption>
                  </figure>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}