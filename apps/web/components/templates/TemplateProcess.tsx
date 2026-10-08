"use client";

import { motion } from "framer-motion";
import { Download, PenLine, Send } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import { EASE } from "@/lib/motion";

export default function TemplateProcess({ price, free }: { price: string; free: boolean }) {
  const steps = [
    { icon: PenLine, title: "Add your details", text: "Answer a few short questions about the event, the hosts and the venue." },
    { icon: Send, title: "Send it free", text: "Share a private link with your relatives on WhatsApp, SMS or email." },
    {
      icon: Download,
      title: free ? "Download it" : "Download when ready",
      text: free ? "Save a high-quality copy whenever you like." : `Happy with it? Download a high-quality copy for ${price}.`,
    },
  ];

  return (
    <section className="bg-brand-deep py-20 text-white md:py-28">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <SectionHeading tone="light" eyebrow="How it works" title={"Three steps from\nthis design to your guests"} />
        <ol className="mt-14 grid gap-10 md:grid-cols-3">
          {steps.map((s, i) => (
            <motion.li
              key={s.title}
              className="flex flex-col gap-4"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.9, delay: i * 0.15, ease: EASE }}
            >
              <span className="flex size-14 items-center justify-center rounded-full border border-brand-gold text-brand-gold">
                <s.icon className="size-6" strokeWidth={1.5} />
              </span>
              <h3 className="font-serif text-2xl">
                <span className="mr-2 text-brand-gold">{i + 1}.</span>
                {s.title}
              </h3>
              <p className="max-w-xs leading-relaxed text-white/70">{s.text}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
