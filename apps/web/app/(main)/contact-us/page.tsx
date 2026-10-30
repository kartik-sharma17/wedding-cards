import type { Metadata } from "next";
import Link from "next/link";
import {SITE} from '@/lib/Siteconfig'
import ContactForm from "@/components/contact/Contactform";

export const metadata: Metadata = {
  title: `Contact us – ${SITE.name}`,
  description: "Questions about your invitation card or a payment? Send us a message and we’ll help.",
};

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-1 text-brand-deep">{children}</div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <section className="bg-white pt-28 pb-24 md:pt-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-5 lg:gap-20">
          {/* Left: details */}
          <div className="lg:col-span-2">
            <h1 className="font-serif text-4xl text-brand-deep md:text-5xl">Get in touch</h1>
            <p className="mt-4 text-muted-foreground">
              Have a question about a design, your card or a payment? Send us a message and a real person will get back
              to you within {SITE.responseTime}.
            </p>

            <div className="mt-10 flex flex-col gap-6">
              <Detail label="Email">
                <a href={`mailto:${SITE.supportEmail}`} className="hover:underline">
                  {SITE.supportEmail}
                </a>
              </Detail>
              {SITE.supportPhone && (
                <Detail label="Phone">
                  <a href={`tel:${SITE.supportPhone.replace(/\s/g, "")}`} className="hover:underline">
                    {SITE.supportPhone}
                  </a>
                </Detail>
              )}
              <Detail label="Support hours">{SITE.supportHours}</Detail>
              {SITE.address && <Detail label="Address">{SITE.address}</Detail>}
            </div>

            <div className="mt-12 bg-brand-cream p-6">
              <h2 className="font-serif text-xl text-brand-deep">Paid for a card and something went wrong?</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Payments are final and we don’t offer refunds, but we will always work with you to fix the problem.
                Choose “Payment or billing” in the form and include your card name, and we’ll take it from there.{" "}
                <Link href="/privacy-policy#payments" className="text-brand-deep underline">
                  Read more
                </Link>
              </p>
            </div>
          </div>

          {/* Right: form */}
          <div className="lg:col-span-3">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}