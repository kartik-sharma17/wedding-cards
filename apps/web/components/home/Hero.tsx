"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import SafeImage from "@/components/ui/SafeImage";
import BrandButton from "@/components/ui/BrandButton";
import { IMAGES } from "@/lib/constants";
import { EASE } from "@/lib/motion";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.18, delayChildren: 0.7 } },
};
const item = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 1, ease: EASE } },
};

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);

  return (
    <section ref={ref} className="relative h-svh min-h-[640px] overflow-hidden bg-brand-deep text-white">
      <motion.div style={{ y: imageY }} className="absolute inset-x-0 -top-[8%] h-[116%]">
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.18 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.6, ease: EASE }}
        >
          <SafeImage src={IMAGES.hero} alt="A couple sharing a quiet moment on their wedding day" priority />
        </motion.div>
      </motion.div>

      {/* Deep-teal wash so type stays readable */}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-deep/95 via-brand-deep/40 to-brand-deep/50" />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-deep/70 via-transparent to-transparent" />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="absolute bottom-0 left-0 flex max-w-3xl flex-col gap-6 px-6 pb-16 md:px-12 md:pb-20 lg:px-20"
      >
        <motion.span variants={item} className="text-xs tracking-[0.2em] text-brand-gold uppercase">
          Festa Cards is
        </motion.span>
        <motion.h1 variants={item} className="font-serif text-3xl leading-[1.15] md:text-5xl">
          Invitation cards with elegance, soul and intention. Made in minutes, sent free to every relative.
        </motion.h1>
        <motion.div variants={item} className="flex flex-wrap items-center gap-4 pt-2">
          <BrandButton href="/register" variant="gold" arrow>
            Create your card
          </BrandButton>
          <BrandButton href="/#pricing" variant="outlineLight">
            Download from ₹249
          </BrandButton>
        </motion.div>
      </motion.div>
    </section>
  );
}
