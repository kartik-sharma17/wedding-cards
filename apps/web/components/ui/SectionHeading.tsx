"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { EASE } from "../../lib/motion";

type Props = {
  eyebrow?: string;
  /** Use "\n" to break the title into lines; each line slides up from behind a mask. */
  title: string;
  description?: string;
  align?: "center" | "left";
  tone?: "dark" | "light";
  children?: ReactNode;
};

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  tone = "dark",
  children,
}: Props) {
  const center = align === "center";
  const light = tone === "light";

  return (
    <div className={`flex flex-col gap-5 ${center ? "items-center text-center" : "items-start text-left"}`}>
      {eyebrow && (
        <span className={`text-xs tracking-[0.2em] uppercase ${light ? "text-brand-gold" : "text-brand-teal"}`}>
          {eyebrow}
        </span>
      )}

      <h2
        className={`font-serif text-4xl leading-[1.05] font-medium md:text-6xl ${light ? "text-white" : "text-brand-deep"}`}
      >
        {title.split("\n").map((line, i) => (
          <span key={line} className="block overflow-hidden pb-1">
            <motion.span
              className="block"
              initial={{ y: "110%" }}
              whileInView={{ y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 1, delay: i * 0.12, ease: EASE }}
            >
              {line}
            </motion.span>
          </span>
        ))}
      </h2>

      {description && (
        <motion.p
          className={`max-w-xl text-base leading-relaxed ${light ? "text-white/75" : "text-muted-foreground"}`}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          {description}
        </motion.p>
      )}

      {children}
    </div>
  );
}
