/**
 * All copy, links and image URLs live here so sections stay presentational.
 * Swap the Unsplash IDs for your own images any time.
 */
const unsplash = (id: string, width = 1400) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;

export const IMAGES = {
  hero: unsplash("photo-1519741497674-611481863552", 2200),
  ctaBackdrop: unsplash("photo-1465495976277-4387d4b0b4c6", 2000),
  aboutLarge: unsplash("photo-1522673607200-164d1b6ce486", 1600),
  aboutSmall: unsplash("photo-1511285560929-80b456fea0bc", 700),
  authPanel: unsplash("photo-1519225421980-715cb0215aed", 1400),
};

export const NAV_LEFT = [
  { label: "Services", href: "/#services" },
  { label: "Templates", href: "/template" },
  { label: "About us", href: "/#about" },
];

export const NAV_RIGHT = [
  { label: "Pricing", href: "/#pricing" },
  { label: "Reviews", href: "/#testimonials" },
];

export const SERVICES = [
  {
    title: "Wedding invitations",
    description:
      "Cards for the ceremony, sangeet, mehendi and reception, with both families' names and every venue detail in place.",
    image: unsplash("photo-1537633552985-df8429e8048b", 1200),
  },
  {
    title: "Engagement & save the date",
    description: "Announce the news early with a card that sets the tone for everything that follows.",
    image: unsplash("photo-1606216794074-735e91aa2c92", 1200),
  },
  {
    title: "Birthday & anniversary",
    description: "Warm, playful designs for milestones of every size, from a dinner at home to a hall full of guests.",
    image: unsplash("photo-1469371670807-013ccf25f16a", 1200),
  },
  {
    title: "Festive & puja gatherings",
    description: "Housewarmings, naming ceremonies and festival get-togethers, with room for muhurat and rituals.",
    image: unsplash("photo-1583939003579-730e3918a45a", 1200),
  },
  {
    title: "Baby showers & more",
    description: "Baby showers, graduations and any other occasion worth bringing people together for.",
    image: unsplash("photo-1460978812857-470ed1c77af0", 1200),
  },
];

export const STEPS = [
  { title: "Pick a template", text: "Browse designs by occasion and choose the one that feels like you." },
  { title: "Add your details", text: "Names, date, venue and message. The card updates as you type." },
  { title: "Send it free", text: "Share a private link with relatives on WhatsApp, SMS or email. No limit, no charge." },
  { title: "Download when ready", text: "Want a copy for print or to keep? Download in high quality from just ₹249." },
];

export const GALLERY = [
  { src: unsplash("photo-1519741497674-611481863552", 900), label: "Garden vows", ratio: "aspect-[4/5]" },
  { src: unsplash("photo-1511285560929-80b456fea0bc", 900), label: "Golden hour", ratio: "aspect-[3/4]" },
  { src: unsplash("photo-1523438885200-e635ba2c371e", 900), label: "Veil & light", ratio: "aspect-square" },
  { src: unsplash("photo-1529636798458-92182e662485", 900), label: "Evening ceremony", ratio: "aspect-[4/5]" },
  { src: unsplash("photo-1550005809-91ad75fb315f", 900), label: "Blush florals", ratio: "aspect-[3/4]" },
  { src: unsplash("photo-1522673607200-164d1b6ce486", 900), label: "Rustic romance", ratio: "aspect-[4/5]" },
  { src: unsplash("photo-1537633552985-df8429e8048b", 900), label: "Classic ivory", ratio: "aspect-square" },
  { src: unsplash("photo-1519225421980-715cb0215aed", 900), label: "Table settings", ratio: "aspect-[3/4]" },
];

export const PLANS = [
  {
    name: "Share online",
    price: "Free",
    caption: "Create and send",
    features: ["Every template", "Edit your card anytime", "Private shareable link", "Unlimited relatives"],
    cta: "Start creating",
    highlight: false,
  },
  {
    name: "Download",
    price: "₹249",
    caption: "Starting from, per card",
    features: ["Everything in Share online", "High-quality image download", "Print-ready PDF", "No Shaan watermark"],
    cta: "Create & download",
    highlight: true,
  },
  {
    name: "Event pack",
    price: "₹499",
    caption: "Up to 5 cards, one event",
    features: ["Everything in Download", "Sangeet, mehendi, wedding and more", "Matching designs across cards", "One download bundle"],
    cta: "Create a pack",
    highlight: false,
  },
];

export const TESTIMONIALS = [
  {
    quote:
      "I made our wedding card on the train and my aunts had it on WhatsApp before I reached home. It looked like something a designer charged us for.",
    name: "Ananya & Rohan",
    place: "Jaipur",
    avatar: unsplash("photo-1494790108377-be9c29b29330", 200),
  },
  {
    quote:
      "Free to send was the deal-breaker for me. I shared with sixty relatives, then paid ₹249 for the print file once the details were final.",
    name: "Meera Kapoor",
    place: "Delhi",
    avatar: unsplash("photo-1507003211169-0a1dd7228f2d", 200),
  },
  {
    quote:
      "Changing the venue after sending was painless. The link updated and nobody had to be told twice.",
    name: "Arjun Mehta",
    place: "Pune",
    avatar: unsplash("photo-1500648767791-00dcc994a43e", 200),
  },
];

export const FOOTER_LINKS = [
  {
    heading: "Explore",
    links: [
      { label: "Templates", href: "/templates" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "Pricing", href: "/#pricing" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About us", href: "/#about" },
      { label: "Reviews", href: "/#testimonials" },
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "Log in", href: "/login" },
      { label: "Sign up", href: "/register" },
    ],
  },
];
