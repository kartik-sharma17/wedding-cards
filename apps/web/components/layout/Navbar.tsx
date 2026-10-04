"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Logo from "../ui/Logo";
import BrandButton from "../ui/BrandButton";
import { NAV_LEFT, NAV_RIGHT } from "../../lib/constants";
import { clearToken, getToken } from "../../lib/auth";
import { EASE } from "../../lib/motion";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setLoggedIn(Boolean(getToken())), []);

  const solid = scrolled || open;
  const linkClass = "text-sm tracking-wide transition-opacity hover:opacity-70";

  const logout = () => {
    clearToken();
    setLoggedIn(false);
    setOpen(false);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        solid ? "bg-brand-cream/95 text-brand-deep shadow-[0_1px_0_rgba(12,39,42,0.08)] backdrop-blur-md" : "text-white"
      }`}
    >
      <nav className="mx-auto grid h-20 max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-6 lg:px-10">
        {/* Left */}
        <div className="flex items-center">
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="-ml-2 p-2 lg:hidden"
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
          <ul className="hidden items-center gap-10 lg:flex">
            {NAV_LEFT.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={linkClass}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Center */}
        <Logo />

        {/* Right */}
        <div className="flex items-center justify-end gap-8">
          <ul className="hidden items-center gap-8 lg:flex">
            {NAV_RIGHT.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={linkClass}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="hidden items-center gap-6 lg:flex">
            {loggedIn ? (
              <button type="button" onClick={logout} className={linkClass}>
                Log out
              </button>
            ) : (
              <>
                <Link href="/login" className={linkClass}>
                  Log in
                </Link>
                <BrandButton href="/register" variant="gold" className="!px-5 !py-2.5">
                  Get started
                </BrandButton>
              </>
            )}
          </div>
          {!loggedIn && (
            <Link href="/login" className={`${linkClass} lg:hidden`}>
              Log in
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="overflow-hidden lg:hidden"
          >
            <ul className="flex flex-col gap-1 px-6 pt-2 pb-8">
              {[...NAV_LEFT, ...NAV_RIGHT].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block border-b border-brand-deep/10 py-4 font-serif text-2xl"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
              <li className="pt-6">
                {loggedIn ? (
                  <BrandButton onClick={logout} variant="outline" className="w-full">
                    Log out
                  </BrandButton>
                ) : (
                  <BrandButton href="/register" variant="deep" className="w-full">
                    Get started
                  </BrandButton>
                )}
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
