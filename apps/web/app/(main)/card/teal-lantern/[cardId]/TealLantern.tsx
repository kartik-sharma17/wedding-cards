import type { TemplateDefinition } from "@/components/card/types";
import { parseDate, safeHttpUrl, type WeddingCardView, type WeddingCategory } from "./TealLanternData";

/* ------------------------------------------------------------------ */
/* Copy. Add another language by adding a key here (e.g. `hi`).        */
/* ------------------------------------------------------------------ */
const STRINGS = {
  en: {
    together: "Together with their families",
    and: "and",
    join: {
      wedding: "Joyfully invite you to celebrate their wedding",
      reception: "Joyfully invite you to celebrate their wedding reception",
      engagement: "Joyfully invite you to celebrate their engagement",
      anniversary: "Joyfully invite you to celebrate their anniversary",
    } as Record<WeddingCategory, string>,
    at: "At",
    details: {
      wedding: "Our Celebration",
      reception: "Our Reception",
      engagement: "Our Engagement",
      anniversary: "Our Anniversary",
    } as Record<WeddingCategory, string>,
    families: "With love from our families",
    daughterOf: "Daughter of",
    sonOf: "Son of",
    years: (n: number) => `${n} ${n === 1 ? "year" : "years"} together`,
    celebrations: "Celebrations",
    viewMap: "View on map",
    rsvpBy: "Kindly reply by",
    dressCode: "Dress code",
    goodToKnow: "Good to know",
    closing: "We can’t wait to celebrate with you",
  },
};

/* ------------------------------------------------------------------ */
/* Date helpers (timezone-aware so every guest sees the same time)     */
/* ------------------------------------------------------------------ */
function fmt(d: Date, locale: string, tz: string | null, o: Intl.DateTimeFormatOptions) {
  try {
    return new Intl.DateTimeFormat(locale, { ...o, ...(tz ? { timeZone: tz } : {}) }).format(d);
  } catch {
    return new Intl.DateTimeFormat(locale, o).format(d);
  }
}

/** Hour/minute in the event's timezone; null when no time was set (00:00). */
function clock(d: Date, tz: string | null): { h: number; m: number } | null {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "numeric", hourCycle: "h23", ...(tz ? { timeZone: tz } : {}) }).formatToParts(d);
  } catch {
    parts = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(d);
  }
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h === 0 && m === 0 ? null : { h, m };
}

function derive(data: WeddingCardView) {
  const t = STRINGS[data.language as keyof typeof STRINGS] ?? STRINGS.en;
  const locale = data.language in STRINGS ? data.language : "en";
  const tz = data.timezone;
  const eventDate = parseDate(data.eventDate);
  return { t, locale, tz, eventDate, cat: data.category };
}

const initial = (s: string) => Array.from(s.trim())[0]?.toUpperCase() ?? "";

/* ------------------------------------------------------------------ */
/* Artwork: teal roses, sage leaves, gold sprigs and lanterns, all SVG */
/* so the screen view and the PDF get identical pictures.              */
/* ------------------------------------------------------------------ */
type Tone = "t" | "c" | "b"; // teal, cream, blue-grey
type Item =
  | { k: "leaf"; x: number; y: number; r: number; s: number; c: "s" | "t" | "g" }
  | { k: "rose"; x: number; y: number; r: number; s: number; t: Tone }
  | { k: "blossom"; x: number; y: number; r: number; s: number; t: Tone }
  | { k: "sprig"; x: number; y: number; r: number; s: number }
  | { k: "bokeh"; x: number; y: number; r: number };

const PETAL_FILL: Record<Tone, string> = { t: "url(#tl-pt)", c: "url(#tl-pc)", b: "url(#tl-pb)" };
const CORE: Record<Tone, string> = { t: "#245c6b", c: "#cdb98f", b: "#4f7f98" };
const LEAF_FILL = { s: "url(#tl-ls)", t: "url(#tl-lt)", g: "url(#tl-lg)" } as const;
const LEAF = "M0 0C10-12 36-14 60 0C36 14 10 12 0 0Z";
const BLOSSOM = "M0 0C-7-5-8-18 0-24C8-18 7-5 0 0Z";
const at = (x: number, y: number, r: number, s: number) => `translate(${x} ${y}) rotate(${r}) scale(${s})`;

function renderItem(it: Item, i: number) {
  switch (it.k) {
    case "bokeh":
      return <circle key={i} cx={it.x} cy={it.y} r={it.r} fill="url(#tl-bokeh)" />;
    case "leaf":
      return (
        <g key={i} transform={at(it.x, it.y, it.r, it.s)}>
          <path d={LEAF} fill={LEAF_FILL[it.c]} fillOpacity=".92" />
          <path d="M2 0L50 0" stroke="#fff" strokeOpacity=".3" strokeWidth=".8" fill="none" />
        </g>
      );
    case "sprig":
      return (
        <g key={i} transform={at(it.x, it.y, it.r, it.s)}>
          <path d="M0 0C20-6 45-22 70-60" stroke="#b9a066" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          {[
            [14, -4, -25],
            [28, -12, -40],
            [42, -24, -55],
            [56, -40, -70],
            [68, -58, -85],
          ].map(([x, y, r], j) => (
            <path key={`a${j}`} d={LEAF} transform={`translate(${x} ${y}) rotate(${r}) scale(.28)`} fill="url(#tl-lg)" fillOpacity=".9" />
          ))}
          {[
            [12, -3, 55],
            [26, -10, 40],
            [40, -22, 25],
            [54, -38, 10],
          ].map(([x, y, r], j) => (
            <path key={`b${j}`} d={LEAF} transform={`translate(${x} ${y}) rotate(${r}) scale(.26)`} fill="url(#tl-lg)" fillOpacity=".85" />
          ))}
        </g>
      );
    case "blossom":
      return (
        <g key={i} transform={at(it.x, it.y, it.r, it.s)}>
          <g fill={PETAL_FILL[it.t]} stroke="#fff" strokeOpacity=".6" strokeWidth=".8">
            {[0, 72, 144, 216, 288].map((a) => (
              <path key={a} d={BLOSSOM} transform={`rotate(${a})`} />
            ))}
          </g>
          <circle r="4" fill="#e6c97a" />
          <circle r="1.6" fill="#9a7a35" fillOpacity=".7" />
        </g>
      );
    case "rose":
      return (
        <g key={i} transform={at(it.x, it.y, it.r, it.s)}>
          <g fill={PETAL_FILL[it.t]} stroke="#fff" strokeOpacity=".55" strokeWidth=".9">
            {[0, 60, 120, 180, 240, 300].map((a) => (
              <ellipse key={a} cx="0" cy="-21" rx="15" ry="16" transform={`rotate(${a})`} />
            ))}
          </g>
          <g fill={PETAL_FILL[it.t]} stroke="#fff" strokeOpacity=".6" strokeWidth=".9">
            {[30, 102, 174, 246, 318].map((a) => (
              <ellipse key={a} cx="0" cy="-12" rx="10.5" ry="11" transform={`rotate(${a})`} />
            ))}
          </g>
          <circle r="8.5" fill={CORE[it.t]} fillOpacity=".5" />
          <path d="M-6-1C-3-8 6-7 6 0C6 5-1 6-2 2C-3-1 1-3 2-1" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth=".9" strokeLinecap="round" />
        </g>
      );
  }
}

const Group = ({ items }: { items: Item[] }) => <>{items.map(renderItem)}</>;

/** Top-left corner cluster (card corner at 0,0 in a 500 x 700 space). */
const TOP_A: Item[] = [
  { k: "leaf", x: 30, y: 60, r: 40, s: 1.2, c: "s" },
  { k: "leaf", x: 118, y: 18, r: 8, s: 1.1, c: "t" },
  { k: "leaf", x: 20, y: 120, r: 75, s: 1.1, c: "t" },
  { k: "leaf", x: 150, y: 58, r: 28, s: 0.85, c: "s" },
  { k: "leaf", x: 14, y: 195, r: 88, s: 0.95, c: "s" },
  { k: "leaf", x: 80, y: 100, r: 55, s: 0.9, c: "t" },
  { k: "leaf", x: 190, y: 30, r: -8, s: 0.7, c: "s" },
  { k: "sprig", x: 60, y: 215, r: 20, s: 0.6 },
  { k: "rose", x: 42, y: 42, r: 10, s: 1.55, t: "c" },
  { k: "rose", x: 122, y: 36, r: -15, s: 1.2, t: "t" },
  { k: "rose", x: 28, y: 138, r: 30, s: 1.1, t: "t" },
  { k: "rose", x: 92, y: 102, r: 5, s: 0.95, t: "b" },
  { k: "rose", x: 175, y: 22, r: 20, s: 0.8, t: "c" },
  { k: "rose", x: 62, y: 200, r: 0, s: 0.7, t: "c" },
  { k: "blossom", x: 150, y: 92, r: 30, s: 0.9, t: "c" },
  { k: "blossom", x: 12, y: 236, r: 80, s: 0.8, t: "c" },
  { k: "blossom", x: 212, y: 56, r: 20, s: 0.7, t: "b" },
];

/** Top-right corner cluster, a different arrangement (drawn mirrored). */
const TOP_B: Item[] = [
  { k: "leaf", x: 26, y: 70, r: 50, s: 1.1, c: "t" },
  { k: "leaf", x: 110, y: 16, r: 5, s: 1.15, c: "s" },
  { k: "leaf", x: 16, y: 150, r: 80, s: 1.1, c: "s" },
  { k: "leaf", x: 140, y: 72, r: 35, s: 0.85, c: "t" },
  { k: "leaf", x: 12, y: 230, r: 88, s: 0.95, c: "t" },
  { k: "leaf", x: 178, y: 34, r: -6, s: 0.75, c: "s" },
  { k: "sprig", x: 50, y: 240, r: 30, s: 0.6 },
  { k: "rose", x: 38, y: 40, r: -5, s: 1.5, t: "t" },
  { k: "rose", x: 112, y: 32, r: 15, s: 1.25, t: "c" },
  { k: "rose", x: 24, y: 128, r: 40, s: 1.05, t: "c" },
  { k: "rose", x: 96, y: 98, r: -10, s: 0.95, t: "t" },
  { k: "rose", x: 160, y: 20, r: 0, s: 0.8, t: "b" },
  { k: "rose", x: 40, y: 200, r: 20, s: 0.8, t: "b" },
  { k: "blossom", x: 140, y: 110, r: 10, s: 0.85, t: "c" },
  { k: "blossom", x: 200, y: 52, r: 25, s: 0.7, t: "c" },
];

/** Side sprigs along the edges, mid card (drawn on both sides). */
const SIDE: Item[] = [
  { k: "sprig", x: 12, y: 470, r: -12, s: 1.05 },
  { k: "sprig", x: 10, y: 360, r: 4, s: 0.95 },
  { k: "leaf", x: 10, y: 410, r: -70, s: 0.8, c: "g" },
  { k: "leaf", x: 10, y: 300, r: -75, s: 0.7, c: "g" },
  { k: "blossom", x: 40, y: 400, r: 20, s: 0.75, t: "c" },
  { k: "blossom", x: 36, y: 500, r: 0, s: 0.7, t: "c" },
  { k: "blossom", x: 22, y: 330, r: -30, s: 0.6, t: "c" },
];

/** Bottom-left corner (cream roses), bottom-right corner (teal roses). */
const BOT_A: Item[] = [
  { k: "leaf", x: 18, y: 630, r: -70, s: 1.1, c: "s" },
  { k: "leaf", x: 62, y: 668, r: -25, s: 1, c: "t" },
  { k: "leaf", x: 12, y: 580, r: -85, s: 0.9, c: "s" },
  { k: "leaf", x: 110, y: 690, r: -10, s: 0.8, c: "s" },
  { k: "rose", x: 30, y: 672, r: 10, s: 1.35, t: "c" },
  { k: "rose", x: 98, y: 684, r: -10, s: 0.95, t: "t" },
  { k: "rose", x: 22, y: 612, r: 20, s: 0.85, t: "b" },
  { k: "blossom", x: 64, y: 596, r: -20, s: 0.8, t: "c" },
  { k: "blossom", x: 150, y: 686, r: 10, s: 0.7, t: "c" },
];
const BOT_B: Item[] = [
  { k: "leaf", x: 14, y: 560, r: -85, s: 1, c: "s" },
  { k: "leaf", x: 20, y: 640, r: -70, s: 1.1, c: "t" },
  { k: "leaf", x: 70, y: 672, r: -20, s: 1, c: "s" },
  { k: "leaf", x: 120, y: 692, r: -8, s: 0.8, c: "t" },
  { k: "sprig", x: 60, y: 560, r: -20, s: 0.6 },
  { k: "rose", x: 26, y: 566, r: 15, s: 1.15, t: "t" },
  { k: "rose", x: 34, y: 668, r: 0, s: 1.4, t: "t" },
  { k: "rose", x: 28, y: 616, r: 40, s: 1, t: "c" },
  { k: "rose", x: 104, y: 682, r: -10, s: 0.95, t: "b" },
  { k: "blossom", x: 72, y: 616, r: 10, s: 0.8, t: "c" },
  { k: "blossom", x: 150, y: 688, r: 0, s: 0.65, t: "c" },
];

/** Soft glints scattered over the paper. */
const BOKEH: Item[] = [
  { k: "bokeh", x: 120, y: 300, r: 7 },
  { k: "bokeh", x: 385, y: 270, r: 6 },
  { k: "bokeh", x: 90, y: 440, r: 9 },
  { k: "bokeh", x: 420, y: 470, r: 8 },
  { k: "bokeh", x: 160, y: 520, r: 5 },
  { k: "bokeh", x: 350, y: 545, r: 7 },
  { k: "bokeh", x: 250, y: 600, r: 6 },
  { k: "bokeh", x: 70, y: 540, r: 5 },
  { k: "bokeh", x: 440, y: 580, r: 6 },
];

/** Flowers that tuck under the monogram ring (130 x 120 space). */
const MONO: Item[] = [
  { k: "leaf", x: 62, y: 104, r: -170, s: 0.4, c: "s" },
  { k: "leaf", x: 68, y: 104, r: -10, s: 0.4, c: "s" },
  { k: "leaf", x: 44, y: 98, r: -150, s: 0.35, c: "t" },
  { k: "leaf", x: 86, y: 98, r: -30, s: 0.35, c: "t" },
  { k: "rose", x: 65, y: 104, r: 0, s: 0.4, t: "c" },
  { k: "rose", x: 44, y: 98, r: 20, s: 0.33, t: "t" },
  { k: "rose", x: 86, y: 98, r: -20, s: 0.33, t: "b" },
  { k: "blossom", x: 27, y: 86, r: -60, s: 0.45, t: "c" },
  { k: "blossom", x: 103, y: 86, r: 60, s: 0.45, t: "c" },
];

/** A hanging gold lantern, drawn around (0,0) = top ring. */
function LanternBody() {
  return (
    <>
      <circle cy="38" r="26" fill="url(#tl-halo)" />
      <circle cy="4" r="3.2" fill="none" stroke="#b8964f" strokeWidth="1.2" />
      <path d="M-10 22C-10 13-4 9 0 6C4 9 10 13 10 22Z" fill="url(#tl-gold)" />
      <rect x="-12" y="22" width="24" height="3.4" rx="1.4" fill="url(#tl-gold)" />
      <path d="M-10 25.4L-13 62H13L10 25.4Z" fill="url(#tl-glow)" stroke="#b8964f" strokeWidth=".9" />
      <path d="M-4 25.4L-5.2 62M4 25.4L5.2 62" stroke="#b8964f" strokeWidth=".8" strokeOpacity=".8" fill="none" />
      <ellipse cy="46" rx="3" ry="6.5" fill="#fffbe6" />
      <path d="M-13 62H13L8 70H-8Z" fill="url(#tl-gold)" />
      <path d="M0 70V76" stroke="#b8964f" strokeWidth="1.2" />
      <path d="M0 76L2.6 80L0 85L-2.6 80Z" fill="url(#tl-gold)" />
    </>
  );
}

function Lantern({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g>
      <path d={`M${x} 0V${y + s}`} stroke="#b8964f" strokeWidth="1.6" strokeDasharray="2.2 2.2" fill="none" />
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        <LanternBody />
      </g>
    </g>
  );
}

const LanternIcon = () => (
  <svg className="tl-icon" viewBox="-28 -2 56 90" aria-hidden="true" focusable="false">
    <LanternBody />
  </svg>
);

const ARCH =
  "M52 660V250C52 190 100 175 112 120C122 76 175 56 215 40C232 33 244 22 250 14C256 22 268 33 285 40C325 56 378 76 388 120C400 175 448 190 448 250V660";

/** Painted behind every page: sea glow, gold frame, arch, flowers, lanterns. */
const Decor = () => (
  <svg className="tl-art" viewBox="0 0 500 700" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <rect x="0" y="440" width="500" height="260" fill="url(#tl-sea)" />
    <g fill="#fff" fillOpacity=".4">
      <ellipse cx="250" cy="520" rx="170" ry="2.5" />
      <ellipse cx="250" cy="548" rx="120" ry="2" />
      <ellipse cx="250" cy="574" rx="190" ry="2.5" />
    </g>
    <Group items={BOKEH} />

    <g fill="none" stroke="url(#tl-gold)">
      <rect x="8" y="8" width="484" height="684" rx="4" strokeWidth="2" />
      <rect x="15" y="15" width="470" height="670" rx="2" strokeWidth=".9" />
      <path d={ARCH} strokeWidth="1.3" strokeOpacity=".55" />
      <path d={ARCH} strokeWidth=".7" strokeOpacity=".4" transform="translate(250 340) scale(.97) translate(-250 -340)" />
    </g>

    <Group items={SIDE} />
    <g transform="translate(500 0) scale(-1 1)">
      <Group items={SIDE} />
    </g>
    <g transform="translate(0 700) scale(.8) translate(0 -700)">
      <Group items={BOT_A} />
    </g>
    <g transform="translate(500 700) scale(-.8 .8) translate(0 -700)">
      <Group items={BOT_B} />
    </g>
    <g transform="scale(.78)">
      <Group items={TOP_A} />
    </g>
    <g transform="translate(500 0) scale(-.78 .78)">
      <Group items={TOP_B} />
    </g>

    <Lantern x={58} y={185} s={1.45} />
    <Lantern x={34} y={345} s={1.15} />
    <Lantern x={444} y={150} s={1.2} />
    <Lantern x={462} y={330} s={1.3} />
  </svg>
);

/** Monogram: initials in a gold + teal ring with a small wreath under it. */
function Monogram({ a, b }: { a: string; b: string }) {
  return (
    <div className="tl-mono" aria-hidden="true">
      <svg viewBox="0 0 130 120" focusable="false">
        <g fill="none">
          <circle cx="65" cy="56" r="46" stroke="url(#tl-gold)" strokeWidth="1.6" />
          <circle cx="65" cy="56" r="41" stroke="#4f8794" strokeOpacity=".55" strokeWidth=".9" />
        </g>
        <Group items={MONO} />
      </svg>
      <div className="tl-mono-text">
        <span>{a}</span>
        <span>{b}</span>
      </div>
    </div>
  );
}

/** Little scroll that sits either side of "and". */
const Flourish = ({ flip = false }: { flip?: boolean }) => (
  <svg className={`tl-flourish${flip ? " tl-flourish--r" : ""}`} viewBox="0 0 100 16" aria-hidden="true" focusable="false">
    <g fill="none" stroke="#b08d45" strokeWidth=".9" strokeLinecap="round">
      <path d="M2 8C20 8 34 8 56 8C66 8 72 2 80 4C87 6 84 13 78 11C74 10 75 6 79 7" />
    </g>
    <circle cx="93" cy="8" r="1.5" fill="#b08d45" />
  </svg>
);

/** Thin gold rule with a small diamond in the middle. */
const Divider = () => (
  <svg className="tl-divider" viewBox="0 0 160 16" aria-hidden="true" focusable="false">
    <g stroke="#b08d45" strokeWidth=".8" strokeLinecap="round" fill="none">
      <path d="M6 8H62" />
      <path d="M98 8H154" />
      <path d="M70 8L80 3L90 8L80 13Z" />
    </g>
    <circle cx="80" cy="8" r="1.6" fill="#b08d45" />
    <circle cx="65" cy="8" r="1.2" fill="#b08d45" />
    <circle cx="95" cy="8" r="1.2" fill="#b08d45" />
  </svg>
);

/* ------------------------------------------------------------------ */
/* The three pages                                                     */
/* ------------------------------------------------------------------ */
function PageWelcome({ data }: { data: WeddingCardView }) {
  const { t, locale, tz, eventDate, cat } = derive(data);
  const time = eventDate ? clock(eventDate, tz) : null;
  const longest = Math.max(data.brideName.length, data.groomName.length);
  const nameSize = longest > 22 ? 5 : longest > 16 ? 6.4 : longest > 12 ? 8 : longest > 9 ? 9.5 : longest > 6 ? 11 : 12;

  return (
    <div className="tl-inner">
      <Monogram a={initial(data.brideName)} b={initial(data.groomName)} />
      <p className="tl-caps tl-caps--small">{data.hostLine ?? t.together}</p>

      <h1 className="tl-names" style={{ fontSize: `${nameSize}cqw` }}>
        <span>{data.brideName}</span>
        <span className="tl-and">
          <Flourish />
          <span>{t.and}</span>
          <Flourish flip />
        </span>
        <span>{data.groomName}</span>
      </h1>

      <p className="tl-lead">{t.join[cat]}</p>
      <Divider />

      {eventDate && (
        <div className="tl-date">
          <span className="tl-side">{fmt(eventDate, locale, tz, { weekday: "long" })}</span>
          <span className="tl-center">
            <span className="tl-month">{fmt(eventDate, locale, tz, { month: "long" })}</span>
            <span className="tl-day">{fmt(eventDate, locale, tz, { day: "numeric" })}</span>
            <span className="tl-year">{fmt(eventDate, locale, tz, { year: "numeric" })}</span>
          </span>
          {time ? (
            <span className="tl-side">
              {t.at} {fmt(eventDate, locale, tz, { hour: "2-digit", minute: "2-digit", hour12: true })}
            </span>
          ) : (
            <span className="tl-side tl-side--empty" aria-hidden="true">
              &nbsp;
            </span>
          )}
        </div>
      )}

      {(data.venueName || data.venueAddress) && (
        <div className="tl-venue">
          {data.venueName && <p className="tl-venue-name">{data.venueName}</p>}
          {data.venueAddress && <p className="tl-venue-addr">{data.venueAddress}</p>}
        </div>
      )}
    </div>
  );
}

function PageDetails({ data, active }: { data: WeddingCardView; active: boolean }) {
  const { t, locale, tz, cat } = derive(data);
  const showParents = cat !== "anniversary" && (data.brideParents || data.groomParents);
  const events = [...data.events].sort((a, b) => (parseDate(a.date)?.getTime() ?? 0) - (parseDate(b.date)?.getTime() ?? 0));
  const mapUrl = safeHttpUrl(data.mapUrl);

  return (
    <div className="tl-inner">
      <p className="tl-script tl-script--title">{t.details[cat]}</p>
      <Divider />

      {showParents && (
        <>
          <p className="tl-lead tl-lead--small">{t.families}</p>
          <div className="tl-parents">
            {data.brideParents && (
              <p className="tl-caps">
                <span className="tl-label">{t.daughterOf}</span>
                <br />
                <span className="tl-strong">{data.brideParents}</span>
              </p>
            )}
            {data.groomParents && (
              <p className="tl-caps">
                <span className="tl-label">{t.sonOf}</span>
                <br />
                <span className="tl-strong">{data.groomParents}</span>
              </p>
            )}
          </div>
        </>
      )}

      {data.yearsTogether != null && <p className="tl-script tl-script--years">{t.years(data.yearsTogether)}</p>}

      {events.length > 0 && (
        <>
          {(showParents || data.yearsTogether != null) && <Divider />}
          <ul className="tl-events" aria-label={t.celebrations}>
            {events.map((ev, i) => {
              const d = parseDate(ev.date)!;
              const c = clock(d, tz);
              const when = fmt(d, locale, tz, { weekday: "short", month: "short", day: "numeric" });
              const atTime = ev.startTime ?? (c ? fmt(d, locale, tz, { hour: "numeric", minute: "2-digit" }) : null);
              return (
                <li key={`${ev.name}-${i}`}>
                  <span className="tl-event-name">{ev.name}</span>
                  <span className="tl-caps tl-caps--small">
                    {when}
                    {atTime ? `, ${atTime}` : ""}
                  </span>
                  {(ev.venueName || ev.venueAddress) && <span className="tl-caps tl-caps--small tl-caps--soft">{[ev.venueName, ev.venueAddress].filter(Boolean).join(", ")}</span>}
                </li>
              );
            })}
          </ul>
        </>
      )}

      {mapUrl && (
        <a className="tl-link" href={mapUrl} target="_blank" rel="noopener noreferrer" tabIndex={active ? 0 : -1}>
          {t.viewMap}
        </a>
      )}
    </div>
  );
}

function PageRsvp({ data, active }: { data: WeddingCardView; active: boolean }) {
  const { t, locale, tz } = derive(data);
  const rsvpDate = parseDate(data.rsvpByDate);
  const tab = active ? 0 : -1;
  const hasContact = data.rsvpContactName || data.rsvpPhone || data.rsvpEmail;
  const hashtag = data.coupleHashtag ? (data.coupleHashtag.startsWith("#") ? data.coupleHashtag : `#${data.coupleHashtag}`) : null;

  return (
    <div className="tl-inner">
      <LanternIcon />
      {data.invitationMessage && (
        <>
          <p className="tl-message">{data.invitationMessage}</p>
          {(rsvpDate || hasContact) && <Divider />}
        </>
      )}

      {rsvpDate && (
        <p className="tl-caps">
          {t.rsvpBy}
          <br />
          <span className="tl-accent">{fmt(rsvpDate, locale, tz, { month: "long", day: "numeric", year: "numeric" })}</span>
        </p>
      )}
      {hasContact && (
        <p className="tl-caps">
          {data.rsvpContactName}
          {data.rsvpContactName && (data.rsvpPhone || data.rsvpEmail) && <br />}
          {data.rsvpPhone && (
            <a className="tl-plain" href={`tel:${data.rsvpPhone.replace(/[^\d+]/g, "")}`} tabIndex={tab}>
              {data.rsvpPhone}
            </a>
          )}
          {data.rsvpPhone && data.rsvpEmail && <br />}
          {data.rsvpEmail && (
            <a className="tl-plain tl-email" href={`mailto:${data.rsvpEmail}`} tabIndex={tab}>
              {data.rsvpEmail}
            </a>
          )}
        </p>
      )}
      {data.dressCode && (
        <p className="tl-caps">
          <span className="tl-accent">{t.dressCode}:</span> {data.dressCode}
        </p>
      )}
      {data.additionalNotes && (
        <p className="tl-caps tl-caps--small tl-notes">
          <span className="tl-accent">{t.goodToKnow}:</span> {data.additionalNotes}
        </p>
      )}

      <Divider />
      <p className="tl-script tl-script--closing">{t.closing}</p>
      {hashtag && <p className="tl-hashtag">{hashtag}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The template definition: this is the ONE thing the shells need.     */
/* ------------------------------------------------------------------ */
export const tealLantern: TemplateDefinition<WeddingCardView> = {
  rootClass: "tl",
  size: { widthIn: 5, heightIn: 7 },
  fonts: ["Cormorant Garamond", "Great Vibes"],
  css: templateCss(),
  defs: (
    <>
      <linearGradient id="tl-gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ecd8a0" />
        <stop offset="0.5" stopColor="#c9a85c" />
        <stop offset="1" stopColor="#a48238" />
      </linearGradient>
      {(
        [
          ["tl-pt", "#2a6270", "#8cbfc5"],
          ["tl-pc", "#d8c7a2", "#fdf9ef"],
          ["tl-pb", "#5a8aa3", "#cadde8"],
        ] as const
      ).map(([id, deep, light]) => (
        <radialGradient key={id} id={id} cx=".5" cy=".85" r=".95">
          <stop offset="0" stopColor={deep} />
          <stop offset="1" stopColor={light} />
        </radialGradient>
      ))}
      {(
        [
          ["tl-ls", "#aac4b0", "#5d8575"],
          ["tl-lt", "#6aa3ad", "#2c6471"],
          ["tl-lg", "#ecd9a0", "#b08d45"],
        ] as const
      ).map(([id, from, to]) => (
        <linearGradient key={id} id={id} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      ))}
      <radialGradient id="tl-glow" cx=".5" cy=".6" r=".7">
        <stop offset="0" stopColor="#fffbe6" />
        <stop offset=".55" stopColor="#f6dc9a" />
        <stop offset="1" stopColor="#c99a45" />
      </radialGradient>
      <radialGradient id="tl-halo">
        <stop offset="0" stopColor="#ffe9a8" stopOpacity=".55" />
        <stop offset="1" stopColor="#ffe9a8" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="tl-bokeh">
        <stop offset="0" stopColor="#fff" stopOpacity=".8" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="tl-sea" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#bfd9de" stopOpacity="0" />
        <stop offset="1" stopColor="#bfd9de" stopOpacity=".6" />
      </linearGradient>
    </>
  ),
  Decor,
  pages: [
    { label: "Welcome", render: (d) => <PageWelcome data={d} /> },
    { label: "Details", render: (d, active) => <PageDetails data={d} active={active} /> },
    { label: "RSVP", render: (d, active) => <PageRsvp data={d} active={active} /> },
  ],
};

/* ------------------------------------------------------------------ */
/* Template styles. Sizes use cqw so the card scales as one unit:      */
/* the same CSS gives the on-screen card and the 5x7in PDF page.       */
/* ------------------------------------------------------------------ */
function templateCss() {
  return `
@import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Great+Vibes&display=swap");

.tl{
  --card-accent:#4f8794;--card-accent-hi:#2c5565;--card-ink:#5b5148;--card-font:"Cormorant Garamond","Times New Roman",serif;
  --card-paper:
    radial-gradient(70% 36% at 50% 20%,rgba(255,255,255,.75),transparent 72%),
    radial-gradient(60% 30% at 50% 62%,rgba(255,255,255,.5),transparent 72%),
    linear-gradient(#f7f1e5,#f0e8d8 55%,#e1ebe8);
  --card-back:linear-gradient(90deg,#cfdfe0,#eef3f1);
  --card-stage:radial-gradient(90% 60% at 50% 0%,#e8f1f2 0%,#8fb2b9 100%);
  --card-stage-guest:radial-gradient(90% 70% at 50% 40%,#cfe0e2 0%,#46717b 100%);
  --card-btn-bg:rgba(255,255,255,.9);--card-btn-hover:#fff;--card-btn-border:rgba(44,85,101,.5);
  --card-pad-x:15cqw;--card-pad-y:9cqw;
  --teal:#2c5565;--gold:#b08d45}
.tl *{box-sizing:border-box}
/* The shell darkens the spine edge for dark cards; keep it soft on this light paper. */
.tl .fb-front::after{background:linear-gradient(90deg,rgba(40,70,80,.16),transparent 7%)}

.tl-art{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}

.tl-inner{margin-block:auto;display:flex;flex-direction:column;align-items:center;text-align:center;gap:1.4cqw}
.tl-inner p,.tl-inner h1,.tl-inner ul{margin:0}

.tl-lead{font-size:3.4cqw;line-height:1.5;letter-spacing:.14em;text-transform:uppercase;font-weight:600;text-wrap:balance;max-width:58cqw}
.tl-lead--small{font-size:3.1cqw}
.tl-caps{font-size:3cqw;line-height:1.6;letter-spacing:.16em;text-transform:uppercase;font-weight:600;overflow-wrap:anywhere}
.tl-caps--small{font-size:2.8cqw;line-height:1.6}
.tl-caps--soft{opacity:.8}
.tl-strong{font-weight:700}
.tl-accent{color:var(--teal);font-weight:700}
.tl-script{font-family:"Great Vibes","Brush Script MT",cursive;font-weight:400;color:var(--teal);line-height:1.2}
.tl-script--title{font-size:8cqw}
.tl-script--years{font-size:6.4cqw}
.tl-script--closing{font-size:6.2cqw;text-wrap:balance}
.tl-hashtag{font-size:3.2cqw;letter-spacing:.12em;font-weight:700;color:var(--teal)}

.tl-mono{position:relative;flex:none;width:21cqw;height:19.4cqw}
.tl-mono svg{position:absolute;inset:0;width:100%;height:100%}
.tl-mono-text{position:absolute;inset:0 0 1.4cqw 0;display:flex;align-items:center;justify-content:center;
  font-family:"Cormorant Garamond",serif;font-weight:600;font-size:8.2cqw;line-height:1;color:#6a5a47}
.tl-mono-text span:last-child{margin-left:-.06em;transform:translateY(.14em)}

.tl-names{display:flex;flex-direction:column;align-items:center;max-width:70cqw;overflow-wrap:anywhere;
  font-family:"Great Vibes","Brush Script MT",cursive;font-weight:400;line-height:1.05;color:var(--teal)}
.tl-and{display:flex;align-items:center;gap:2.4cqw;font-family:"Cormorant Garamond",serif;font-size:3.4cqw;letter-spacing:.22em;text-transform:uppercase;font-weight:600;color:var(--card-ink);line-height:1.8}
.tl-flourish{width:15cqw;height:auto;flex:none}
.tl-flourish--r{transform:scaleX(-1)}

.tl-date{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:2cqw;width:100%}
.tl-side{font-size:2.7cqw;letter-spacing:.08em;text-transform:uppercase;font-weight:600;text-align:center;padding-block:1.6cqw;border-block:1px solid var(--gold);text-wrap:balance}
.tl-side--empty{border-color:transparent}
.tl-center{display:grid;justify-items:center;gap:.4cqw;padding:1cqw 3cqw;border-inline:1px solid var(--gold)}
.tl-month{font-size:3.4cqw;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--teal);line-height:1.2}
.tl-day{font-size:10.5cqw;line-height:1;font-weight:600;color:var(--teal)}
.tl-year{font-size:3.4cqw;letter-spacing:.2em;font-weight:600;line-height:1.3}

.tl-venue{display:grid;gap:.4cqw}
.tl-venue-name{font-size:4cqw;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--teal);line-height:1.35}
.tl-venue-addr{font-size:2.8cqw;letter-spacing:.12em;text-transform:uppercase;line-height:1.6;font-weight:600;overflow-wrap:anywhere}

.tl-divider{width:30cqw;height:auto;flex:none}
.tl-icon{width:6.5cqw;height:auto;flex:none}
.tl-message{font-size:3.4cqw;line-height:1.5;font-style:italic;font-weight:500;white-space:pre-line;overflow-wrap:anywhere;text-wrap:pretty}
.tl-notes{max-width:62cqw}
.tl-parents{display:grid;gap:1.2cqw}
.tl-label{font-size:2.6cqw;letter-spacing:.2em;opacity:.8}

.tl-link{color:var(--teal);font-size:3cqw;font-weight:700;letter-spacing:.16em;text-transform:uppercase;text-decoration:none;padding:1.4cqw 4cqw;border:1px solid var(--gold);border-radius:999px;margin-top:1cqw}
.tl-plain{color:inherit;text-decoration:none}
.tl-email{letter-spacing:.04em;text-transform:none}
.tl-link:focus-visible,.tl-plain:focus-visible{outline:2px solid var(--teal);outline-offset:3px}

.tl-events{list-style:none;padding:0;display:grid;gap:2.4cqw;width:100%}
.tl-events li{display:flex;flex-direction:column;align-items:center;gap:.5cqw}
.tl-events li+li::before{content:"";width:1.6cqw;height:1.6cqw;background:var(--gold);transform:rotate(45deg);margin-bottom:1.4cqw}
.tl-event-name{font-family:"Great Vibes","Brush Script MT",cursive;font-size:5.6cqw;line-height:1.15;color:var(--teal)}
`;
}
