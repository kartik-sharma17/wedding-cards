import type { TemplateDefinition } from "@/components/card/types";
import { parseDate, safeHttpUrl, type WeddingCardView, type WeddingCategory } from "./RajwadaRomanceData";

/* ------------------------------------------------------------------ */
/* Copy. Add another language by adding a key here (e.g. `hi`).        */
/* ------------------------------------------------------------------ */
const STRINGS = {
  en: {
    host: "Together with our families",
    invite: {
      wedding: "we joyfully invite you to celebrate the wedding of",
      reception: "we joyfully invite you to celebrate the wedding reception of",
      engagement: "we joyfully invite you to celebrate the engagement of",
      anniversary: "we joyfully invite you to celebrate the anniversary of",
    } as Record<WeddingCategory, string>,
    tag: {
      wedding: ["Two souls. One promise.", "a lifetime together."],
      reception: ["Two hearts. One celebration.", "joy, shared with you."],
      engagement: ["Two hearts. One yes.", "the start of forever."],
      anniversary: ["Years of love. Many more ahead.", "still choosing each other."],
    } as Record<WeddingCategory, [string, string]>,
    saveDate: "Save the date",
    at: "At",
    details: {
      wedding: "The Celebrations",
      reception: "The Reception",
      engagement: "The Engagement",
      anniversary: "The Anniversary",
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

/* ------------------------------------------------------------------ */
/* Artwork. One 100 x 140 SVG (the card is 5 x 7in) drawn back to      */
/* front: palace, lake, jaali railing, gold arch, bells, bougainvillea */
/* and the rose bouquets. Random scatter uses a fixed seed, so the     */
/* screen view and the PDF are always identical.                       */
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

/* ---- gold scalloped (cusped) arch ---- */
const ARCH = (() => {
  const P0: Pt = [9, 72], P1: Pt = [9, 40], P2: Pt = [38, 30], P3: Pt = [50, 7];
  const N = 7;
  const pts: Pt[] = [];
  const tick: Pt[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    pts.push(cub(P0, P1, P2, P3, t));
    const q = cub(P0, P1, P2, P3, Math.min(1, t + 0.01));
    const p = cub(P0, P1, P2, P3, Math.max(0, t - 0.01));
    const dx = q[0] - p[0], dy = q[1] - p[1];
    const l = Math.hypot(dx, dy) || 1;
    tick.push([dy / l, -dx / l]); // outward normal on the left side
  }
  let d = "M9 142L9 72";
  for (let i = 1; i <= N; i++) {
    const prev = pts[i - 1]!, current = pts[i]!;
    const c = Math.hypot(current[0] - prev[0], current[1] - prev[1]);
    const r = f2(c * 0.62);
    d += `A${r} ${r} 0 0 1 ${f2(current[0])} ${f2(current[1])}`;
  }
  for (let i = N - 1; i >= 0; i--) {
    const current = pts[i]!, next = pts[i + 1]!;
    const c = Math.hypot(current[0] - next[0], current[1] - next[1]);
    const r = f2(c * 0.62);
    d += `A${r} ${r} 0 0 1 ${f2(100 - current[0])} ${f2(current[1])}`;
  }
  d += "L91 142";
  let ticks = "";
  for (let i = 1; i < N; i++) {
    const [x, y] = pts[i]!;
    const [nx, ny] = tick[i]!;
    ticks += `M${f2(x)} ${f2(y)}L${f2(x + nx * 1.7)} ${f2(y + ny * 1.7)}`;
    ticks += `M${f2(100 - x)} ${f2(y)}L${f2(100 - x - nx * 1.7)} ${f2(y + ny * 1.7)}`;
  }
  return { d, ticks };
})();

/* ---- bougainvillea: a vine with twigs, leaves and three-bract flowers ---- */
function vine(seed: number, curve: [Pt, Pt, Pt, Pt], n: number, leavesN: number, w0: number, w1: number, bias: number) {
  const r = mulberry(seed);
  const along = (t: number, off: number): Pt => {
    const c = cub(...curve, t);
    const c2 = cub(...curve, Math.min(1, t + 0.01));
    let dx = c2[0] - c[0], dy = c2[1] - c[1];
    const l = Math.hypot(dx, dy) || 1;
    dx /= l; dy /= l;
    return [c[0] - dy * off, c[1] + dx * off];
  };
  const wAt = (t: number) => w0 + (w1 - w0) * t;
  const leaves: { x: number; y: number; rot: number; s: number }[] = [];
  const flowers: { x: number; y: number; rot: number; s: number; tone: number }[] = [];
  const twigs: string[] = [];
  for (let i = 0; i < leavesN; i++) {
    const t = r() ** bias;
    const [x, y] = along(t, (r() - 0.5) * 2 * wAt(t) * 1.15);
    leaves.push({ x: f2(x), y: f2(y), rot: f2(r() * 360), s: f2(0.55 + r() * 0.5) });
  }
  for (let i = 0; i < n; i++) {
    const t = r() ** bias;
    const [x, y] = along(t, (r() - 0.5) * 2 * wAt(t));
    flowers.push({ x: f2(x), y: f2(y), rot: f2(r() * 360), s: f2((0.5 + r() * 0.42) * (1 - 0.25 * t)), tone: Math.floor(r() * 4) });
    if (i % 3 === 0) {
      const b = cub(...curve, t);
      twigs.push(`M${f2(b[0])} ${f2(b[1])}L${f2(x)} ${f2(y)}`);
    }
  }
  const [a, b, c, d] = curve;
  return { leaves, flowers, twigs: twigs.join(""), stem: `M${a[0]} ${a[1]}C${b[0]} ${b[1]} ${c[0]} ${c[1]} ${d[0]} ${d[1]}` };
}

type VineSpec = {
  leaves: { x: number; y: number; rot: number; s: number }[];
  flowers: { x: number; y: number; rot: number; s: number; tone: number }[];
  twigs: string;
  stem: string;
};

const VINES: VineSpec[] = [
  vine(7, [[101, 3], [86, 9], [70, -1], [50, 3]], 120, 80, 7, 4.5, 1.1),
  vine(21, [[94, -4], [105, 26], [90, 52], [98, 78]], 190, 110, 9, 4.5, 1.35),
];

const LEAF_P = "M0 0C1-1.3 3.8-1.5 6.4 0C3.8 1.5 1 1.3 0 0Z";
const BRACT = "M0 0C-1.7-.6-2-2.5 0-3C2-2.5 1.7-.6 0 0Z";

function Bract({ x, y, rot, s, tone }: { x: number; y: number; rot: number; s: number; tone: number }) {
  const fill = `url(#rr-b${tone})`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <g fill={fill} fillOpacity=".95" stroke="#fff" strokeOpacity=".22" strokeWidth=".25">
        <path d={BRACT} transform="rotate(0)" />
        <path d={BRACT} transform="rotate(118)" />
        <path d={BRACT} transform="rotate(238)" />
      </g>
      <circle r=".38" fill="#fbeec9" />
    </g>
  );
}

function Vine({ v }: { v: (typeof VINES)[number] }) {
  return (
    <g>
      <path d={v.stem} fill="none" stroke="#6b6a43" strokeWidth=".45" strokeLinecap="round" />
      <path d={v.twigs} fill="none" stroke="#6b6a43" strokeWidth=".22" strokeLinecap="round" />
      {v.leaves.map((l, i) => (
        <path key={i} d={LEAF_P} fill="url(#rr-leaf)" fillOpacity=".92" transform={`translate(${l.x} ${l.y}) rotate(${l.rot}) scale(${l.s})`} />
      ))}
      {v.flowers.map((f, i) => (
        <Bract key={i} {...f} />
      ))}
    </g>
  );
}

/* ---- baby's-breath sprays for the bottom bouquets ---- */
function gyp(seed: number, bases: Pt[], mirror: boolean) {
  const r = mulberry(seed);
  let stems = "";
  const dots: { x: number; y: number; r: number }[] = [];
  for (const [bx0, by] of bases) {
    const bx = mirror ? 100 - bx0 : bx0;
    for (let k = 0; k < 7; k++) {
      const ang = ((-90 + (r() - 0.5) * 130) * Math.PI) / 180;
      const len = 8 + r() * 17;
      const ex = bx + Math.cos(ang) * len;
      const ey = by + Math.sin(ang) * len;
      const cx = bx + Math.cos(ang) * len * 0.5 + (r() - 0.5) * 3;
      const cy = by + Math.sin(ang) * len * 0.5;
      stems += `M${f2(bx)} ${f2(by)}Q${f2(cx)} ${f2(cy)} ${f2(ex)} ${f2(ey)}`;
      const m = 6 + Math.floor(r() * 5);
      for (let j = 0; j < m; j++) {
        const t = 0.45 + r() * 0.55;
        const px = (1 - t) * (1 - t) * bx + 2 * (1 - t) * t * cx + t * t * ex + (r() - 0.5) * 2.6;
        const py = (1 - t) * (1 - t) * by + 2 * (1 - t) * t * cy + t * t * ey + (r() - 0.5) * 2.6;
        dots.push({ x: f2(px), y: f2(py), r: f2(0.42 + r() * 0.4) });
      }
    }
  }
  return { stems, dots };
}
const GYP_L = gyp(5, [[6, 134], [15, 138], [25, 140], [2, 126], [10, 140]], false);
const GYP_R = gyp(9, [[6, 134], [15, 138], [25, 140], [2, 126], [10, 140]], true);

function Gyp({ g }: { g: ReturnType<typeof gyp> }) {
  return (
    <g>
      <path d={g.stems} fill="none" stroke="#7f9570" strokeWidth=".28" strokeLinecap="round" />
      <g fill="#fffaf0" fillOpacity=".95" stroke="#e8dcc6" strokeWidth=".08">
        {g.dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={d.r} />
        ))}
      </g>
    </g>
  );
}

function Rose({ x, y, s, kind }: { x: number; y: number; s: number; kind: "p" | "r" }) {
  const g = `url(#rr-rose-${kind})`;
  const line = kind === "p" ? "#b5675a" : "#4d0c1c";
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g fill={g} fillOpacity=".88" stroke="#fff" strokeOpacity=".25" strokeWidth=".4">
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <ellipse key={a} cx="0" cy="-8.6" rx="6.4" ry="6" transform={`rotate(${a + 12})`} />
        ))}
      </g>
      <circle r="9.6" fill={g} />
      <g fill="none" stroke={line} strokeOpacity=".4" strokeWidth=".55" strokeLinecap="round">
        <path d="M-7-2C-4-8 5-7.5 7-1" />
        <path d="M-5.6 3C-2-4 5-3 5.4 3" />
        <path d="M-3.2 0C-1-3 2-2 2 1" />
        <path d="M-7.5 4C-4 8.5 4 8.5 7.5 4" />
      </g>
      <path d="M-6-3C-3-7.5 3-8 6.5-4" fill="none" stroke="#fff" strokeOpacity=".32" strokeWidth=".6" strokeLinecap="round" />
    </g>
  );
}

const Leaf = ({ x, y, rot, s }: { x: number; y: number; rot: number; s: number }) => (
  <path d={LEAF_P} fill="url(#rr-leaf2)" fillOpacity=".95" transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} />
);

/* ---- hanging bells (top left) ---- */
function Bells() {
  const beads = (x: number, y0: number, y1: number) =>
    Array.from({ length: Math.floor((y1 - y0) / 1.5) }, (_, i) => <circle key={i} cx={x} cy={y0 + i * 1.5} r=".36" fill="#f6efe0" stroke="#d9c9a6" strokeWidth=".1" />);
  return (
    <g>
      <path d="M5.5 0V26M11.8 0V11" stroke="#b8914f" strokeWidth=".18" />
      {beads(5.5, 1, 22)}
      {beads(11.8, 1, 10)}
      <g transform="translate(5.5 31)">
        <circle cy="-5.4" r=".9" fill="url(#rr-gold)" />
        <path d="M-4 5C-4 0-3.2-4 0-4.8C3.2-4 4 0 4 5Q0 6.8-4 5Z" fill="url(#rr-gold)" />
        <path d="M-4 5Q0 6.8 4 5" fill="none" stroke="#8a6a2f" strokeWidth=".3" />
        <circle cy="6.9" r="1" fill="url(#rr-gold)" />
      </g>
      <g transform="translate(11.8 15.5)">
        <circle r="3" fill="url(#rr-gold)" />
        <path d="M-3 .3Q0 1.6 3 .3" fill="none" stroke="#8a6a2f" strokeWidth=".3" />
        <circle cy="-3.8" r=".8" fill="url(#rr-gold)" />
      </g>
    </g>
  );
}

/* ---- palace, chhatri, lake and jaali railing ---- */
function windows(x0: number, y: number, count: number, step: number) {
  return Array.from({ length: count }, (_, i) => <path key={`${x0}-${y}-${i}`} d={`M${f2(x0 + i * step)} ${y}v-2.6a.85 .85 0 0 1 1.7 0v2.6Z`} />);
}

function Architecture() {
  return (
    <g>
      {/* distant domes across the lake */}
      <g fill="url(#rr-stone)" opacity=".34">
        <rect x="64" y="108" width="19" height="9" />
        <path d="M67 108C67 99 73.5 96 73.5 96C73.5 96 80 99 80 108Z" />
        <path d="M71.5 96V93.4" stroke="#a48a64" strokeWidth=".3" />
        <path d="M57 112C57 106 61 104 61 104C61 104 65 106 65 112Z" />
        <rect x="56" y="112" width="10" height="5" />
      </g>

      {/* left palace */}
      <g fill="url(#rr-stone)" opacity=".7">
        <rect x="0" y="101" width="33" height="24" />
        <rect x="0" y="72" width="6.8" height="40" />
        <path d="M-.4 72C-.4 67 3.4 64.5 3.4 64.5C3.4 64.5 7.2 67 7.2 72Z" />
        <rect x="9.2" y="84" width="11.2" height="24" />
        <path d="M8 84C8 75 14.8 70.5 14.8 70.5C14.8 70.5 21.6 75 21.6 84Z" />
        <rect x="22.2" y="88" width="6.4" height="20" />
        <path d="M21.6 88C21.6 83 25.4 81 25.4 81C25.4 81 29.2 83 29.2 88Z" />
        <rect x="-1" y="98" width="35" height="2.2" />
        <rect x="8.4" y="82" width="12.8" height="2" />
      </g>
      <g stroke="#a48a64" strokeWidth=".28" opacity=".7">
        <path d="M3.4 64.5V61.8M14.8 70.5V66.4M25.4 81V78.4" />
      </g>
      <g fill="#a48a64" opacity=".5">
        {windows(1.5, 86, 2, 3)}
        {windows(1.5, 96, 2, 3)}
        {windows(10.8, 96, 4, 2.4)}
        {windows(10.8, 90, 3, 3)}
        {windows(23.4, 98, 2, 2.8)}
        {windows(2, 108, 9, 3.4)}
        {windows(2, 116, 9, 3.4)}
      </g>

      {/* chhatri on the right */}
      <g fill="url(#rr-stone)" opacity=".85">
        <path d="M84 80C84 71 93 66 93 66C93 66 102 71 102 80Z" />
        <rect x="81.5" y="80" width="21" height="3.4" />
        <rect x="82.5" y="83.4" width="19.5" height="1.8" />
        <rect x="84" y="85" width="1.8" height="35" />
        <rect x="90.2" y="85" width="1.8" height="35" />
        <rect x="96.4" y="85" width="1.8" height="35" />
        <rect x="93.8" y="85" width=".7" height="35" opacity=".7" />
      </g>
      <g stroke="#a48a64" strokeWidth=".3" opacity=".8">
        <path d="M93 66V62.6" />
      </g>
      <g fill="#a48a64" opacity=".5">
        <path d="M85.8 96V92a2.2 2.2 0 0 1 4.4 0V96Z" />
        <path d="M92 96V92a2.2 2.2 0 0 1 4.4 0V96Z" />
      </g>

      {/* lake */}
      <rect x="0" y="119" width="100" height="21" fill="url(#rr-water)" />
      <g stroke="#fff" strokeOpacity=".3" strokeWidth=".25">
        <path d="M34 123H64M38 126H62M30 129.5H70" />
      </g>
    </g>
  );
}

function Parapet() {
  return (
    <g>
      <g fill="url(#rr-stone)" opacity=".92">
        <rect x="38" y="127" width="3.2" height="13" />
        <circle cx="39.6" cy="125.6" r="1.7" />
        <rect x="58.8" y="127" width="3.2" height="13" />
        <circle cx="60.4" cy="125.6" r="1.7" />
        <rect x="41.2" y="130" width="17.6" height="10" />
      </g>
      <g fill="none" stroke="#a48a64" strokeOpacity=".7" strokeWidth=".3">
        {[0, 1, 2, 3].map((i) =>
          [0, 1].map((j) => (
            <path key={`${i}-${j}`} d={`M${43 + i * 4} ${132.4 + j * 4}l2 -1.6l2 1.6l-2 1.6Z`} />
          )),
        )}
        <rect x="41.8" y="130.6" width="16.4" height="8.8" />
      </g>
    </g>
  );
}

function Decor() {
  return (
    <svg className="rr-decor" viewBox="0 0 100 140" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <Architecture />
      {/* fog so the lower text stays readable over the palace */}
      <rect x="0" y="62" width="100" height="78" fill="url(#rr-fog)" />
      <Parapet />

      {/* gold arch */}
      <g fill="none" stroke="#b8914f" strokeLinecap="round" strokeLinejoin="round">
        <path d={ARCH.d} strokeWidth=".34" />
        <path d={ARCH.ticks} strokeWidth=".34" />
        <path d="M50 7V3.6M48.6 4.6L50 3.2L51.4 4.6" strokeWidth=".34" />
      </g>

      <Bells />

      {/* bougainvillea cascade */}
      <Vine v={VINES[0]!} />
      <Vine v={VINES[1]!} />

      {/* left bouquet */}
      <g>
        <Gyp g={GYP_L} />
        <Leaf x={4} y={126} rot={-60} s={2.2} />
        <Leaf x={18} y={134} rot={-20} s={2.4} />
        <Leaf x={28} y={138} rot={-8} s={2} />
        <Leaf x={9} y={120} rot={-80} s={1.6} />
        {([ [10, 126, 20, 0.9, 1], [17, 124, 80, 0.85, 2], [21, 130, 150, 0.8, 0], [6, 131, 40, 0.8, 3], [15, 128, 200, 0.7, 1], [24, 135, 120, 0.75, 2] ] as Array<[number, number, number, number, number]>).map(([x, y, rot, s, tone], i) => (
          <Bract key={i} x={x} y={y} rot={rot} s={s * 1.25} tone={tone} />
        ))}
        <Rose x={3.4} y={122} s={0.6} kind="p" />
        <Rose x={12.5} y={134.5} s={0.7} kind="r" />
        <Rose x={0} y={137} s={0.55} kind="r" />
      </g>

      {/* right bouquet (mirrored layout) */}
      <g>
        <Gyp g={GYP_R} />
        <Leaf x={96} y={126} rot={-120} s={2.2} />
        <Leaf x={82} y={134} rot={-160} s={2.4} />
        <Leaf x={72} y={138} rot={-172} s={2} />
        <Leaf x={91} y={120} rot={-100} s={1.6} />
        {([ [90, 126, 160, 0.9, 1], [83, 124, 100, 0.85, 2], [79, 130, 30, 0.8, 0], [94, 131, 140, 0.8, 3], [85, 128, 340, 0.7, 1], [76, 135, 60, 0.75, 2] ] as Array<[number, number, number, number, number]>).map(([x, y, rot, s, tone], i) => (
          <Bract key={i} x={x} y={y} rot={rot} s={s * 1.25} tone={tone} />
        ))}
        <Rose x={96.6} y={123} s={0.64} kind="p" />
        <Rose x={87.5} y={134.5} s={0.76} kind="r" />
        <Rose x={100} y={137} s={0.55} kind="r" />
      </g>
    </svg>
  );
}

/* ---- small gold ornaments used inside the pages ---- */
function Lotus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 60 34" aria-hidden="true" focusable="false">
      <g fill="none" stroke="#b8914f" strokeWidth="1" strokeLinejoin="round" strokeLinecap="round">
        <path d="M30 3C23.5 11 23.5 22 30 30C36.5 22 36.5 11 30 3Z" />
        <path d="M30 30C21 28 17 19 18 11C25 13 30 20 30 30Z" />
        <path d="M30 30C39 28 43 19 42 11C35 13 30 20 30 30Z" />
        <path d="M30 30C19 31 9 26 5 18C13 17 24 21 30 30Z" />
        <path d="M30 30C41 31 51 26 55 18C47 17 36 21 30 30Z" />
        <path d="M15 32H45" />
      </g>
    </svg>
  );
}

const HeartRule = () => (
  <svg className="rr-heartrule" viewBox="0 0 120 14" aria-hidden="true" focusable="false">
    <g stroke="#b8914f" strokeWidth=".8" strokeLinecap="round">
      <path d="M6 7H48M72 7H114" />
    </g>
    <path d="M60 12.5C51 6.5 52 1 56.2 1C58.2 1 59.6 2.4 60 3.8C60.4 2.4 61.8 1 63.8 1C68 1 69 6.5 60 12.5Z" fill="#b8914f" />
  </svg>
);

/* ------------------------------------------------------------------ */
/* The three pages                                                     */
/* ------------------------------------------------------------------ */
function PageInvite({ data }: { data: WeddingCardView }) {
  const { t, locale, tz, eventDate, cat } = derive(data);
  const time = eventDate ? clock(eventDate, tz) : null;
  const longest = Math.max(data.brideName.length, data.groomName.length);
  const nameSize = longest > 16 ? 4.8 : longest > 12 ? 6.2 : longest > 9 ? 7.6 : longest > 6 ? 9.4 : 10.8;

  return (
    <div className="rr-inner">
      <Lotus className="rr-lotus" />
      <p className="rr-caps rr-intro">
        {data.hostLine ?? t.host}
        <br />
        {t.invite[cat]}
      </p>

      <h1 className="rr-names" style={{ fontSize: `${nameSize}cqw` }}>
        <span>{data.brideName}</span>
        <span className="rr-and" aria-label="and">
          <i />
          <b>and</b>
          <i />
        </span>
        <span>{data.groomName}</span>
      </h1>

      <p className="rr-caps rr-tag">{t.tag[cat][0]}</p>
      <p className="rr-script">{t.tag[cat][1]}</p>
      <HeartRule />

      {eventDate && (
        <div className="rr-date">
          <p className="rr-caps rr-save">{t.saveDate}</p>
          <div className="rr-row">
            <span className="rr-caps rr-side">{fmt(eventDate, locale, tz, { weekday: "long" })}</span>
            <span className="rr-day">{fmt(eventDate, locale, tz, { day: "numeric" })}</span>
            <span className="rr-caps rr-side">{fmt(eventDate, locale, tz, { month: "long" })}</span>
          </div>
          <p className="rr-caps rr-yeartime">
            {fmt(eventDate, locale, tz, { year: "numeric" })}
            {time && (
              <>
                <i className="rr-dot" aria-hidden="true" />
                {fmt(eventDate, locale, tz, { hour: "numeric", minute: "2-digit", hour12: true })}
              </>
            )}
          </p>
        </div>
      )}

      {(data.venueName || data.venueAddress) && (
        <div className="rr-venue">
          {data.venueName && <p className="rr-caps rr-venue-name">{data.venueName}</p>}
          {data.venueAddress && <p className="rr-caps rr-caps--small">{data.venueAddress}</p>}
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
    <div className="rr-inner">
      <Lotus className="rr-lotus" />
      <p className="rr-script rr-script--title">{t.details[cat]}</p>

      {showParents && (
        <>
          <p className="rr-caps rr-caps--small rr-soft">{t.families}</p>
          <div className="rr-parents">
            {data.brideParents && (
              <p className="rr-caps">
                <span className="rr-label">{t.daughterOf}</span>
                <br />
                <span className="rr-strong">{data.brideParents}</span>
              </p>
            )}
            {data.groomParents && (
              <p className="rr-caps">
                <span className="rr-label">{t.sonOf}</span>
                <br />
                <span className="rr-strong">{data.groomParents}</span>
              </p>
            )}
          </div>
        </>
      )}

      {data.yearsTogether != null && <p className="rr-script">{t.years(data.yearsTogether)}</p>}

      {events.length > 0 && (
        <>
          {(showParents || data.yearsTogether != null) && <HeartRule />}
          <ul className="rr-events" aria-label={t.celebrations}>
            {events.map((ev, i) => {
              const d = parseDate(ev.date)!;
              const c = clock(d, tz);
              const when = fmt(d, locale, tz, { weekday: "short", month: "short", day: "numeric" });
              const atTime = ev.startTime ?? (c ? fmt(d, locale, tz, { hour: "numeric", minute: "2-digit" }) : null);
              return (
                <li key={`${ev.name}-${i}`}>
                  <span className="rr-event-name">{ev.name}</span>
                  <span className="rr-caps rr-caps--small">
                    {when}
                    {atTime ? `, ${atTime}` : ""}
                  </span>
                  {(ev.venueName || ev.venueAddress) && <span className="rr-caps rr-caps--small rr-soft">{[ev.venueName, ev.venueAddress].filter(Boolean).join(", ")}</span>}
                </li>
              );
            })}
          </ul>
        </>
      )}

      {mapUrl && (
        <a className="rr-link" href={mapUrl} target="_blank" rel="noopener noreferrer" tabIndex={active ? 0 : -1}>
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
    <div className="rr-inner">
      <Lotus className="rr-lotus" />
      {data.invitationMessage && (
        <>
          <p className="rr-message">{data.invitationMessage}</p>
          {(rsvpDate || hasContact) && <HeartRule />}
        </>
      )}

      {rsvpDate && (
        <p className="rr-caps">
          {t.rsvpBy}
          <br />
          <span className="rr-accent">{fmt(rsvpDate, locale, tz, { month: "long", day: "numeric", year: "numeric" })}</span>
        </p>
      )}
      {hasContact && (
        <p className="rr-caps">
          {data.rsvpContactName}
          {data.rsvpContactName && (data.rsvpPhone || data.rsvpEmail) && <br />}
          {data.rsvpPhone && (
            <a className="rr-plain" href={`tel:${data.rsvpPhone.replace(/[^\d+]/g, "")}`} tabIndex={tab}>
              {data.rsvpPhone}
            </a>
          )}
          {data.rsvpPhone && data.rsvpEmail && <br />}
          {data.rsvpEmail && (
            <a className="rr-plain rr-email" href={`mailto:${data.rsvpEmail}`} tabIndex={tab}>
              {data.rsvpEmail}
            </a>
          )}
        </p>
      )}
      {data.dressCode && (
        <p className="rr-caps">
          <span className="rr-accent">{t.dressCode}:</span> {data.dressCode}
        </p>
      )}
      {data.additionalNotes && (
        <p className="rr-caps rr-caps--small rr-notes">
          <span className="rr-accent">{t.goodToKnow}:</span> {data.additionalNotes}
        </p>
      )}

      <HeartRule />
      <p className="rr-script rr-script--closing">{t.closing}</p>
      {hashtag && <p className="rr-caps rr-caps--small rr-accent">{hashtag}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The template definition: this is the ONE thing the shells need.     */
/* ------------------------------------------------------------------ */
export const rajwadaRomance: TemplateDefinition<WeddingCardView> = {
  rootClass: "rr",
  size: { widthIn: 5, heightIn: 7 },
  fonts: ["Cormorant Garamond", "Marcellus", "Pinyon Script"],
  css: templateCss(),
  defs: (
    <>
      <linearGradient id="rr-gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#e6cf95" />
        <stop offset="0.5" stopColor="#c19b52" />
        <stop offset="1" stopColor="#97722f" />
      </linearGradient>
      <linearGradient id="rr-stone" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#c4a97e" />
        <stop offset="1" stopColor="#dccbab" />
      </linearGradient>
      <linearGradient id="rr-water" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#d9cbb0" />
        <stop offset="1" stopColor="#c3ae8a" />
      </linearGradient>
      <linearGradient id="rr-fog" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#efe6d4" stopOpacity="0" />
        <stop offset="0.45" stopColor="#efe6d4" stopOpacity=".32" />
        <stop offset="1" stopColor="#efe6d4" stopOpacity=".12" />
      </linearGradient>
      {(
        [
          ["rr-b0", "#a3154a", "#e0508c"],
          ["rr-b1", "#bd2262", "#ee6fa2"],
          ["rr-b2", "#d63a7d", "#f58fb5"],
          ["rr-b3", "#b5174f", "#d9407f"],
        ] as const
      ).map(([id, from, to]) => (
        <linearGradient key={id} id={id} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      ))}
      <linearGradient id="rr-leaf" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#5f7f4a" />
        <stop offset="1" stopColor="#97ae6e" />
      </linearGradient>
      <linearGradient id="rr-leaf2" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#3f5f38" />
        <stop offset="1" stopColor="#7f9a5c" />
      </linearGradient>
      <radialGradient id="rr-rose-p">
        <stop offset="0" stopColor="#f9d4c4" />
        <stop offset="1" stopColor="#e48d7b" />
      </radialGradient>
      <radialGradient id="rr-rose-r">
        <stop offset="0" stopColor="#c9344f" />
        <stop offset="1" stopColor="#7a1530" />
      </radialGradient>
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
/* the same CSS gives the on-screen card and the 5x7in PDF page.       */
/* ------------------------------------------------------------------ */
function templateCss() {
  return `
@import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&family=Marcellus&family=Pinyon+Script&display=swap");

.rr{
  --card-accent:#b8914f;--card-accent-hi:#6b2a36;--card-ink:#6a3b3e;--card-font:"Marcellus","Cormorant Garamond",Georgia,serif;
  --card-paper:
    radial-gradient(70% 40% at 30% 18%,rgba(255,249,234,.75),transparent 70%),
    radial-gradient(60% 40% at 82% 58%,rgba(214,194,160,.34),transparent 70%),
    radial-gradient(50% 30% at 14% 76%,rgba(205,184,148,.30),transparent 70%),
    linear-gradient(#efe6d4,#e6dac4);
  --card-back:linear-gradient(90deg,#d9c9ab,#eee3cd);
  --card-stage:radial-gradient(90% 60% at 50% 0%,#efe4d2 0%,#b8a183 100%);
  --card-stage-guest:radial-gradient(90% 70% at 50% 40%,#e5d6bf 0%,#7d6a52 100%);
  --card-btn-bg:rgba(255,250,240,.9);--card-btn-hover:#fffaf0;--card-btn-border:rgba(184,145,79,.7);
  --card-pad-x:15cqw;--card-pad-y:17cqw;
  --maroon:#7a2b3b;--gold:#b8914f;--gold-deep:#9c7438}
.rr *{box-sizing:border-box}
/* The shell darkens the spine edge for dark cards; keep it soft on this light paper. */
.rr .fb-front::after{background:linear-gradient(90deg,rgba(90,60,30,.18),transparent 7%)}

.rr-decor{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}

.rr-inner{margin-block:auto;display:flex;flex-direction:column;align-items:center;text-align:center;gap:1.5cqw}
.rr-inner p,.rr-inner h1,.rr-inner ul{margin:0}

.rr-lotus{width:12cqw;height:auto;flex:none}
.rr-caps{font-family:"Marcellus","Cormorant Garamond",Georgia,serif;font-size:2.4cqw;line-height:1.7;letter-spacing:.16em;text-transform:uppercase;overflow-wrap:anywhere}
.rr-caps--small{font-size:2.1cqw;line-height:1.65}
.rr-soft{opacity:.78}
.rr-intro{max-width:60cqw;text-wrap:balance}
.rr-strong{color:var(--maroon)}
.rr-accent{color:var(--gold-deep)}
.rr-label{font-size:2cqw;opacity:.78}
.rr-script{font-family:"Pinyon Script","Brush Script MT",cursive;font-size:4.6cqw;line-height:1.3;color:var(--gold)}
.rr-script--title{font-size:6.4cqw}
.rr-script--closing{font-size:4.4cqw}

.rr-names{font-family:"Cormorant Garamond",Georgia,serif;font-weight:600;line-height:1;letter-spacing:.05em;text-transform:uppercase;color:var(--maroon);
  display:flex;flex-direction:column;align-items:center;max-width:100%;overflow-wrap:anywhere;margin-block:1.5cqw}
.rr-names>span{display:block}
.rr-and{display:flex !important;align-items:center;justify-content:center;gap:2.4cqw;margin-block:.8cqw;text-transform:none;letter-spacing:0}
.rr-and b{font-family:"Pinyon Script","Brush Script MT",cursive;font-weight:400;font-size:5.6cqw;line-height:1.2;color:var(--gold)}
.rr-and i{position:relative;display:block;width:11cqw;height:1px;background:var(--gold)}
.rr-and i::after{content:"";position:absolute;top:-.5cqw;width:1cqw;height:1cqw;background:var(--gold);transform:rotate(45deg)}
.rr-and i:first-child::after{left:0}
.rr-and i:last-child::after{right:0}

.rr-tag{font-size:2.5cqw}
.rr-heartrule{width:24cqw;height:auto;flex:none}

.rr-date{display:grid;justify-items:center;gap:.4cqw;width:100%}
.rr-save{font-size:2.7cqw;color:var(--maroon)}
.rr-row{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:3.4cqw;width:100%}
.rr-side{font-size:2.1cqw;letter-spacing:.14em}
.rr-day{font-family:"Cormorant Garamond",Georgia,serif;font-weight:600;font-size:8.4cqw;line-height:1.05;color:var(--maroon)}
.rr-yeartime{display:flex;align-items:center;gap:2cqw}
.rr-dot{display:block;width:.9cqw;height:.9cqw;background:var(--gold);transform:rotate(45deg)}

.rr-venue{display:grid;gap:.2cqw;margin-top:.6cqw}
.rr-venue-name{font-size:2.7cqw;color:var(--maroon)}

.rr-parents{display:grid;gap:1.6cqw}
.rr-events{list-style:none;padding:0;display:grid;gap:2.8cqw;width:100%}
.rr-events li{display:flex;flex-direction:column;align-items:center;gap:.4cqw}
.rr-event-name{font-family:"Cormorant Garamond",Georgia,serif;font-style:italic;font-weight:600;font-size:4.8cqw;line-height:1.2;color:var(--maroon)}

.rr-message{font-family:"Cormorant Garamond",Georgia,serif;font-style:italic;font-weight:500;font-size:4cqw;line-height:1.55;white-space:pre-line;overflow-wrap:anywhere;text-wrap:pretty}
.rr-notes{max-width:62cqw}

.rr-link{color:var(--maroon);font-family:"Marcellus",Georgia,serif;font-size:2.4cqw;letter-spacing:.16em;text-transform:uppercase;text-decoration:none;padding-block:1cqw;border-bottom:1px solid var(--gold)}
.rr-plain{color:inherit;text-decoration:none}
.rr-email{letter-spacing:.06em;text-transform:none}
.rr-link:focus-visible,.rr-plain:focus-visible{outline:2px solid var(--maroon);outline-offset:3px}
`;
}
