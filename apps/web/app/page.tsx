import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Lock, Share2, UploadCloud } from "lucide-react";

const FEATURES = [
  {
    icon: UploadCloud,
    title: "Upload in seconds",
    description:
      "Drag a file in and it's stored, versioned, and ready — no folders to fight with.",
  },
  {
    icon: Lock,
    title: "Private by default",
    description:
      "Every document starts locked to you. Make it public only when you choose to.",
  },
  {
    icon: Share2,
    title: "Share on your terms",
    description:
      "Generate a link that expires on your schedule — five minutes or a full hour.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <span className="font-display text-2xl tracking-tight">VAULT</span>
          <nav className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button>Get started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 md:pb-28 md:pt-24">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Document storage, stripped down
            </p>
            <h1 className="font-display text-5xl leading-[0.95] md:text-7xl">
              STORE IT.
              <br />
              SHARE IT.
              <br />
              CONTROL IT.
            </h1>
            <p className="mt-6 max-w-md text-base text-muted-foreground">
              Vault is a plain, fast place to keep your documents — upload
              instantly, decide who sees what, and hand out links that expire
              on your terms.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="group">
                  Create your vault
                  <ArrowUpRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">
                  Log in
                </Button>
              </Link>
            </div>
          </div>

          {/* Signature element: fanned document stack */}
          <div className="relative hidden h-[380px] md:block">
            <div className="absolute right-10 top-6 h-64 w-48 -rotate-6 rounded-md border border-border bg-secondary shadow-sm" />
            <div className="absolute right-24 top-16 h-64 w-48 rotate-3 rounded-md border border-border bg-white shadow-md" />
            <div className="absolute right-16 top-24 flex h-64 w-48 flex-col justify-between rounded-md border border-foreground bg-white p-5 shadow-xl">
              <div>
                <div className="mb-4 h-2 w-16 rounded-full bg-foreground" />
                <div className="space-y-2">
                  <div className="h-1.5 w-full rounded-full bg-muted" />
                  <div className="h-1.5 w-4/5 rounded-full bg-muted" />
                  <div className="h-1.5 w-full rounded-full bg-muted" />
                  <div className="h-1.5 w-3/5 rounded-full bg-muted" />
                </div>
              </div>
              <span className="inline-flex w-fit items-center rounded-full bg-destructive px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-destructive-foreground">
                Public
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="font-display mb-12 text-3xl md:text-4xl">
            EVERYTHING YOU NEED, NOTHING YOU DON&apos;T
          </h2>
          <div className="grid gap-10 md:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div key={title}>
                <Icon className="mb-4 h-6 w-6" strokeWidth={1.5} />
                <h3 className="mb-2 text-lg font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-foreground text-background">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-16 md:flex-row md:items-center">
          <h2 className="font-display text-3xl md:text-4xl">
            READY WHEN YOU ARE.
          </h2>
          <Link href="/signup">
            <Button
              size="lg"
              className="bg-background text-foreground hover:bg-background/90"
            >
              Create your vault
            </Button>
          </Link>
        </div>
      </section>

      <footer className="px-6 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Vault. All rights reserved.
      </footer>
    </div>
  );
}
