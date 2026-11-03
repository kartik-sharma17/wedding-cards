import type { TemplateDefinition } from "@/components/card/types";
import { parseDate, safeHttpUrl, type WeddingCardView, type WeddingCategory } from "./GildedIvoryData";

/* ------------------------------------------------------------------ */
/* Copy. Add another language by adding a key here (e.g. `hi`).        */
/* ------------------------------------------------------------------ */
const STRINGS = {
  en: {
    invited: "You are invited to",
    of: {
      wedding: "the wedding of",
      reception: "the wedding reception of",
      engagement: "the engagement of",
      anniversary: "the anniversary of",
    } as Record<WeddingCategory, string>,
    and: "and",
    at: "At",
    blessing: "With love & blessings",
    details: {
      wedding: "Our Celebrations",
      reception: "Our Reception",
      engagement: "Our Engagement",
      anniversary: "Our Anniversary",
    } as Record<WeddingCategory, string>,
    families: "With the blessings of our families",
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

/** English ordinal suffix (th, st, nd, rd); other languages show the plain number. */
function ordSuffix(day: string, locale: string): string {
  const n = Number(day);
  if (locale !== "en" || !Number.isInteger(n)) return "";
  const v = n % 100;
  if (v >= 11 && v <= 13) return "th";
  return ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th";
}

const initial = (s: string) => (Array.from(s.trim())[0] ?? "").toUpperCase();

/* ------------------------------------------------------------------ */
/* Artwork. One 100 x 150 SVG (the card is 4 x 6in): watercolor        */
/* stains, gold glitter strokes, cream roses, olive leaves and gold    */
/* sprigs. Random scatter uses fixed seeds, so the screen view and     */
/* the PDF are always identical.                                       */
/* ------------------------------------------------------------------ */
type Pt = [number, number];
const f2 = (n: number) => Math.round(n * 100) / 100;

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cub = (a: Pt, b: Pt, c: Pt, d: Pt, t: number): Pt => {
  const u = 1 - t;
  return [u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]];
};

/* ---- watercolor stains: irregular smooth blobs ---- */
function blob(seed: number, cx: number, cy: number, rx: number, ry: number, k = 9, wob = 0.3) {
  const r = mulberry(seed);
  const p: Pt[] = [];
  for (let i = 0; i < k; i++) {
    const a = (Math.PI * 2 * i) / k;
    const m = 1 + (r() - 0.5) * 2 * wob;
    p.push([cx + Math.cos(a) * rx * m, cy + Math.sin(a) * ry * m]);
  }
  let d = `M${f2(p[0]![0])} ${f2(p[0]![1])}`;
  for (let i = 0; i < k; i++) {
    const p0 = p[(i - 1 + k) % k]!, p1 = p[i]!, p2 = p[(i + 1) % k]!, p3 = p[(i + 2) % k]!;
    d += `C${f2(p1[0] + (p2[0] - p0[0]) / 6)} ${f2(p1[1] + (p2[1] - p0[1]) / 6)} ${f2(p2[0] - (p3[0] - p1[0]) / 6)} ${f2(p2[1] - (p3[1] - p1[1]) / 6)} ${f2(p2[0])} ${f2(p2[1])}`;
  }
  return d + "Z";
}

const STAINS = [
  { d: blob(3, 94, 10, 32, 26), o: 0.24 },
  { d: blob(4, 98, 16, 17, 14, 8), o: 0.22 },
  { d: blob(5, 4, 142, 32, 24), o: 0.24 },
  { d: blob(6, 0, 148, 18, 13, 8), o: 0.22 },
  { d: blob(7, -4, 64, 15, 24), o: 0.17 },
  { d: blob(8, 104, 76, 14, 26), o: 0.17 },
  { d: blob(9, 52, -8, 30, 11), o: 0.14 },
];

const SPECKLES = (() => {
  const r = mulberry(11);
  let d = "";
  for (let i = 0; i < 150; i++) d += `M${f2(r() * 100)} ${f2(r() * 150)}h.01`;
  return d;
})();

/* ---- gold glitter: thousands of dots, grouped into 9 paths ---- */
const GOLDS = ["#e8cd88", "#cda553", "#a67f2e"];
const GLIT_W = [0.4, 0.68, 1.05];

class Glitter {
  b: string[] = Array(9).fill("");
  add(r: () => number, x: number, y: number) {
    const sz = r() < 0.6 ? 0 : r() < 0.86 ? 1 : 2;
    const c = Math.floor(r() * r() * 3 + r() * 0.6) % 3;
    this.b[sz * 3 + c] += `M${f2(x)} ${f2(y)}h.01`;
  }
}

function glitCurve(seed: number, curve: [Pt, Pt, Pt, Pt], n: number, w0: number, w1: number, bias = 1) {
  const r = mulberry(seed);
  const g = new Glitter();
  for (let i = 0; i < n; i++) {
    const t = r() ** bias;
    const c = cub(...curve, t);
    const c2 = cub(...curve, Math.min(1, t + 0.01));
    let dx = c2[0] - c[0], dy = c2[1] - c[1];
    const l = Math.hypot(dx, dy) || 1;
    dx /= l; dy /= l;
    const off = (r() - 0.5) * 2 * (w0 + (w1 - w0) * t) * (0.4 + 0.6 * Math.sin(Math.PI * Math.min(1, t * 0.9 + 0.05)));
    g.add(r, c[0] - dy * off, c[1] + dx * off);
  }
  return g.b;
}

function glitArc(seed: number, cx: number, cy: number, rad: number, th0: number, th1: number, n: number, wMax: number) {
  const r = mulberry(seed);
  const g = new Glitter();
  for (let i = 0; i < n; i++) {
    const u = r();
    const th = ((th0 + (th1 - th0) * u) * Math.PI) / 180;
    const w = Math.sin(Math.PI * u) ** 0.7 * wMax;
    const rr = rad + (r() - 0.5) * 2 * w;
    g.add(r, cx + Math.cos(th) * rr, cy + Math.sin(th) * rr);
  }
  return g.b;
}

const GL_TR = glitCurve(21, [[70, -3], [84, 8], [92, 17], [103, 31]], 1000, 2.6, 1.3, 1);
const GL_BL = glitCurve(22, [[-3, 126], [8, 133], [15, 144], [32, 153]], 900, 3.2, 1.5, 1);
const GL_VINE = glitCurve(23, [[15, 38], [6, 48], [3, 62], [9, 80]], 460, 1.7, 0.5, 1.15);
const GL_RING = glitArc(24, 50, 50, 44, 72, 268, 760, 2.6);

function GlitterPaths({ d }: { d: string[] }) {
  return (
    <>
      {d.map((p, i) =>
        p ? <path key={i} d={p} fill="none" stroke={GOLDS[i % 3]} strokeWidth={GLIT_W[Math.floor(i / 3)]} strokeLinecap="round" /> : null,
      )}
    </>
  );
}

/* ---- flowers, leaves, sprigs ---- */
const OLIVE = "M0 0C4-3 14-3.4 20 0C14 3.4 4 3 0 0Z";
const LEAFLET = "M0 0C1-1.1 3-1.3 4.6 0C3 1.3 1 1.1 0 0Z";
const place = (x: number, y: number, r: number, s: number) => `translate(${x} ${y}) rotate(${r}) scale(${s})`;

const Olive = ({ x, y, r, s }: { x: number; y: number; r: number; s: number }) => (
  <g transform={place(x, y, r, s)}>
    <path d={OLIVE} fill="url(#gi-olive)" fillOpacity=".96" />
    <path d="M1 0H18" stroke="#eef0dc" strokeOpacity=".4" strokeWidth=".3" fill="none" />
  </g>
);

function CreamRose({ x, y, s, rot = 0 }: { x: number; y: number; s: number; rot?: number }) {
  const edge = { stroke: "#c4a778", strokeOpacity: 0.55, strokeWidth: 0.32 };
  return (
    <g transform={place(x, y, rot, s)}>
      <g fill="url(#gi-petal)" {...edge}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <ellipse key={i} cx="0" cy="-9.8" rx="7.6" ry="8" transform={`rotate(${i * 51.4 + 8})`} />
        ))}
      </g>
      <g fill="url(#gi-petal2)" {...edge}>
        {[0, 1, 2, 3, 4].map((i) => (
          <ellipse key={i} cx="0" cy="-5.8" rx="5.6" ry="5.8" transform={`rotate(${i * 72 + 30})`} />
        ))}
      </g>
      <g fill="url(#gi-petal)" {...edge}>
        {[0, 1, 2].map((i) => (
          <ellipse key={i} cx="0" cy="-2.8" rx="3.7" ry="3.9" transform={`rotate(${i * 120 + 10})`} />
        ))}
      </g>
      <path d="M-1.6 .6C-1.8-1.8 1.9-2 1.9 .2C1.9 1.8-.8 2.1-1.4 .8" fill="none" stroke="#a88a5c" strokeOpacity=".7" strokeWidth=".4" strokeLinecap="round" />
      <g fill="none" strokeLinecap="round">
        <path d="M-12-6C-9-14-1-16 4-14" stroke="#fff" strokeOpacity=".8" strokeWidth=".8" />
        <path d="M12-3C13-9 9-14 4-15.4" stroke="#fff" strokeOpacity=".6" strokeWidth=".7" />
        <path d="M-9 8C-4 13 5 13 10 8" stroke="#bfa273" strokeOpacity=".45" strokeWidth=".6" />
        <path d="M-5 5C-2 7.6 3 7.6 5.5 5" stroke="#bfa273" strokeOpacity=".4" strokeWidth=".5" />
      </g>
    </g>
  );
}

function Blossom({ x, y, s, rot = 0 }: { x: number; y: number; s: number; rot?: number }) {
  return (
    <g transform={place(x, y, rot, s)}>
      <g fill="url(#gi-blossom)" stroke="#cbb88f" strokeOpacity=".6" strokeWidth=".3">
        {[0, 1, 2, 3, 4].map((i) => (
          <ellipse key={i} cx="0" cy="-5.4" rx="3.7" ry="5.4" transform={`rotate(${i * 72})`} />
        ))}
      </g>
      <g stroke="#c89c3c" strokeWidth=".25" fill="#e6c25f">
        {Array.from({ length: 9 }, (_, i) => {
          const a = (i * 40 * Math.PI) / 180;
          return (
            <g key={i}>
              <path d={`M0 0L${f2(Math.cos(a) * 2.6)} ${f2(Math.sin(a) * 2.6)}`} fill="none" />
              <circle cx={f2(Math.cos(a) * 2.8)} cy={f2(Math.sin(a) * 2.8)} r=".5" stroke="none" />
            </g>
          );
        })}
      </g>
      <circle r="1" fill="#d9ad45" />
    </g>
  );
}

function Sprig({ curve, n, s = 1 }: { curve: [Pt, Pt, Pt, Pt]; n: number; s?: number }) {
  const [a, b, c, d] = curve;
  const leaflets = Array.from({ length: n }, (_, i) => {
    const t = ((i + 1) / (n + 1)) * 0.96;
    const p = cub(a, b, c, d, t);
    const q = cub(a, b, c, d, Math.min(1, t + 0.02));
    const ang = (Math.atan2(q[1] - p[1], q[0] - p[0]) * 180) / Math.PI + (i % 2 ? 40 : -40);
    return <path key={i} d={LEAFLET} fill="url(#gi-gold)" transform={place(f2(p[0]), f2(p[1]), f2(ang), s * (1.2 - 0.5 * t))} />;
  });
  return (
    <g>
      <path d={`M${a[0]} ${a[1]}C${b[0]} ${b[1]} ${c[0]} ${c[1]} ${d[0]} ${d[1]}`} fill="none" stroke="#c9a24d" strokeWidth=".35" strokeLinecap="round" />
      {leaflets}
      <circle cx={d[0]} cy={d[1]} r=".7" fill="url(#gi-gold)" />
    </g>
  );
}

function Decor() {
  return (
    <svg className="gi-decor" viewBox="0 0 100 150" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      {/* watercolor stains */}
      {STAINS.map((st, i) => (
        <path key={i} d={st.d} fill="#cdb48c" fillOpacity={st.o} stroke="#b99b6d" strokeOpacity={st.o * 0.45} strokeWidth=".2" />
      ))}
      <path d={SPECKLES} fill="none" stroke="#a88f66" strokeOpacity=".2" strokeWidth=".35" strokeLinecap="round" />

      {/* gold glitter strokes */}
      <GlitterPaths d={GL_TR} />
      <GlitterPaths d={GL_BL} />
      <GlitterPaths d={GL_VINE} />

      {/* top-left bouquet */}
      <g>
        <Sprig curve={[[24, 14], [28, 5], [36, 2], [45, 6]]} n={9} />
        <Sprig curve={[[14, 8], [17, -1], [24, -4], [31, -1]]} n={6} />
        <Sprig curve={[[14, 38], [7, 48], [4, 62], [8, 78]]} n={13} />
        <Sprig curve={[[20, 38], [18, 46], [14, 53], [14, 60]]} n={6} />
        {([
          [4, 6, 35, 0.95], [14, 1, -60, 0.8], [2, 20, 10, 0.9], [3, 33, -30, 0.8],
          [22, 30, 70, 0.85], [19, 43, 80, 0.75], [31, 26, 40, 0.6], [28, 8, -40, 0.7],
        ] as Array<[number, number, number, number]>).map(([x, y, r, s], i) => (
          <Olive key={i} x={x} y={y} r={r} s={s} />
        ))}
        <Blossom x={10} y={28} s={0.95} rot={10} />
        <CreamRose x={17} y={16} s={0.85} rot={10} />
        <Blossom x={31} y={9} s={0.5} rot={30} />
        <Blossom x={25} y={40} s={0.5} rot={-20} />
        <Blossom x={27} y={4} s={0.45} rot={80} />
      </g>

      {/* bottom-right bouquet */}
      <g>
        <Sprig curve={[[80, 128], [82, 112], [88, 96], [92, 82]]} n={12} />
        <Sprig curve={[[72, 138], [74, 126], [80, 120], [84, 118]]} n={6} />
        <Sprig curve={[[94, 110], [95, 100], [98, 92], [99, 86]]} n={7} />
        {([
          [98, 112, -70, 1], [80, 108, -150, 0.85], [99, 140, -100, 0.9], [84, 146, -170, 0.9],
          [92, 148, -80, 0.9], [75, 118, -170, 0.7], [97, 126, -20, 0.8],
        ] as Array<[number, number, number, number]>).map(([x, y, r, s], i) => (
          <Olive key={i} x={x} y={y} r={r} s={s} />
        ))}
        <Blossom x={90} y={106} s={0.95} rot={20} />
        <CreamRose x={97.5} y={119} s={0.5} rot={25} />
        <CreamRose x={87} y={130} s={0.85} rot={-15} />
        <Blossom x={79} y={141} s={0.5} rot={50} />
      </g>
    </svg>
  );
}

/* ---- the gold wreath around the monogram ---- */
function Ring() {
  const laurel = Array.from({ length: 10 }, (_, i) => {
    const th = ((95 - i * 8.2) * Math.PI) / 180;
    const x = 50 + Math.cos(th) * 46;
    const y = 50 + Math.sin(th) * 46;
    const tang = (Math.atan2(-Math.cos(th), Math.sin(th)) * 180) / Math.PI;
    const s = 0.75 + (i > 6 ? 0.25 : 0.05 * i);
    return (
      <g key={i}>
        <g transform={place(f2(x), f2(y), f2(tang + 38), s)}>
          <path d="M0 0C2-2.4 7-2.6 10 0C7 2.6 2 2.4 0 0Z" />
          <path d="M.6 0H8.6" />
        </g>
        <g transform={place(f2(x), f2(y), f2(tang - 38), s * 0.9)}>
          <path d="M0 0C2-2.4 7-2.6 10 0C7 2.6 2 2.4 0 0Z" />
          <path d="M.6 0H8.6" />
        </g>
      </g>
    );
  });
  const pt = (deg: number): string => {
    const a = (deg * Math.PI) / 180;
    return `${f2(50 + Math.cos(a) * 44)} ${f2(50 + Math.sin(a) * 44)}`;
  };
  return (
    <svg className="gi-ring-svg" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <GlitterPaths d={GL_RING} />
      <path d={`M${pt(274)}A44 44 0 0 1 ${pt(392)}`} fill="none" stroke="#c9a24d" strokeWidth=".45" strokeLinecap="round" />
      <path d={`M${pt(95)}A46 46 0 0 0 ${pt(14)}`} fill="none" stroke="#c9a24d" strokeWidth=".4" strokeLinecap="round" />
      <g fill="none" stroke="#b88a3e" strokeWidth=".4" strokeLinejoin="round" strokeLinecap="round">
        {laurel}
      </g>
    </svg>
  );
}

/** Thin gold rule with a small fleuron in the middle. */
const Flourish = () => (
  <svg className="gi-flourish" viewBox="0 0 120 18" aria-hidden="true" focusable="false">
    <g stroke="#c9a24d" strokeWidth=".7" strokeLinecap="round" fill="none">
      <path d="M4 9H42M78 9H116" />
      <path d="M60 2.4C56.6 5.6 56.6 12.4 60 15.6C63.4 12.4 63.4 5.6 60 2.4Z" fill="#c9a24d" fillOpacity=".25" />
      <path d="M53.5 9C52 5 47.5 4.6 46 7.6C47 9.6 50 9.6 51 7.8" />
      <path d="M66.5 9C68 5 72.5 4.6 74 7.6C73 9.6 70 9.6 69 7.8" />
      <path d="M53.5 9C52 13 47.5 13.4 46 10.4C47 8.4 50 8.4 51 10.2" />
      <path d="M66.5 9C68 13 72.5 13.4 74 10.4C73 8.4 70 8.4 69 10.2" />
    </g>
  </svg>
);

/* ------------------------------------------------------------------ */
/* The three pages                                                     */
/* ------------------------------------------------------------------ */
function PageInvite({ data }: { data: WeddingCardView }) {
  const { t, locale, tz, eventDate, cat } = derive(data);
  const time = eventDate ? clock(eventDate, tz) : null;
  const longest = Math.max(data.brideName.length, data.groomName.length);
  const nameSize = longest > 16 ? 6.4 : longest > 12 ? 8.2 : longest > 8 ? 10.4 : 12.6;
  const day = eventDate ? fmt(eventDate, locale, tz, { day: "numeric" }) : "";

  return (
    <div className="gi-inner">
      <div className="gi-ring">
        <Ring />
        <p className="gi-mono" aria-hidden="true">
          <b>{initial(data.brideName)}</b>
          <i>&amp;</i>
          <b>{initial(data.groomName)}</b>
        </p>
      </div>

      <p className="gi-caps gi-invited">{t.invited}</p>
      <p className="gi-script gi-of">{t.of[cat]}</p>

      <h1 className="gi-names" style={{ fontSize: `${nameSize}cqw` }}>
        <span>{data.brideName}</span>
        <span className="gi-and" aria-label={t.and}>
          <i />
          <b>{t.and}</b>
          <i />
        </span>
        <span>{data.groomName}</span>
      </h1>

      {eventDate && (
        <div className="gi-date">
          <p className="gi-caps gi-weekday">{fmt(eventDate, locale, tz, { weekday: "long" })}</p>
          <p className="gi-dateline">
            <span>
              {day}
              {ordSuffix(day, locale) && <sup className="gi-ord">{ordSuffix(day, locale)}</sup>}
            </span>
            <i />
            <span>{fmt(eventDate, locale, tz, { month: "long" })}</span>
            <i />
            <span>{fmt(eventDate, locale, tz, { year: "numeric" })}</span>
          </p>
          {time && (
            <p className="gi-caps gi-time">
              {t.at} {fmt(eventDate, locale, tz, { hour: "numeric", minute: "2-digit", hour12: true })}
            </p>
          )}
        </div>
      )}

      {(data.venueName || data.venueAddress) && (
        <div className="gi-venue">
          {data.venueName && <p className="gi-script gi-venue-name">{data.venueName}</p>}
          {data.venueAddress && <p className="gi-caps gi-addr">{data.venueAddress}</p>}
        </div>
      )}

      <p className="gi-caps gi-bless">{data.hostLine ?? t.blessing}</p>
      <Flourish />
    </div>
  );
}

function PageDetails({ data, active }: { data: WeddingCardView; active: boolean }) {
  const { t, locale, tz, cat } = derive(data);
  const showParents = cat !== "anniversary" && (data.brideParents || data.groomParents);
  const events = [...data.events].sort((a, b) => (parseDate(a.date)?.getTime() ?? 0) - (parseDate(b.date)?.getTime() ?? 0));
  const mapUrl = safeHttpUrl(data.mapUrl);

  return (
    <div className="gi-inner">
      <p className="gi-script gi-script--title">{t.details[cat]}</p>
      <Flourish />

      {showParents && (
        <>
          <p className="gi-caps gi-caps--small gi-soft">{t.families}</p>
          <div className="gi-parents">
            {data.brideParents && (
              <p className="gi-caps">
                <span className="gi-label">{t.daughterOf}</span>
                <br />
                <span className="gi-strong">{data.brideParents}</span>
              </p>
            )}
            {data.groomParents && (
              <p className="gi-caps">
                <span className="gi-label">{t.sonOf}</span>
                <br />
                <span className="gi-strong">{data.groomParents}</span>
              </p>
            )}
          </div>
        </>
      )}

      {data.yearsTogether != null && <p className="gi-script">{t.years(data.yearsTogether)}</p>}

      {events.length > 0 && (
        <>
          {(showParents || data.yearsTogether != null) && <Flourish />}
          <ul className="gi-events" aria-label={t.celebrations}>
            {events.map((ev, i) => {
              const d = parseDate(ev.date)!;
              const c = clock(d, tz);
              const when = fmt(d, locale, tz, { weekday: "short", month: "short", day: "numeric" });
              const atTime = ev.startTime ?? (c ? fmt(d, locale, tz, { hour: "numeric", minute: "2-digit" }) : null);
              return (
                <li key={`${ev.name}-${i}`}>
                  <span className="gi-event-name">{ev.name}</span>
                  <span className="gi-caps gi-caps--small">
                    {when}
                    {atTime ? `, ${atTime}` : ""}
                  </span>
                  {(ev.venueName || ev.venueAddress) && <span className="gi-caps gi-caps--small gi-soft">{[ev.venueName, ev.venueAddress].filter(Boolean).join(", ")}</span>}
                </li>
              );
            })}
          </ul>
        </>
      )}

      {mapUrl && (
        <a className="gi-link" href={mapUrl} target="_blank" rel="noopener noreferrer" tabIndex={active ? 0 : -1}>
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
    <div className="gi-inner">
      {data.invitationMessage && (
        <>
          <p className="gi-message">{data.invitationMessage}</p>
          {(rsvpDate || hasContact) && <Flourish />}
        </>
      )}

      {rsvpDate && (
        <p className="gi-caps">
          {t.rsvpBy}
          <br />
          <span className="gi-accent">{fmt(rsvpDate, locale, tz, { month: "long", day: "numeric", year: "numeric" })}</span>
        </p>
      )}
      {hasContact && (
        <p className="gi-caps">
          {data.rsvpContactName}
          {data.rsvpContactName && (data.rsvpPhone || data.rsvpEmail) && <br />}
          {data.rsvpPhone && (
            <a className="gi-plain" href={`tel:${data.rsvpPhone.replace(/[^\d+]/g, "")}`} tabIndex={tab}>
              {data.rsvpPhone}
            </a>
          )}
          {data.rsvpPhone && data.rsvpEmail && <br />}
          {data.rsvpEmail && (
            <a className="gi-plain gi-email" href={`mailto:${data.rsvpEmail}`} tabIndex={tab}>
              {data.rsvpEmail}
            </a>
          )}
        </p>
      )}
      {data.dressCode && (
        <p className="gi-caps">
          <span className="gi-accent">{t.dressCode}:</span> {data.dressCode}
        </p>
      )}
      {data.additionalNotes && (
        <p className="gi-caps gi-caps--small gi-notes">
          <span className="gi-accent">{t.goodToKnow}:</span> {data.additionalNotes}
        </p>
      )}

      <Flourish />
      <p className="gi-script gi-script--closing">{t.closing}</p>
      {hashtag && <p className="gi-caps gi-caps--small gi-accent">{hashtag}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The template definition: this is the ONE thing the shells need.     */
/* ------------------------------------------------------------------ */
export const gildedIvory: TemplateDefinition<WeddingCardView> = {
  rootClass: "gi",
  size: { widthIn: 4, heightIn: 6 },
  fonts: ["Great Vibes", "Cormorant Garamond"],
  css: templateCss(),
  defs: (
    <>
      <linearGradient id="gi-gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ecd291" />
        <stop offset="0.5" stopColor="#c9a24d" />
        <stop offset="1" stopColor="#9c7a2c" />
      </linearGradient>
      <radialGradient id="gi-petal" cx="0.5" cy="0.4" r="0.7">
        <stop offset="0" stopColor="#fffdf6" />
        <stop offset="1" stopColor="#efe0c3" />
      </radialGradient>
      <radialGradient id="gi-petal2" cx="0.42" cy="0.38" r="0.75">
        <stop offset="0" stopColor="#fffaf0" />
        <stop offset="1" stopColor="#e6d3af" />
      </radialGradient>
      <radialGradient id="gi-blossom" cx="0.5" cy="0.7" r="0.8">
        <stop offset="0" stopColor="#f1e3c4" />
        <stop offset="1" stopColor="#fffefa" />
      </radialGradient>
      <linearGradient id="gi-olive" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#7d8767" />
        <stop offset="1" stopColor="#4f5b43" />
      </linearGradient>
    </>
  ),
  Decor,
  pages: [
    { label: "Invitation", render: (d) => <PageInvite data={d} /> },
    { label: "Details", render: (d, active) => <PageDetails data={d} active={active} /> },
    { label: "RSVP", render: (d, active) => <PageRsvp data={d} active={active} /> },
  ],
};

/* ------------------------------------------------------------------ */
/* Template styles. Sizes use cqw so the card scales as one unit:      */
/* the same CSS gives the on-screen card and the 4x6in PDF page.       */
/* ------------------------------------------------------------------ */
function templateCss() {
  return `
@import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Great+Vibes&display=swap");

.gi{
  --card-accent:#b88a3e;--card-accent-hi:#6b4a22;--card-ink:#5d4632;--card-font:"Cormorant Garamond",Georgia,serif;
  --card-paper:
    radial-gradient(70% 38% at 46% 24%,rgba(255,252,243,.8),transparent 70%),
    radial-gradient(60% 34% at 50% 60%,rgba(255,250,238,.55),transparent 70%),
    linear-gradient(#f6efe1,#efe4d0);
  --card-back:linear-gradient(90deg,#dccfb5,#f1e8d6);
  --card-stage:radial-gradient(90% 60% at 50% 0%,#f3ead9 0%,#b9a283 100%);
  --card-stage-guest:radial-gradient(90% 70% at 50% 40%,#e8dcc4 0%,#85704f 100%);
  --card-btn-bg:rgba(255,251,242,.9);--card-btn-hover:#fffbf2;--card-btn-border:rgba(184,138,62,.65);
  --card-pad-x:14cqw;--card-pad-y:8cqw;
  --gold:#b88a3e;--gold-line:#c9a24d;--name:#8f6430;--brown:#5d4632}
.gi *{box-sizing:border-box}
/* The shell darkens the spine edge for dark cards; keep it soft on this light paper. */
.gi .fb-front::after{background:linear-gradient(90deg,rgba(90,65,30,.16),transparent 7%)}

.gi-decor{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}

.gi-inner{margin-block:auto;display:flex;flex-direction:column;align-items:center;text-align:center;gap:1cqw}
.gi-inner p,.gi-inner h1,.gi-inner ul{margin:0}

.gi-caps{font-family:"Cormorant Garamond",Georgia,serif;font-weight:600;font-size:3cqw;line-height:1.5;letter-spacing:.17em;text-transform:uppercase;color:var(--brown);overflow-wrap:anywhere}
.gi-caps--small{font-size:2.5cqw}
.gi-soft{opacity:.75}
.gi-strong{color:var(--name)}
.gi-accent{color:var(--gold)}
.gi-label{font-size:2.3cqw;opacity:.75}
.gi-script{font-family:"Great Vibes","Brush Script MT",cursive;font-size:5.4cqw;line-height:1.25;color:var(--name)}
.gi-script--title{font-size:8cqw}
.gi-script--closing{font-size:5.6cqw}

.gi-ring{position:relative;flex:none;width:32cqw;height:32cqw;display:grid;place-items:center}
.gi-ring-svg{position:absolute;inset:-2cqw;width:calc(100% + 4cqw);height:calc(100% + 4cqw);pointer-events:none}
.gi-mono{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;gap:.6cqw;font-family:"Great Vibes","Brush Script MT",cursive;color:var(--name);line-height:1}
.gi-mono b{font-weight:400;font-size:13cqw}
.gi-mono b:first-child{transform:translateY(-1.4cqw)}
.gi-mono b:last-child{transform:translateY(1.6cqw)}
.gi-mono i{font-style:normal;font-size:4.6cqw;transform:translateY(-.4cqw)}

.gi-invited{margin-top:1cqw;font-size:3.2cqw}
.gi-of{font-size:6.6cqw;line-height:1.1}

.gi-names{font-family:"Great Vibes","Brush Script MT",cursive;font-weight:400;line-height:1.08;color:var(--name);display:flex;flex-direction:column;align-items:center;max-width:100%;overflow-wrap:anywhere}
.gi-names>span{display:block}
.gi-and{display:flex !important;align-items:center;justify-content:center;gap:2.4cqw;margin-block:.4cqw}
.gi-and b{font-family:"Cormorant Garamond",Georgia,serif;font-weight:600;font-size:3.1cqw;letter-spacing:.2em;text-transform:uppercase;color:var(--brown)}
.gi-and i{display:block;width:14cqw;height:1px;background:var(--gold-line)}

.gi-date{display:grid;justify-items:center;gap:.3cqw;width:100%;margin-top:1.4cqw}
.gi-weekday{display:flex;align-items:center;gap:2.4cqw;width:100%;font-size:3.4cqw}
.gi-weekday::before,.gi-weekday::after{content:"";flex:1;height:1px;background:var(--gold-line)}
.gi-dateline{display:flex;align-items:center;justify-content:center;gap:2.6cqw;font-family:"Cormorant Garamond",Georgia,serif;font-weight:600;font-size:5.4cqw;letter-spacing:.1em;text-transform:uppercase;color:var(--brown);line-height:1.3}
.gi-dateline i{display:block;width:1px;height:5.4cqw;background:var(--brown);opacity:.8}
.gi-ord{font-size:.58em;vertical-align:.5em;letter-spacing:.04em;line-height:0}
.gi-time{font-size:3.2cqw}

.gi-venue{display:grid;justify-items:center;gap:0;margin-top:1.2cqw}
.gi-venue-name{font-size:6.6cqw;line-height:1.15}
.gi-addr{font-size:2.9cqw}
.gi-bless{margin-top:1.4cqw;font-size:2.5cqw}
.gi-flourish{width:26cqw;height:auto;flex:none}

.gi-parents{display:grid;gap:1.8cqw}
.gi-events{list-style:none;padding:0;display:grid;gap:3cqw;width:100%}
.gi-events li{display:flex;flex-direction:column;align-items:center;gap:.3cqw}
.gi-event-name{font-family:"Great Vibes","Brush Script MT",cursive;font-size:6.2cqw;line-height:1.15;color:var(--name)}

.gi-message{font-family:"Cormorant Garamond",Georgia,serif;font-style:italic;font-weight:500;font-size:4.4cqw;line-height:1.5;white-space:pre-line;overflow-wrap:anywhere;text-wrap:pretty;color:var(--brown)}
.gi-notes{max-width:62cqw}

.gi-link{color:var(--name);font-family:"Cormorant Garamond",Georgia,serif;font-weight:600;font-size:2.8cqw;letter-spacing:.18em;text-transform:uppercase;text-decoration:none;padding-block:1cqw;border-bottom:1px solid var(--gold-line)}
.gi-plain{color:inherit;text-decoration:none}
.gi-email{letter-spacing:.06em;text-transform:none}
.gi-link:focus-visible,.gi-plain:focus-visible{outline:2px solid var(--name);outline-offset:3px}
`;
}
