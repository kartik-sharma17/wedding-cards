import type { Metadata } from "next";
import type { TemplateCategory, TemplateDetail } from "@/redux/service/templateService";

/**
 * Everything the SEO code needs to know about the site.
 * You already have a SITE json: replace the values below with an import from it,
 * e.g. `export const SITE = { ...yourSite, url: ... }`. Nothing else in the SEO code hardcodes the name.
 */
export const SITE = {
  name: "Festa Cards",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  locale: "en_IN",
  twitterHandle: "", // for example "@festacards"; leave empty if you don't have one yet
  themeColor: "#0c272a",
  logoPath: "/icon-512.png",
  ogImagePath: "/og-image.png",
  startingPrice: 249,
  currency: "INR",
};

/* ------------------------------------------------------------------ */
/* Copy for each page                                                  */
/* Titles are written to stay under ~60 characters once " | Festa Cards" */
/* is added by the title template. Descriptions stay under 160.        */
/* ------------------------------------------------------------------ */
export const PAGES = {
  home: {
    // Used as an absolute title, so it carries the brand itself.
    title: "Festa Cards: Online Invitation Maker for Weddings & Events",
    description:
      "Make wedding, birthday, baby shower and anniversary invitation cards online in minutes. Share with family on WhatsApp for free. Download from just ₹249.",
    keywords: [
      "online invitation card maker",
      "wedding invitation card maker",
      "digital invitation card",
      "e-invite maker",
      "WhatsApp invitation card",
      "invitation card maker India",
      "shaadi card online",
    ],
  },
  templates: {
    title: "Invitation Card Templates for Every Occasion",
    description:
      "Browse wedding, reception, engagement, anniversary, birthday and baby shower invitation designs. Preview, personalise and share free online.",
    keywords: ["invitation card templates", "wedding card designs", "e-invite templates", "digital invitation templates India"],
  },
  login: { title: "Log in", description: "Log in to create, edit and share your invitation cards." },
  register: { title: "Create your account", description: "Create a free account and make your first invitation card in minutes." },
} as const;

/**
 * Copy for category landing pages (for example /wedding-invitations).
 * These pages don't exist yet; each one is the best chance to rank for its own search.
 */
export const CATEGORY_SEO: Record<
  TemplateCategory,
  { path: string; title: string; description: string; h1: string; intro: string; keywords: string[] }
> = {
  wedding: {
    path: "/wedding-invitations",
    title: "Online Wedding Invitation Card Maker",
    description:
      "Create a wedding invitation card online in minutes. Add both families, venues and every function, then share on WhatsApp free. Download from ₹249.",
    h1: "Wedding invitation cards, made online in minutes",
    intro:
      "Pick a design, add the couple's names, families, date and venue, and share your shaadi card with every relative on WhatsApp, email or a private link. Sharing is free. Download a high-quality copy when you're ready.",
    keywords: ["wedding invitation card maker online", "online wedding card", "digital wedding invitation", "wedding e-invite", "shaadi card online", "WhatsApp wedding invitation"],
  },
  reception: {
    path: "/reception-invitations",
    title: "Reception Invitation Cards Online",
    description:
      "Design an elegant wedding reception invitation online in minutes. Add the venue and timings, share free on WhatsApp, and download from ₹249.",
    h1: "Reception invitation cards for the evening to remember",
    intro:
      "Invite friends and family to your reception with a card that matches your wedding style. Add the date, venue and dress code, then send it to everyone at once.",
    keywords: ["reception invitation card", "wedding reception invitation online", "reception e-invite", "reception card maker"],
  },
  engagement: {
    path: "/engagement-invitations",
    title: "Engagement Invitation Cards Online",
    description:
      "Create an engagement or ring ceremony invitation card online in minutes. Share it free with family on WhatsApp and download from just ₹249.",
    h1: "Engagement invitation cards that announce your news beautifully",
    intro:
      "Share the happy news with a card made for your ring ceremony or roka. Add both families, the venue and the time, and send it in minutes.",
    keywords: ["engagement invitation card", "ring ceremony invitation online", "engagement e-invite", "roka invitation card"],
  },
  anniversary: {
    path: "/anniversary-invitations",
    title: "Anniversary Invitation Card Maker",
    description:
      "Make a 25th, 50th or any anniversary invitation card online in minutes. Share free on WhatsApp and download your design from ₹249.",
    h1: "Anniversary invitation cards for every milestone",
    intro:
      "From a first anniversary dinner to a golden jubilee, choose a design, add the years together and the venue, and invite everyone you love.",
    keywords: ["anniversary invitation card maker", "25th anniversary invitation", "50th anniversary invitation card", "anniversary e-invite"],
  },
  birthday: {
    path: "/birthday-invitations",
    title: "Birthday Invitation Card Maker Online",
    description:
      "Create a birthday invitation card online in minutes, from first birthdays to milestone parties. Share free on WhatsApp. Download from ₹249.",
    h1: "Birthday invitation cards, ready in minutes",
    intro:
      "Choose a theme, add the name, age and party details, and send the invite to every guest on WhatsApp. Sharing is free.",
    keywords: ["birthday invitation card maker", "online birthday invitation", "kids birthday invitation card", "birthday e-invite WhatsApp"],
  },
  baby_shower: {
    path: "/baby-shower-invitations",
    title: "Baby Shower Invitation Cards Online",
    description:
      "Design a baby shower or godh bharai invitation online in minutes. Pick a theme, add the details, share free on WhatsApp, and download from ₹249.",
    h1: "Baby shower invitation cards, sweet and simple",
    intro:
      "Celebrate the little one with a card in your favourite theme. Add the parents-to-be, date and venue, then share it with family in a few taps.",
    keywords: ["baby shower invitation card", "online baby shower invitation", "godh bharai invitation card", "baby shower e-invite"],
  },
};

const CATEGORY_LABEL: Record<TemplateCategory, string> = {
  wedding: "Wedding",
  reception: "Reception",
  anniversary: "Anniversary",
  engagement: "Engagement",
  birthday: "Birthday",
  baby_shower: "Baby Shower",
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
export const absoluteUrl = (path: string) => (path.startsWith("http") ? path : `${SITE.url}${path}`);

/** Cuts at a word boundary so descriptions never end mid-word. */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,.;:\s]+$/, "")}…`;
}

type PageMeta = {
  title: string;
  description: string;
  /** Path starting with "/". Becomes the canonical URL. */
  path: string;
  /** Use for the home page, whose title already contains the brand. */
  absoluteTitle?: boolean;
  keywords?: readonly string[];
  image?: { url: string; alt: string };
  noindex?: boolean;
};

/** One place that builds title, description, canonical, Open Graph and Twitter tags. */
export function pageMetadata({ title, description, path, absoluteTitle, keywords, image, noindex }: PageMeta): Metadata {
  const socialTitle = absoluteTitle ? title : `${title} | ${SITE.name}`;
  const images = [image ?? { url: SITE.ogImagePath, width: 1200, height: 630, alt: `${SITE.name}: online invitation cards` }];

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    keywords: keywords ? [...keywords] : undefined,
    alternates: { canonical: path },
    robots: noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      siteName: SITE.name,
      locale: SITE.locale,
      url: path,
      title: socialTitle,
      description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: images.map((i) => i.url),
      ...(SITE.twitterHandle ? { site: SITE.twitterHandle } : {}),
    },
  };
}

/** Title like "Royal Wedding Invitation Card" without repeating the category word. */
export function templateTitle(t: Pick<TemplateDetail, "templateName" | "category">): string {
  const label = CATEGORY_LABEL[t.category];
  return t.templateName.toLowerCase().includes(label.toLowerCase())
    ? `${t.templateName} Invitation Card`
    : `${t.templateName} ${label} Invitation Card`;
}

export const templatePath = (slug: string) => `/templates/${slug}`;

const isFree = (t: Pick<TemplateDetail, "price" | "is_free">) => t.is_free || t.price <= 0;

export function templateMetadata(t: TemplateDetail): Metadata {
  const label = CATEGORY_LABEL[t.category].toLowerCase();
  const price = isFree(t) ? "." : `, then download from ₹${t.price}.`;
  const description = truncate(
    `${templateTitle(t)}: add your details in minutes and share it free with relatives on WhatsApp${price}`,
    160,
  );
  const imageUrl = t.thumbnail_url ?? t.preview_images[0];

  return pageMetadata({
    title: templateTitle(t),
    description,
    path: templatePath(t.slug),
    keywords: [`${t.templateName} invitation card`, ...CATEGORY_SEO[t.category].keywords.slice(0, 3)],
    image: imageUrl ? { url: imageUrl, alt: `${t.templateName} ${label} invitation card preview` } : undefined,
    noindex: false,
  });
}

/* ------------------------------------------------------------------ */
/* Structured data (JSON-LD)                                           */
/* ------------------------------------------------------------------ */
const CONTEXT = "https://schema.org";

export function homeJsonLd() {
  const orgId = `${SITE.url}/#organization`;
  return {
    "@context": CONTEXT,
    "@graph": [
      { "@type": "Organization", "@id": orgId, name: SITE.name, url: SITE.url, logo: absoluteUrl(SITE.logoPath) },
      { "@type": "WebSite", "@id": `${SITE.url}/#website`, url: SITE.url, name: SITE.name, inLanguage: "en-IN", publisher: { "@id": orgId } },
      {
        "@type": "WebApplication",
        name: SITE.name,
        url: SITE.url,
        applicationCategory: "DesignApplication",
        operatingSystem: "Web",
        description: PAGES.home.description,
        // Creating and sharing is free; the price below is for downloads.
        offers: { "@type": "Offer", price: "0", priceCurrency: SITE.currency },
      },
    ],
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function templateJsonLd(t: TemplateDetail) {
  const images = [t.thumbnail_url, ...t.preview_images].filter((u): u is string => Boolean(u));
  return {
    "@context": CONTEXT,
    "@type": "Product",
    name: templateTitle(t),
    description: `${templateTitle(t)} template. Personalise it online and share it with your guests.`,
    sku: t.slug,
    category: `${CATEGORY_LABEL[t.category]} invitation cards`,
    ...(images.length ? { image: Array.from(new Set(images)) } : {}),
    brand: { "@type": "Brand", name: SITE.name },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(templatePath(t.slug)),
      price: String(isFree(t) ? 0 : t.price),
      priceCurrency: t.currency || SITE.currency,
      availability: "https://schema.org/InStock",
    },
  };
}
