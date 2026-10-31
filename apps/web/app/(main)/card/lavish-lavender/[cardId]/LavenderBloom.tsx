import type { TemplateDefinition } from "@/components/card/types";
import { parseDate, safeHttpUrl, type WeddingCardView, type WeddingCategory } from "./LavenderBloomData";

/* ------------------------------------------------------------------ */
/* Copy. Add another language by adding a key here (e.g. `hi`).        */
/* ------------------------------------------------------------------ */
const STRINGS = {
  en: {
    join: {
      wedding: "Please join us to celebrate the wedding of",
      reception: "Please join us to celebrate the wedding reception of",
      engagement: "Please join us to celebrate the engagement of",
      anniversary: "Please join us to celebrate the anniversary of",
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

/* ------------------------------------------------------------------ */
/* Watercolor florals, drawn as SVG. Everything is hand-placed data,   */
/* so the screen view and the PDF always get identical artwork.        */
/* ------------------------------------------------------------------ */
type Tone = "v" | "l" | "p" | "b";
type Item =
  | { k: "wash"; x: number; y: number; r: number }
  | { k: "leaf"; x: number; y: number; r: number; s: number; c: "g" | "v" }
  | { k: "berry"; x: number; y: number; r: number; s: number }
  | { k: "bloom"; x: number; y: number; r: number; s: number; t: Tone; n?: number }
  | { k: "daisy"; x: number; y: number; r: number; s: number; t: Tone }
  | { k: "rose"; x: number; y: number; r: number; s: number };

const TONE: Record<Tone, string> = { v: "url(#lb-tv)", l: "url(#lb-tl)", p: "url(#lb-tp)", b: "url(#lb-tb)" };
const LEAF = "M0 0C5-6 18-7 30 0C18 7 5 6 0 0Z";
const PETAL = "M0 0C-8-5-9-24 0-32C9-24 8-5 0 0Z";
const NARROW = "M0 0C-3.5-6-3.5-20 0-27C3.5-20 3.5-6 0 0Z";
const at = (x: number, y: number, r: number, s: number) => `translate(${x} ${y}) rotate(${r}) scale(${s})`;

function renderItem(it: Item, i: number) {
  switch (it.k) {
    case "wash":
      return <circle key={i} cx={it.x} cy={it.y} r={it.r} fill="url(#lb-wash)" />;
    case "leaf":
      return (
        <g key={i} transform={at(it.x, it.y, it.r, it.s)}>
          <path d={LEAF} fill={it.c === "g" ? "url(#lb-lg)" : "url(#lb-lv)"} fillOpacity=".88" />
          <path d="M1 0L27 0" stroke="#fff" strokeOpacity=".35" strokeWidth=".6" fill="none" />
        </g>
      );
    case "berry":
      return (
        <g key={i} transform={at(it.x, it.y, it.r, it.s)}>
          <path d="M0 0Q12-10 28-8" stroke="#86a07c" strokeWidth="1" fill="none" strokeLinecap="round" />
          <g fill="#d86fa5" fillOpacity=".85">
            {[[8, -6.5], [14, -9], [20, -9.6], [26, -8.2]].map(([x, y]) => (
              <circle key={x} cx={x} cy={y} r="2" />
            ))}
          </g>
          <circle cx="29" cy="-8" r="1.5" fill="#b9a9e6" />
        </g>
      );
    case "bloom": {
      const n = it.n ?? 6;
      return (
        <g key={i} transform={at(it.x, it.y, it.r, it.s)}>
          <g fill={TONE[it.t]} fillOpacity=".82" stroke="#fff" strokeOpacity=".4" strokeWidth=".7">
            {Array.from({ length: n }, (_, p) => (
              <path key={p} d={PETAL} transform={`rotate(${(360 / n) * p})`} />
            ))}
          </g>
          <circle r="4" fill="#f1d58a" fillOpacity=".92" />
          <circle r="1.7" fill="#8a6a2f" fillOpacity=".7" />
        </g>
      );
    }
    case "daisy":
      return (
        <g key={i} transform={at(it.x, it.y, it.r, it.s)}>
          <g fill={TONE[it.t]} fillOpacity=".85" stroke="#fff" strokeOpacity=".35" strokeWidth=".5">
            {Array.from({ length: 10 }, (_, p) => (
              <path key={p} d={NARROW} transform={`rotate(${36 * p})`} />
            ))}
          </g>
          <circle r="4.4" fill="#5b4a8a" />
          <g fill="#ead89c">
            {Array.from({ length: 6 }, (_, p) => (
              <circle key={p} cx={(2.4 * Math.cos((p * Math.PI) / 3)).toFixed(2)} cy={(2.4 * Math.sin((p * Math.PI) / 3)).toFixed(2)} r=".7" />
            ))}
          </g>
        </g>
      );
    case "rose":
      return (
        <g key={i} transform={at(it.x, it.y, it.r, it.s)}>
          <g fill="url(#lb-tv)" fillOpacity=".75">
            {[0, 72, 144, 216, 288].map((a) => (
              <ellipse key={a} cx="0" cy="-11" rx="9" ry="8" transform={`rotate(${a})`} />
            ))}
          </g>
          <circle r="12" fill="url(#lb-rose)" />
          <g fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth=".8" strokeLinecap="round">
            <path d="M-9-2C-5-10 7-10 9-1" />
            <path d="M-6 3C-2-5 6-3 6 3" />
            <path d="M-3-1C0-4 3-2 2 1" />
          </g>
        </g>
      );
  }
}

function Scene({ className, view, items }: { className: string; view: string; items: Item[] }) {
  return (
    <svg className={className} viewBox={view} aria-hidden="true" focusable="false">
      {items.map(renderItem)}
    </svg>
  );
}

/** Corner clusters. The corner of the card sits at (0,0); B is used for the other diagonal. */
const CORNER_A: Item[] = [
  { k: "wash", x: 60, y: 50, r: 78 },
  { k: "leaf", x: 44, y: 40, r: -30, s: 1.9, c: "v" },
  { k: "leaf", x: 40, y: 44, r: 15, s: 1.7, c: "v" },
  { k: "leaf", x: 30, y: 50, r: 75, s: 1.6, c: "v" },
  { k: "leaf", x: 100, y: 34, r: -12, s: 1.3, c: "g" },
  { k: "leaf", x: 122, y: 30, r: -4, s: 1.2, c: "g" },
  { k: "leaf", x: 150, y: 22, r: 8, s: 1.1, c: "g" },
  { k: "leaf", x: 178, y: 16, r: -6, s: 0.95, c: "g" },
  { k: "leaf", x: 206, y: 10, r: 6, s: 0.8, c: "g" },
  { k: "leaf", x: 26, y: 90, r: 80, s: 1.2, c: "g" },
  { k: "leaf", x: 20, y: 114, r: 95, s: 1, c: "g" },
  { k: "leaf", x: 14, y: 136, r: 85, s: 0.8, c: "g" },
  { k: "berry", x: 134, y: 46, r: -8, s: 1.2 },
  { k: "berry", x: 32, y: 98, r: 80, s: 1 },
  { k: "bloom", x: 42, y: 34, r: 12, s: 1.6, t: "v" },
  { k: "bloom", x: 94, y: 18, r: -20, s: 0.95, t: "b", n: 5 },
  { k: "bloom", x: 82, y: 60, r: 30, s: 1, t: "p" },
  { k: "daisy", x: 16, y: 74, r: 8, s: 1, t: "l" },
  { k: "daisy", x: 124, y: 14, r: 0, s: 0.8, t: "v" },
  { k: "daisy", x: 162, y: 28, r: 20, s: 0.55, t: "l" },
];

const CORNER_B: Item[] = [
  { k: "wash", x: 55, y: 55, r: 76 },
  { k: "leaf", x: 36, y: 36, r: -10, s: 1.8, c: "v" },
  { k: "leaf", x: 36, y: 40, r: 40, s: 1.7, c: "v" },
  { k: "leaf", x: 24, y: 56, r: 78, s: 1.5, c: "v" },
  { k: "leaf", x: 92, y: 30, r: -8, s: 1.2, c: "g" },
  { k: "leaf", x: 118, y: 22, r: 4, s: 1.15, c: "g" },
  { k: "leaf", x: 146, y: 18, r: -10, s: 1, c: "g" },
  { k: "leaf", x: 172, y: 10, r: 6, s: 0.85, c: "g" },
  { k: "leaf", x: 22, y: 96, r: 88, s: 1.1, c: "g" },
  { k: "leaf", x: 16, y: 120, r: 80, s: 0.9, c: "g" },
  { k: "berry", x: 106, y: 44, r: -4, s: 1.1 },
  { k: "bloom", x: 30, y: 30, r: -8, s: 1.5, t: "l", n: 5 },
  { k: "bloom", x: 78, y: 24, r: 14, s: 1, t: "v" },
  { k: "rose", x: 58, y: 66, r: 20, s: 0.95 },
  { k: "daisy", x: 14, y: 82, r: 0, s: 0.9, t: "p" },
  { k: "daisy", x: 128, y: 12, r: 12, s: 0.65, t: "v" },
];

/** Side border strip (viewBox is 70 wide, 320 tall; the card edge is at x = 0). */
const EDGE: Item[] = [
  { k: "leaf", x: 6, y: 20, r: 70, s: 1, c: "g" },
  { k: "leaf", x: 8, y: 70, r: 95, s: 0.9, c: "g" },
  { k: "leaf", x: 6, y: 130, r: 80, s: 1, c: "g" },
  { k: "leaf", x: 8, y: 200, r: 100, s: 0.9, c: "g" },
  { k: "leaf", x: 6, y: 262, r: 85, s: 1, c: "g" },
  { k: "leaf", x: 8, y: 306, r: 95, s: 0.8, c: "g" },
  { k: "leaf", x: 12, y: 106, r: 50, s: 1.1, c: "v" },
  { k: "leaf", x: 12, y: 238, r: -45, s: 1.1, c: "v" },
  { k: "berry", x: 14, y: 132, r: 80, s: 0.9 },
  { k: "berry", x: 16, y: 20, r: 90, s: 0.8 },
  { k: "rose", x: 8, y: 48, r: 0, s: 0.95 },
  { k: "rose", x: 10, y: 160, r: 40, s: 1.05 },
  { k: "rose", x: 6, y: 284, r: 10, s: 0.9 },
  { k: "daisy", x: 15, y: 100, r: 0, s: 0.8, t: "l" },
  { k: "daisy", x: 16, y: 232, r: 20, s: 0.8, t: "l" },
  { k: "bloom", x: 10, y: 208, r: 0, s: 0.6, t: "p" },
];

/** Little sprays that tuck into the gold ring (viewBox 100 x 100). */
const SPRAY_TL: Item[] = [
  { k: "wash", x: 38, y: 38, r: 34 },
  { k: "leaf", x: 34, y: 38, r: 28, s: 1.1, c: "g" },
  { k: "leaf", x: 34, y: 40, r: 58, s: 1, c: "g" },
  { k: "leaf", x: 30, y: 40, r: 82, s: 0.9, c: "v" },
  { k: "bloom", x: 32, y: 34, r: 8, s: 1.05, t: "p" },
  { k: "bloom", x: 58, y: 24, r: 30, s: 0.7, t: "v" },
  { k: "daisy", x: 16, y: 58, r: 0, s: 0.62, t: "l" },
];
const SPRAY_BR: Item[] = [
  { k: "wash", x: 62, y: 62, r: 34 },
  { k: "leaf", x: 64, y: 62, r: -150, s: 1.1, c: "g" },
  { k: "leaf", x: 64, y: 64, r: -122, s: 1, c: "g" },
  { k: "leaf", x: 66, y: 62, r: -176, s: 0.9, c: "v" },
  { k: "bloom", x: 66, y: 64, r: 0, s: 1, t: "v" },
  { k: "daisy", x: 44, y: 78, r: 0, s: 0.62, t: "p" },
  { k: "bloom", x: 82, y: 46, r: 20, s: 0.65, t: "b", n: 5 },
  { k: "berry", x: 50, y: 82, r: 180, s: 0.7 },
];

const Decor = () => (
  <>
    <Scene className="lb-fl lb-fl--tl" view="0 0 240 150" items={CORNER_A} />
    <Scene className="lb-fl lb-fl--tr" view="0 0 240 150" items={CORNER_B} />
    <Scene className="lb-fl lb-fl--bl" view="0 0 240 150" items={CORNER_B} />
    <Scene className="lb-fl lb-fl--br" view="0 0 240 150" items={CORNER_A} />
    <Scene className="lb-edge lb-edge--l" view="0 0 70 320" items={EDGE} />
    <Scene className="lb-edge lb-edge--r" view="0 0 70 320" items={EDGE} />
  </>
);

/** The gold double ring around the names. */
function Ring() {
  return (
    <svg className="lb-ring-svg" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
      <g fill="none" stroke="url(#lb-gold)">
        <circle cx="100" cy="100" r="88" strokeWidth="1.3" />
        <circle cx="103" cy="98" r="84" strokeWidth="1" />
        <circle cx="97" cy="102" r="80" strokeWidth="1.1" />
        <circle cx="171" cy="42" r="3.2" strokeWidth="1" />
        <circle cx="44" cy="168" r="2.4" strokeWidth="1" />
      </g>
    </svg>
  );
}

/** Thin gold rule with a tiny flower in the middle. */
const Divider = () => (
  <svg className="lb-divider" viewBox="0 0 120 20" aria-hidden="true" focusable="false">
    <g stroke="#c9a95c" strokeWidth=".8" strokeLinecap="round">
      <path d="M4 10H46" />
      <path d="M74 10H116" />
    </g>
    <g transform="translate(60 10)" fill="#9d8bd0" fillOpacity=".85">
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="0" cy="-4.2" rx="2.2" ry="3.4" transform={`rotate(${a})`} />
      ))}
      <circle r="1.7" fill="#c9a95c" />
    </g>
  </svg>
);

/* ------------------------------------------------------------------ */
/* The three pages                                                     */
/* ------------------------------------------------------------------ */
function PageWelcome({ data }: { data: WeddingCardView }) {
  const { t, locale, tz, eventDate, cat } = derive(data);
  const time = eventDate ? clock(eventDate, tz) : null;
  const longest = Math.max(data.brideName.length, data.groomName.length);
  const nameSize = longest > 22 ? 4.2 : longest > 16 ? 5 : longest > 11 ? 6 : 7.4;

  return (
    <div className="lb-inner">
      {data.hostLine && <p className="lb-caps lb-caps--small">{data.hostLine}</p>}
      <p className="lb-lead">{t.join[cat]}:</p>

      <div className="lb-ring">
        <Ring />
        <Scene className="lb-spray lb-spray--tl" view="0 0 100 100" items={SPRAY_TL} />
        <Scene className="lb-spray lb-spray--br" view="0 0 100 100" items={SPRAY_BR} />
        <h1 className="lb-names" style={{ fontSize: `${nameSize}cqw` }}>
          <span>{data.brideName}</span>
          <span className="lb-amp">&amp;</span>
          <span>{data.groomName}</span>
        </h1>
      </div>

      {eventDate && (
        <div className="lb-date">
          <span className="lb-month">{fmt(eventDate, locale, tz, { month: "long" })}</span>
          <div className="lb-dayrow">
            <span className="lb-side">{fmt(eventDate, locale, tz, { weekday: "long" })}</span>
            <span className="lb-day">{fmt(eventDate, locale, tz, { day: "numeric" })}</span>
            {time ? (
              <span className="lb-side">
                {t.at} {fmt(eventDate, locale, tz, { hour: "2-digit", minute: "2-digit", hour12: true })}
              </span>
            ) : (
              <span className="lb-side lb-side--empty" aria-hidden="true">
                &nbsp;
              </span>
            )}
          </div>
          <span className="lb-year">{fmt(eventDate, locale, tz, { year: "numeric" })}</span>
        </div>
      )}

      {(data.venueName || data.venueAddress) && (
        <div className="lb-venue">
          {data.venueName && <p className="lb-venue-name">{data.venueName}</p>}
          {data.venueAddress && <p className="lb-venue-addr">{data.venueAddress}</p>}
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
    <div className="lb-inner">
      <p className="lb-script lb-script--title">{t.details[cat]}</p>
      <Divider />

      {showParents && (
        <>
          <p className="lb-lead lb-lead--small">{t.families}</p>
          <div className="lb-parents">
            {data.brideParents && (
              <p className="lb-caps">
                <span className="lb-label">{t.daughterOf}</span>
                <br />
                <span className="lb-strong">{data.brideParents}</span>
              </p>
            )}
            {data.groomParents && (
              <p className="lb-caps">
                <span className="lb-label">{t.sonOf}</span>
                <br />
                <span className="lb-strong">{data.groomParents}</span>
              </p>
            )}
          </div>
        </>
      )}

      {data.yearsTogether != null && <p className="lb-script lb-script--years">{t.years(data.yearsTogether)}</p>}

      {events.length > 0 && (
        <>
          {(showParents || data.yearsTogether != null) && <Divider />}
          <ul className="lb-events" aria-label={t.celebrations}>
            {events.map((ev, i) => {
              const d = parseDate(ev.date)!;
              const c = clock(d, tz);
              const when = fmt(d, locale, tz, { weekday: "short", month: "short", day: "numeric" });
              const atTime = ev.startTime ?? (c ? fmt(d, locale, tz, { hour: "numeric", minute: "2-digit" }) : null);
              return (
                <li key={`${ev.name}-${i}`}>
                  <span className="lb-event-name">{ev.name}</span>
                  <span className="lb-caps lb-caps--small">
                    {when}
                    {atTime ? `, ${atTime}` : ""}
                  </span>
                  {(ev.venueName || ev.venueAddress) && <span className="lb-caps lb-caps--small lb-caps--soft">{[ev.venueName, ev.venueAddress].filter(Boolean).join(", ")}</span>}
                </li>
              );
            })}
          </ul>
        </>
      )}

      {mapUrl && (
        <a className="lb-link" href={mapUrl} target="_blank" rel="noopener noreferrer" tabIndex={active ? 0 : -1}>
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
    <div className="lb-inner">
      {data.invitationMessage && (
        <>
          <p className="lb-message">{data.invitationMessage}</p>
          {(rsvpDate || hasContact) && <Divider />}
        </>
      )}

      {rsvpDate && (
        <p className="lb-caps">
          {t.rsvpBy}
          <br />
          <span className="lb-accent">{fmt(rsvpDate, locale, tz, { month: "long", day: "numeric", year: "numeric" })}</span>
        </p>
      )}
      {hasContact && (
        <p className="lb-caps">
          {data.rsvpContactName}
          {data.rsvpContactName && (data.rsvpPhone || data.rsvpEmail) && <br />}
          {data.rsvpPhone && (
            <a className="lb-plain" href={`tel:${data.rsvpPhone.replace(/[^\d+]/g, "")}`} tabIndex={tab}>
              {data.rsvpPhone}
            </a>
          )}
          {data.rsvpPhone && data.rsvpEmail && <br />}
          {data.rsvpEmail && (
            <a className="lb-plain lb-email" href={`mailto:${data.rsvpEmail}`} tabIndex={tab}>
              {data.rsvpEmail}
            </a>
          )}
        </p>
      )}
      {data.dressCode && (
        <p className="lb-caps">
          <span className="lb-accent">{t.dressCode}:</span> {data.dressCode}
        </p>
      )}
      {data.additionalNotes && (
        <p className="lb-caps lb-caps--small lb-notes">
          <span className="lb-accent">{t.goodToKnow}:</span> {data.additionalNotes}
        </p>
      )}

      <Divider />
      <p className="lb-script lb-script--closing">{t.closing}</p>
      {hashtag && <p className="lb-hashtag">{hashtag}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The template definition: this is the ONE thing the shells need.     */
/* ------------------------------------------------------------------ */
export const lavenderBloom: TemplateDefinition<WeddingCardView> = {
  rootClass: "lb",
  size: { widthIn: 5, heightIn: 7 },
  fonts: ["Montserrat", "Dancing Script"],
  css: templateCss(),
  defs: (
    <>
      <linearGradient id="lb-gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#e3cc8e" />
        <stop offset="0.5" stopColor="#c9a95c" />
        <stop offset="1" stopColor="#a98a3d" />
      </linearGradient>
      {(
        [
          ["lb-tv", "#7a64b8", "#cfc2ee"],
          ["lb-tl", "#a898dc", "#e8e0f9"],
          ["lb-tp", "#d77fb0", "#f7d6e8"],
          ["lb-tb", "#7f94d0", "#d0daf3"],
        ] as const
      ).map(([id, from, to]) => (
        <linearGradient key={id} id={id} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      ))}
      <radialGradient id="lb-rose">
        <stop offset="0" stopColor="#bcadea" />
        <stop offset="1" stopColor="#7d68b8" />
      </radialGradient>
      <linearGradient id="lb-lg" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#a9bb98" />
        <stop offset="1" stopColor="#6f8f6a" />
      </linearGradient>
      <linearGradient id="lb-lv" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#a393d6" />
        <stop offset="1" stopColor="#5f4fa0" />
      </linearGradient>
      <radialGradient id="lb-wash">
        <stop offset="0" stopColor="#b9a9e6" stopOpacity=".38" />
        <stop offset="1" stopColor="#b9a9e6" stopOpacity="0" />
      </radialGradient>
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
@import url("https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&family=Montserrat:wght@400;500;600&display=swap");

.lb{
  --card-accent:#7b6aa8;--card-accent-hi:#4e3f7d;--card-ink:#4d4859;--card-font:"Montserrat",system-ui,sans-serif;
  --card-paper:
    radial-gradient(60% 38% at 22% 28%,rgba(190,175,230,.34),transparent 72%),
    radial-gradient(52% 34% at 80% 54%,rgba(200,186,236,.30),transparent 72%),
    radial-gradient(58% 38% at 34% 82%,rgba(176,160,222,.24),transparent 72%),
    linear-gradient(#f7f4fc,#ece7f6);
  --card-back:linear-gradient(90deg,#d6cdec,#efeaf8);
  --card-stage:radial-gradient(90% 60% at 50% 0%,#ece8f8 0%,#b3a6d8 100%);
  --card-stage-guest:radial-gradient(90% 70% at 50% 40%,#dcd4f0 0%,#8a7cb8 100%);
  --card-btn-bg:rgba(255,255,255,.88);--card-btn-hover:#fff;--card-btn-border:rgba(123,106,168,.6);
  --card-pad-x:13cqw;--card-pad-y:18cqw;
  --violet:#7b6aa8;--violet-deep:#5d4d8f;--gold:#c9a95c;--gold-lo:#a98a3d;--gold-hi:#e3cc8e}
.lb *{box-sizing:border-box}
/* The shell darkens the spine edge for dark cards; keep it soft on this light paper. */
.lb .fb-front::after{background:linear-gradient(90deg,rgba(70,50,120,.16),transparent 7%)}

.lb-fl{position:absolute;width:62cqw;height:auto;pointer-events:none}
.lb-fl--tl{top:0;left:0}
.lb-fl--tr{top:0;right:0;transform:scaleX(-1)}
.lb-fl--bl{bottom:0;left:0;transform:scaleY(-1)}
.lb-fl--br{bottom:0;right:0;transform:scale(-1,-1)}
.lb-edge{position:absolute;top:30cqw;width:15cqw;height:auto;pointer-events:none}
.lb-edge--l{left:0}
.lb-edge--r{right:0;transform:scale(-1,-1)}

.lb-inner{margin-block:auto;display:flex;flex-direction:column;align-items:center;text-align:center;gap:2.2cqw}
.lb-inner p,.lb-inner h1,.lb-inner ul{margin:0}

.lb-lead{font-size:3.4cqw;line-height:1.6;letter-spacing:.07em;font-weight:500;text-wrap:balance}
.lb-lead--small{font-size:2.9cqw}
.lb-caps{font-size:2.6cqw;line-height:1.7;letter-spacing:.14em;text-transform:uppercase;font-weight:500;overflow-wrap:anywhere}
.lb-caps--small{font-size:2.2cqw;line-height:1.6}
.lb-caps--soft{opacity:.78}
.lb-strong{font-weight:600}
.lb-accent{color:var(--violet-deep);font-weight:600}
.lb-script{font-family:"Dancing Script","Brush Script MT",cursive;font-weight:600;color:var(--violet);line-height:1.25}
.lb-script--title{font-size:6.6cqw;font-weight:700}
.lb-script--years{font-size:6cqw}
.lb-script--closing{font-size:4.6cqw}
.lb-hashtag{font-size:2.6cqw;letter-spacing:.1em;font-weight:500;color:var(--violet-deep)}

.lb-ring{position:relative;flex:none;width:40cqw;height:40cqw;display:grid;place-items:center}
.lb-ring-svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.lb-spray{position:absolute;width:22cqw;height:auto;pointer-events:none}
.lb-spray--tl{top:-4cqw;left:-6cqw}
.lb-spray--br{bottom:-5cqw;right:-6cqw}
.lb-names{position:relative;z-index:1;max-width:28cqw;display:flex;flex-direction:column;align-items:center;text-align:center;overflow-wrap:anywhere;
  font-family:"Dancing Script","Brush Script MT",cursive;font-weight:700;line-height:1.12;color:#58516a}
.lb-amp{font-size:.85em;color:var(--violet)}

.lb-date{display:grid;justify-items:center;gap:.8cqw;width:100%;margin-top:1cqw}
.lb-month{font-size:3.6cqw;letter-spacing:.2em;text-transform:uppercase;font-weight:500;line-height:1.3}
.lb-dayrow{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:3cqw;width:100%}
.lb-side{font-size:2.6cqw;letter-spacing:.1em;text-transform:uppercase;font-weight:500;white-space:nowrap;text-align:center;padding-block:1.3cqw;border-block:.45cqw solid var(--gold)}
.lb-day{font-size:12cqw;line-height:1;font-weight:600;color:var(--violet)}
.lb-year{font-size:3.4cqw;letter-spacing:.2em;font-weight:500;line-height:1.4}

.lb-venue{margin-top:1cqw}
.lb-venue-name{font-size:3.5cqw;font-weight:600;letter-spacing:.03em;line-height:1.5}
.lb-venue-addr{font-size:3cqw;line-height:1.55;overflow-wrap:anywhere}

.lb-divider{width:24cqw;height:auto;flex:none}
.lb-message{font-size:3cqw;line-height:1.75;font-weight:400;white-space:pre-line;overflow-wrap:anywhere;text-wrap:pretty}
.lb-notes{max-width:62cqw}
.lb-parents{display:grid;gap:1.6cqw}
.lb-label{font-size:2.1cqw;opacity:.78}

.lb-link{color:var(--violet-deep);font-size:2.5cqw;font-weight:600;letter-spacing:.14em;text-transform:uppercase;text-decoration:none;padding-block:1cqw;border-bottom:1px solid var(--gold)}
.lb-plain{color:inherit;text-decoration:none}
.lb-email{letter-spacing:.05em;text-transform:none}
.lb-link:focus-visible,.lb-plain:focus-visible{outline:2px solid var(--violet);outline-offset:3px}

.lb-events{list-style:none;padding:0;display:grid;gap:2.8cqw;width:100%}
.lb-events li{display:flex;flex-direction:column;align-items:center;gap:.4cqw}
.lb-event-name{font-family:"Dancing Script","Brush Script MT",cursive;font-weight:700;font-size:4.4cqw;line-height:1.25;color:var(--violet)}
`;
}
