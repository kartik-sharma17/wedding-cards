"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useGetMeQuery } from "@/redux/service/authService";

function Screen({ title, text, children }: { title: string; text?: string; children?: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-brand-cream px-6 text-center">
      <h1 className="font-serif text-4xl text-brand-deep">{title}</h1>
      {text && <p className="max-w-md text-muted-foreground">{text}</p>}
      <div className="flex gap-3 pt-2">{children}</div>
    </div>
  );
}

const NAV_ITEMS = [
  { href: "/admin/templates", label: "Templates" },
  { href: "/admin/coupons", label: "Coupons" },
];

const linkBtn = "border border-brand-deep px-6 py-3 text-sm text-brand-deep transition-colors hover:bg-brand-deep hover:text-white";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => setHasToken(Boolean(Cookies.get("token"))), []);

  // Always re-check the role on entry; the API enforces it too.
  const { data, isLoading, isError, error, refetch } = useGetMeQuery(undefined, {
    skip: !hasToken,
    refetchOnMountOrArgChange: true,
  });
  const status = (error as { status?: unknown } | undefined)?.status;
  const sessionExpired = isError && status === 401;

  useEffect(() => {
    if (hasToken === false || sessionExpired) {
      Cookies.remove("token");
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [hasToken, sessionExpired, router, pathname]);

  if (hasToken === null || hasToken === false || isLoading || sessionExpired) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-brand-cream" aria-busy>
        <Loader2 className="size-8 animate-spin text-brand-teal" />
      </div>
    );
  }

  if (isError) {
    return (
      <Screen title="We couldn't check your access" text="Check your connection and try again.">
        <button type="button" onClick={() => refetch()} className="bg-brand-deep px-6 py-3 text-sm text-white hover:bg-brand-teal">
          Try again
        </button>
      </Screen>
    );
  }

  if (data?.data.role !== "admin") {
    return (
      <Screen title="Admins only" text="Your account doesn't have access to this area.">
        <Link href="/" className={linkBtn}>
          Back to the site
        </Link>
      </Screen>
    );
  }

  const logout = () => {
    Cookies.remove("token");
    router.replace("/login");
  };

  return (
    <div className="min-h-svh bg-brand-cream">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-6 lg:px-10">
          <Link href="/admin/templates" className="flex items-baseline gap-2">
            <span className="font-script text-3xl text-brand-deep">Festa</span>
            <span className="bg-brand-gold/25 px-2 py-0.5 text-xs tracking-wide text-brand-deep uppercase">Admin</span>
          </Link>
          <nav aria-label="Admin" className="flex flex-1 gap-6">
            {NAV_ITEMS.map(({ href, label }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`border-b-2 py-5 text-sm ${active ? "border-brand-gold text-brand-deep" : "border-transparent text-brand-deep/60 hover:text-brand-deep"}`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
          <span className="hidden text-sm text-muted-foreground sm:block">{data.data.name}</span>
          <Link href="/" className="text-sm text-brand-deep/70 hover:text-brand-deep">
            View site
          </Link>
          <button type="button" onClick={logout} className="text-sm text-brand-deep/70 hover:text-brand-deep">
            Log out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-10">{children}</main>
    </div>
  );
}