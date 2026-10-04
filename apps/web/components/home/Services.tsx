"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SafeImage from "@/components/ui/SafeImage";
import SectionHeading from "@/components/ui/SectionHeading";
import BrandButton from "@/components/ui/BrandButton";
import { SERVICES } from "@/lib/constants";
import { EASE } from "@/lib/motion";

export default function Services() {
  const [active, setActive] = useState(0);

  return (
    <section id="services" className="scroll-mt-20 bg-brand-cream pb-24 md:pb-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHeading
          eyebrow="Our services"
          title={"Born from a passion\nfor celebration & detail"}
          description="Invitation designs for every occasion, ready to personalise and send in a few minutes."
        />

        <div className="mt-20 grid items-center gap-14 lg:grid-cols-2">
          <ul className="flex flex-col">
            {SERVICES.map((service, i) => {
              const isActive = i === active;
              return (
                <li key={service.title}>
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    aria-expanded={isActive}
                    className="flex w-full items-start gap-5 py-5 text-left focus-visible:outline-2 focus-visible:outline-brand-gold"
                  >
                    <span className="w-8 pt-3 text-xs text-brand-deep/50">{String(i + 1).padStart(2, "0")}</span>
                    <motion.span
                      aria-hidden
                      className="mt-6 h-px bg-brand-deep"
                      animate={{ width: isActive ? 96 : 0, opacity: isActive ? 1 : 0 }}
                      transition={{ duration: 0.6, ease: EASE }}
                    />
                    <span className="flex-1">
                      <span
                        className={`block font-serif text-3xl transition-colors duration-300 md:text-4xl ${
                          isActive ? "text-brand-deep" : "text-brand-deep/55"
                        }`}
                      >
                        {service.title}
                      </span>
                      <AnimatePresence initial={false}>
                        {isActive && (
                          <motion.span
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.5, ease: EASE }}
                            className="block overflow-hidden"
                          >
                            <span className="block max-w-md pt-4 leading-relaxed text-brand-deep/80">
                              {service.description}
                            </span>
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-t-full lg:ml-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.08 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: EASE }}
              >
                <SafeImage src={SERVICES[active].image} alt={SERVICES[active].title} sizes="(min-width:1024px) 28rem, 90vw" />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-14 flex justify-center">
          <BrandButton href="/#templates" variant="deep">
            Browse templates
          </BrandButton>
        </div>
      </div>
    </section>
  );
}
