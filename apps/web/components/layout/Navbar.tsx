"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Logo from "@/components/ui/Logo";
import BrandButton from "@/components/ui/BrandButton";
import { NAV_LEFT, NAV_RIGHT } from "@/lib/constants";
import { clearToken, getToken } from "@/lib/auth";
import { EASE } from "@/lib/motion";

const DASHBOARD_PATH = "/dashboard";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Check on every page change, not just once: the navbar stays mounted while someone logs in or
  // verifies their email, so a one-time check would keep showing "Log in" until a full reload.
  useEffect(() => setLoggedIn(Boolean(getToken())), [pathname]);

  // The mobile menu closes whenever the page changes.
  useEffect(() => setOpen(false), [pathname]);

  // The home hero is dark, so the bar starts transparent there. Every other page needs it solid.
  const solid = scrolled || open || pathname !== "/";
  const linkClass = "text-sm tracking-wide transition-opacity hover:opacity-70";

  // On the dashboard the "Dashboard" button would point at the page you are already on, so it becomes "Log out".
  const onDashboard = pathname === DASHBOARD_PATH || pathname.startsWith(`${DASHBOARD_PATH}/`);

  const logout = () => {
    clearToken();
    // A full page load clears everything held in memory (including the previous user's cached data).
    window.location.assign("/");
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

        {/* Right (large screens). The mobile menu below offers the same options. */}
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
              onDashboard ? (
                <BrandButton onClick={logout} variant="gold" className="!px-5 !py-2.5">
                  Log out
                </BrandButton>
              ) : (
                <BrandButton href={DASHBOARD_PATH} variant="gold" className="!px-5 !py-2.5">
                  Dashboard
                </BrandButton>
              )
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
        </div>
      </nav>

      {/* Mobile menu: the same links and the same account options as the large-screen bar */}
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
              <li className="flex flex-col gap-3 pt-6">
                {loggedIn ? (
                  onDashboard ? (
                    <BrandButton onClick={logout} variant="outline" className="w-full">
                      Log out
                    </BrandButton>
                  ) : (
                    <BrandButton href={DASHBOARD_PATH} variant="deep" className="w-full">
                      Dashboard
                    </BrandButton>
                  )
                ) : (
                  <>
                    <BrandButton href="/login" variant="outline" className="w-full">
                      Log in
                    </BrandButton>
                    <BrandButton href="/register" variant="deep" className="w-full">
                      Get started
                    </BrandButton>
                  </>
                )}
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}