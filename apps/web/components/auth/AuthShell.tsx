"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import SafeImage from "@/components/ui/SafeImage";
import Logo from "@/components/ui/Logo";
import { IMAGES } from "@/lib/constants";
import { EASE } from "@/lib/motion";

type Props = {
  title: string;
  subtitle: string;
  footer: { text: string; linkLabel: string; href: string };
  children: ReactNode;
};

export default function AuthShell({ title, subtitle, footer, children }: Props) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Image panel */}
      <aside className="relative hidden overflow-hidden bg-brand-deep lg:block">
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.15 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.2, ease: EASE }}
        >
          <SafeImage src={IMAGES.authPanel} alt="A beautifully set wedding table" sizes="50vw" priority />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-deep via-brand-deep/50 to-brand-deep/30" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Logo className="text-5xl" />
          <p className="max-w-md font-serif text-4xl leading-tight">
            Every great celebration begins with a beautiful invitation.
          </p>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col bg-brand-cream px-6 py-10 sm:px-12">
        <Logo className="mb-10 text-brand-deep lg:hidden" />

        <motion.div
          className="m-auto w-full max-w-md"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
        >
          <h1 className="font-serif text-5xl text-brand-deep">{title}</h1>
          <p className="mt-3 mb-10 text-muted-foreground">{subtitle}</p>

          {children}

          <p className="mt-10 text-center text-sm text-muted-foreground">
            {footer.text}{" "}
            <Link href={footer.href} className="font-medium text-brand-deep underline underline-offset-4 hover:text-brand-teal">
              {footer.linkLabel}
            </Link>
          </p>
        </motion.div>
      </main>
    </div>
  );
}
