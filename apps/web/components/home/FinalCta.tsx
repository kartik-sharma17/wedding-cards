"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import SafeImage from "@/components/ui/SafeImage";
import SectionHeading from "@/components/ui/SectionHeading";
import BrandButton from "@/components/ui/BrandButton";
import Reveal from "@/components/ui/Reveal";
import { IMAGES } from "@/lib/constants";

export default function FinalCta() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  return (
    <section ref={ref} className="relative overflow-hidden bg-brand-deep py-28 text-white md:py-40">
      <motion.div style={{ y }} className="absolute inset-x-0 -top-[12%] h-[124%]">
        <SafeImage src={IMAGES.ctaBackdrop} alt="" sizes="100vw" />
      </motion.div>
      <div className="absolute inset-0 bg-brand-deep/80" />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-10 px-6 text-center">
        <SectionHeading
          tone="light"
          title={"Your invitation is\nminutes away"}
          description="Start free, share with everyone you love, and download only when it's perfect."
        />
        <Reveal delay={0.3}>
          <BrandButton href="/register" variant="gold" arrow>
            Create your card
          </BrandButton>
        </Reveal>
      </div>
    </section>
  );
}
