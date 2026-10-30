import type { Metadata } from "next";
import Link from "next/link";
import {SITE} from '@/lib/Siteconfig'

export const metadata: Metadata = {
  title: `Privacy policy – ${SITE.name}`,
  description: `How ${SITE.name} collects, uses and protects your information, and how payments and support work.`,
};

function P({ children }: { children: React.ReactNode }) {
  return <p className="leading-relaxed text-foreground/80">{children}</p>;
}

function UL({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 leading-relaxed text-foreground/80">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

type Section = { id: string; title: string; body: React.ReactNode };

const SECTIONS: Section[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    body: (
      <P>
        {SITE.name} ({SITE.legalName}) lets you create and share digital invitation cards for weddings, receptions,
        anniversaries, engagements, birthdays and baby showers. This policy explains what information we collect when
        you use our website and apps, how we use it, and the choices you have.
      </P>
    ),
  },
  {
    id: "information-we-collect",
    title: "Information we collect",
    body: (
      <>
        <P>We collect only what we need to run the service:</P>
        <UL
          items={[
            <>
              <strong>Account details:</strong> your name, email address, password and, if you add them, your phone
              number and profile picture.
            </>,
            <>
              <strong>Card content:</strong> everything you enter into a card, such as names, event dates, venues,
              messages, dress code, RSVP contact details and photos.
            </>,
            <>
              <strong>Payment records:</strong> the amount, currency, status and reference numbers of your payments.
              Card, UPI and bank details are entered with our payment partner and are never stored by us.
            </>,
            <>
              <strong>Usage information:</strong> how many times your card is viewed, how many RSVPs it receives, and
              basic technical data such as browser type and IP address in our server logs.
            </>,
            <>
              <strong>Messages to us:</strong> anything you send through the contact form or by email.
            </>,
          ]}
        />
      </>
    ),
  },
  {
    id: "how-we-use-it",
    title: "How we use your information",
    body: (
      <UL
        items={[
          "To create your account, build your cards and keep you signed in.",
          "To process payments and unlock your card once payment is complete.",
          "To show you view and RSVP counts on your dashboard.",
          "To reply to your questions and resolve problems.",
          "To send service emails, such as account verification.",
          "To keep the service secure and prevent misuse.",
        ]}
      />
    ),
  },
  {
    id: "your-cards",
    title: "Your cards and who can see them",
    body: (
      <>
        <P>
          Drafts are visible only to you. When you publish a card, it gets a public link, and anyone who has that link
          can view the card and the details on it. Share the link only with the people you want to invite, and avoid
          putting sensitive personal information on a card.
        </P>
        <P>You can edit or delete a card at any time from your dashboard.</P>
      </>
    ),
  },
  {
    id: "sharing",
    title: "Who we share information with",
    body: (
      <>
        <P>We do not sell your personal information. We share it only with:</P>
        <UL
          items={[
            "Payment partners (such as Razorpay or Stripe), to process your payment.",
            "Service providers who host our website, store files and send emails for us, and who may only use your data to provide those services.",
            "Authorities, when the law requires it or when we need to protect our users or our rights.",
          ]}
        />
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and similar technologies",
    body: (
      <P>
        We use a cookie to keep you signed in to your account. If we add analytics or other tracking in the future, we
        will update this policy and, where required, ask for your consent first.
      </P>
    ),
  },
  {
    id: "payments",
    title: "Payments, refunds and support",
    body: (
      <>
        <P>
          Payments on {SITE.name} are processed securely by our payment partner. Once a payment is complete, it is
          final: <strong>we do not offer refunds</strong>.
        </P>
        <P>
          We do, however, stand behind the service. If something goes wrong after you pay, for example you were charged
          but your card is not unlocked, a download fails, or a detail on your card needs fixing, contact us and we will
          work with you to resolve it. The quickest way is the{" "}
          <Link href="/contact" className="text-brand-deep underline">
            contact form
          </Link>{" "}
          (choose “Payment or billing” and include your card name) or email{" "}
          <a href={`mailto:${SITE.supportEmail}`} className="text-brand-deep underline">
            {SITE.supportEmail}
          </a>
          . We reply within {SITE.responseTime}.
        </P>
      </>
    ),
  },
  {
    id: "retention",
    title: "How long we keep your information",
    body: (
      <P>
        We keep your account and cards for as long as your account is active. If you delete a card, we remove it from
        our systems. If you ask us to delete your account, we will delete your personal information, except records we
        are legally required to keep, such as payment and tax records.
      </P>
    ),
  },
  {
    id: "security",
    title: "Security",
    body: (
      <P>
        We use reasonable technical and organisational measures to protect your information, including restricting who
        can access it and never storing passwords in plain text. No online service can promise perfect security, so
        please use a strong, unique password.
      </P>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    body: (
      <>
        <P>Under applicable Indian data protection law, you can ask us to:</P>
        <UL
          items={[
            "Tell you what personal information we hold about you.",
            "Correct anything that is inaccurate or out of date.",
            "Delete your information or your account.",
            "Stop using your information where you have given consent and now withdraw it.",
          ]}
        />
        <P>
          To make a request or raise a concern, write to us at{" "}
          <a href={`mailto:${SITE.supportEmail}`} className="text-brand-deep underline">
            {SITE.supportEmail}
          </a>
          . We will respond within a reasonable time.
        </P>
      </>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <P>
        {SITE.name} is meant for adults. We do not knowingly collect personal information from anyone under 18 for
        their own account. A card can mention a child, such as a birthday or baby shower, because the adult creating it
        chooses to include that.
      </P>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <P>
        We may update this policy from time to time. When we make an important change, we will update the date at the
        top of this page and, where appropriate, let you know by email or in the app.
      </P>
    ),
  },
  {
    id: "contact",
    title: "Contact us",
    body: (
      <P>
        Questions about this policy? Reach us through the{" "}
        <Link href="/contact" className="text-brand-deep underline">
          contact page
        </Link>{" "}
        or at{" "}
        <a href={`mailto:${SITE.supportEmail}`} className="text-brand-deep underline">
          {SITE.supportEmail}
        </a>
        .{SITE.address && ` Our address is ${SITE.address}.`}
      </P>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <section className="bg-white pt-28 pb-24 md:pt-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <header className="mb-12 max-w-3xl">
          <h1 className="font-serif text-4xl text-brand-deep md:text-5xl">Privacy policy</h1>
          <p className="mt-4 text-sm text-muted-foreground">Last updated {SITE.policyUpdated}</p>
        </header>

        <div className="grid gap-12 lg:grid-cols-4 lg:gap-16">
          {/* Contents */}
          <nav aria-label="Contents" className="hidden lg:block">
            <ul className="sticky top-28 flex flex-col gap-3 border-l border-border pl-5 text-sm">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-muted-foreground hover:text-brand-deep">
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Content */}
          <div className="flex max-w-3xl flex-col gap-12 lg:col-span-3">
            {SECTIONS.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-28 flex flex-col gap-4">
                <h2 className="font-serif text-2xl text-brand-deep md:text-3xl">{s.title}</h2>
                {s.body}
              </section>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}