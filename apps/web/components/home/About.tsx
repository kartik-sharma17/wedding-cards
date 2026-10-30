"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import SafeImage from "@/components/ui/SafeImage";
import SectionHeading from "@/components/ui/SectionHeading";
import BrandButton from "@/components/ui/BrandButton";
import Reveal from "@/components/ui/Reveal";
import { IMAGES } from "@/lib/constants";
import { EASE } from "@/lib/motion";

export default function About() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const smallY = useTransform(scrollYProgress, [0, 1], ["60px", "-90px"]);

  return (
    <section id="about" ref={ref} className="scroll-mt-20 bg-brand-cream py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-8">
            <SectionHeading
              align="left"
              eyebrow="About us"
              title={"Where your celebration\nbecomes art"}
            />
          </div>
          <Reveal className="flex flex-col items-start gap-6 lg:col-span-3 lg:col-start-10 lg:pt-14" delay={0.2}>
            <p className="leading-relaxed text-brand-deep/80">
              We are your designers, your translators and the calm in the middle of the guest list.
            </p>
            <BrandButton href="/register" variant="outline" arrow>
              Learn more
            </BrandButton>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-12">
          <motion.div
            style={{ y: smallY }}
            className="relative hidden aspect-[3/4] self-end lg:col-span-3 lg:block"
          >
            <SafeImage src={IMAGES.aboutSmall} alt="Wedding rings resting on a floral arrangement" sizes="25vw" />
          </motion.div>

          <div className="flex flex-col gap-8 lg:col-span-7 lg:col-start-6">
            <motion.div
              className="relative aspect-[16/10] overflow-hidden"
              initial={{ clipPath: "inset(0 0 100% 0)" }}
              whileInView={{ clipPath: "inset(0 0 0% 0)" }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.4, ease: EASE }}
            >
              <SafeImage src={IMAGES.aboutLarge} alt="A couple laughing together outdoors" sizes="(min-width:1024px) 55vw, 100vw" />
            </motion.div>
            <Reveal>
              <p className="max-w-xl font-serif text-2xl leading-relaxed text-brand-deep md:text-3xl">
                Festa Cards started with a simple idea: a beautiful invitation should not take a week or a designer. Choose a design, add your details and send it to the whole family the same afternoon.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
