"use client";

import { motion } from "framer-motion";
import SafeImage from "@/components/ui/SafeImage";
import SectionHeading from "@/components/ui/SectionHeading";
import BrandButton from "@/components/ui/BrandButton";
import { GALLERY } from "@/lib/constants";
import { EASE } from "@/lib/motion";

export default function Gallery() {
  return (
    <section id="templates" className="scroll-mt-20 bg-brand-cream py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHeading
          eyebrow="Templates"
          title={"Designs ready for your\nnext celebration"}
          description="A glimpse of the styles you can start from. Every one is fully editable."
        >
          <BrandButton href="/templates" variant="deep">
            Browse all templates
          </BrandButton>
        </SectionHeading>

        <div className="mt-16 columns-2 gap-3 md:columns-3 md:gap-4 lg:columns-4">
          {GALLERY.map((tile, i) => (
            <motion.figure
              key={tile.src + i}
              className="group relative mb-3 overflow-hidden break-inside-avoid md:mb-4"
              initial={{ opacity: 0, scale: 0.94 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.9, delay: (i % 4) * 0.1, ease: EASE }}
            >
              <div className={`relative w-full ${tile.ratio}`}>
                <SafeImage
                  src={tile.src}
                  alt={tile.label}
                  sizes="(min-width:1024px) 25vw, (min-width:768px) 33vw, 50vw"
                  className="transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                />
              </div>
              <figcaption className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-brand-deep/90 to-transparent p-4 font-serif text-lg text-white transition-transform duration-500 group-hover:translate-y-0">
                {tile.label}
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
