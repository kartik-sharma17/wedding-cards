import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { FOOTER_LINKS } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="bg-brand-deep text-white">
      <div className="mx-auto grid max-w-7xl gap-14 px-6 py-20 lg:grid-cols-[1.4fr_2fr] lg:px-10">
        <div className="flex flex-col gap-5">
          <Logo className="text-6xl text-brand-gold" />
          <p className="max-w-sm leading-relaxed text-white/70">
            Beautiful invitation cards, made in minutes. Send them free to everyone you love, and download when you want to keep them.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          {FOOTER_LINKS.map((group) => (
            <div key={group.heading}>
              <h3 className="mb-5 font-serif text-xl text-brand-gold">{group.heading}</h3>
              <ul className="flex flex-col gap-3">
                {group.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-white/70 transition-colors hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-6 text-xs text-white/50 sm:flex-row sm:justify-between lg:px-10">
          <p>© {new Date().getFullYear()} Shaan. All rights reserved.</p>
          <p>Made with care in India</p>
        </div>
      </div>
    </footer>
  );
}
