import type { TemplateDefinition } from "@/components/card/types";
import bgA from "./assets/teal-lantern-a.webp";
import bgB from "./assets/teal-lantern-b.webp";
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
/* Artwork: two painted backgrounds (text-free), swapped per page.     */
/*   a = full scene with the couple (page 1)                           */
/*   b = same frame, flowers and lanterns, soft haze instead of the    */
/*       couple, so pages 2 and 3 have room for text                   */
/* To change the artwork, replace the two files in ./assets/ with      */
/* new 2:3 images (keep the names). Keep them free of any text.        */
/* ------------------------------------------------------------------ */
const Decor = () => (
  <>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className="tl-bg tl-bg--a" src={bgA.src} alt="" draggable={false} />
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className="tl-bg tl-bg--b" src={bgB.src} alt="" draggable={false} />
  </>
);

/** Initials that sit inside the painted monogram ring. */
function Monogram({ a, b }: { a: string; b: string }) {
  return (
    <div className="tl-mono" aria-hidden="true">
      <div className="tl-mono-letters">
        <span className="tl-mono-a">{a}</span>
        <span className="tl-mono-b">{b}</span>
      </div>
    </div>
  );
}

/** Little scroll that sits either side of "and". */
const Flourish = ({ flip = false }: { flip?: boolean }) => (
  <svg className={`tl-flourish${flip ? " tl-flourish--r" : ""}`} viewBox="0 0 100 16" aria-hidden="true" focusable="false">
    <g fill="none" stroke="#b8985a" strokeWidth=".9" strokeLinecap="round">
      <path d="M2 8C20 8 34 8 56 8C66 8 72 2 80 4C87 6 84 13 78 11C74 10 75 6 79 7" />
    </g>
    <circle cx="93" cy="8" r="1.5" fill="#b8985a" />
  </svg>
);

/** Thin gold rule with a small diamond in the middle. */
const Divider = () => (
  <svg className="tl-divider" viewBox="0 0 160 16" aria-hidden="true" focusable="false">
    <g stroke="#b8985a" strokeWidth=".8" strokeLinecap="round" fill="none">
      <path d="M6 8H62" />
      <path d="M98 8H154" />
      <path d="M70 8L80 3L90 8L80 13Z" />
    </g>
    <circle cx="80" cy="8" r="1.6" fill="#b8985a" />
    <circle cx="65" cy="8" r="1.2" fill="#b8985a" />
    <circle cx="95" cy="8" r="1.2" fill="#b8985a" />
  </svg>
);

/* ------------------------------------------------------------------ */
/* The three pages                                                     */
/* ------------------------------------------------------------------ */
function PageWelcome({ data }: { data: WeddingCardView }) {
  const { t, locale, tz, eventDate, cat } = derive(data);
  const time = eventDate ? clock(eventDate, tz) : null;
  const longest = Math.max(data.brideName.length, data.groomName.length);
  const nameSize = longest > 22 ? 4.4 : longest > 16 ? 5.6 : longest > 12 ? 7 : longest > 9 ? 8.4 : longest > 6 ? 9.6 : 10.2;

  return (
    <div className="tl-inner">
      <Monogram a={initial(data.brideName)} b={initial(data.groomName)} />
      <div className="tl-body tl-body--top">
        <p className="tl-caps tl-host">{data.hostLine ?? t.together}</p>

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
      <Monogram a={initial(data.brideName)} b={initial(data.groomName)} />
      <div className="tl-body">
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
      <Monogram a={initial(data.brideName)} b={initial(data.groomName)} />
      <div className="tl-body">
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
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The template definition: this is the ONE thing the shells need.     */
/* ------------------------------------------------------------------ */
export const tealLantern: TemplateDefinition<WeddingCardView> = {
  rootClass: "tl",
  size: { widthIn: 4, heightIn: 6 },
  fonts: ["Cormorant Garamond", "Great Vibes"],
  css: templateCss(),
  Decor,
  pages: [
    { label: "Welcome", render: (d) => <PageWelcome data={d} /> },
    { label: "Details", render: (d, active) => <PageDetails data={d} active={active} /> },
    { label: "RSVP", render: (d, active) => <PageRsvp data={d} active={active} /> },
  ],
};

/* ------------------------------------------------------------------ */
/* Template styles. Sizes use cqw (1cqw = 1% of card width) so the     */
/* card scales as one unit: same CSS for the screen and the 4x6in PDF. */
/* Card height = 150cqw. The painted monogram ring is centred at       */
/* 13.7cqw from the top; the couple's heads start near 99cqw.          */
/* ------------------------------------------------------------------ */
function templateCss() {
  return `
@import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Great+Vibes&display=swap");

.tl{
  --card-accent:#4f8794;--card-accent-hi:#2f5568;--card-ink:#6b5b49;--card-font:"Cormorant Garamond","Times New Roman",serif;
  --card-paper:#efe8d9;
  --card-back:linear-gradient(90deg,#cfdfe0,#eef3f1);
  --card-stage:radial-gradient(90% 60% at 50% 0%,#e8f1f2 0%,#8fb2b9 100%);
  --card-stage-guest:radial-gradient(90% 70% at 50% 40%,#cfe0e2 0%,#46717b 100%);
  --card-btn-bg:rgba(255,255,255,.9);--card-btn-hover:#fff;--card-btn-border:rgba(47,85,104,.5);
  --teal:#2f5568;--gold:#b8985a}
.tl *{box-sizing:border-box}
.tl .fb-front::after{background:linear-gradient(90deg,rgba(40,70,80,.14),transparent 6%)}

/* Text column sits between the lanterns */
.tl .fb-content{inset:7cqw 21cqw 14cqw}

/* Backgrounds: page 1 = scene with couple, other pages = soft haze version */
.tl-bg{position:absolute;inset:0;width:100%;height:100%;display:none;pointer-events:none;user-select:none;-webkit-user-drag:none}
.tl .fb-sheet:nth-of-type(1) .tl-bg--a,.tl .pp-sheet:nth-of-type(1) .tl-bg--a{display:block}
.tl .fb-sheet:nth-of-type(n+2) .tl-bg--b,.tl .pp-sheet:nth-of-type(n+2) .tl-bg--b{display:block}

.tl-inner{flex:1 0 auto;display:flex;flex-direction:column;align-items:center;text-align:center}
.tl-inner p,.tl-inner h1,.tl-inner ul{margin:0}
.tl-body{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.1cqw;width:100%;padding:3.5cqw 3.5cqw 0}
.tl-body--top{justify-content:flex-start;padding-inline:0;padding-top:4.2cqw}

/* Initials inside the painted ring (ring centre = 13.7cqw from top; content starts at 7cqw) */
.tl-mono{flex:none;position:relative;width:100%;height:13.4cqw;display:grid;place-items:center}
.tl-mono-letters{position:relative;width:10cqw;height:9cqw;font-family:"Cormorant Garamond",serif;font-weight:600;font-size:7.6cqw;line-height:1;color:#7a6445}
.tl-mono-a{position:absolute;left:.4cqw;top:0}
.tl-mono-b{position:absolute;left:3.8cqw;top:3.4cqw}

.tl-lead{font-size:2.3cqw;line-height:1.55;letter-spacing:.14em;text-transform:uppercase;font-weight:600;text-wrap:balance;max-width:50cqw}
.tl-lead--small{font-size:2cqw}
.tl-caps{font-size:2.1cqw;line-height:1.6;letter-spacing:.15em;text-transform:uppercase;font-weight:600;overflow-wrap:anywhere}
.tl-host{font-size:2cqw;letter-spacing:.18em}
.tl-caps--small{font-size:1.9cqw;line-height:1.55}
.tl-caps--soft{opacity:.8}
.tl-strong{font-weight:700}
.tl-accent{color:var(--teal);font-weight:700}
.tl-script{font-family:"Great Vibes","Brush Script MT",cursive;font-weight:400;color:var(--teal);line-height:1.2}
.tl-script--title{font-size:7cqw}
.tl-script--years{font-size:5cqw}
.tl-script--closing{font-size:5.2cqw;text-wrap:balance}
.tl-hashtag{font-size:2.2cqw;letter-spacing:.12em;font-weight:700;color:var(--teal)}

.tl-names{display:flex;flex-direction:column;align-items:center;max-width:58cqw;overflow-wrap:anywhere;
  font-family:"Great Vibes","Brush Script MT",cursive;font-weight:400;line-height:1.02;color:var(--teal)}
.tl-and{display:flex;align-items:center;gap:2cqw;font-family:"Cormorant Garamond",serif;font-size:2.5cqw;letter-spacing:.22em;text-transform:uppercase;font-weight:600;color:var(--card-ink);line-height:1.8}
.tl-flourish{width:11cqw;height:auto;flex:none}
.tl-flourish--r{transform:scaleX(-1)}

.tl-date{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:1.4cqw;width:calc(100% - 4cqw);margin-block:.6cqw}
.tl-side{font-size:2cqw;letter-spacing:.08em;text-transform:uppercase;font-weight:600;text-align:center;padding-block:1.5cqw;border-block:1px solid var(--gold);text-wrap:balance}
.tl-side--empty{border-color:transparent}
.tl-center{display:grid;justify-items:center;gap:.3cqw;padding:1cqw 2.6cqw;border-inline:1px solid var(--gold)}
.tl-month{font-size:2.4cqw;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--teal);line-height:1.2}
.tl-day{font-size:7.6cqw;line-height:1;font-weight:600;color:var(--teal)}
.tl-year{font-size:2.3cqw;letter-spacing:.2em;font-weight:600;line-height:1.3}

.tl-venue{display:grid;gap:.3cqw;margin-top:.6cqw}
.tl-venue-name{font-size:3cqw;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--teal);line-height:1.35}
.tl-venue-addr{font-size:1.9cqw;max-width:56cqw;letter-spacing:.12em;text-transform:uppercase;line-height:1.55;font-weight:600;overflow-wrap:anywhere}

.tl-divider{width:22cqw;height:auto;flex:none}
.tl-message{font-size:2.6cqw;line-height:1.55;font-style:italic;font-weight:500;white-space:pre-line;overflow-wrap:anywhere;text-wrap:pretty}
.tl-notes{max-width:50cqw}
.tl-parents{display:grid;gap:1cqw}
.tl-label{font-size:1.8cqw;letter-spacing:.2em;opacity:.8}

.tl-link{color:var(--teal);font-size:2cqw;font-weight:700;letter-spacing:.16em;text-transform:uppercase;text-decoration:none;padding:1cqw 3cqw;border:1px solid var(--gold);border-radius:999px;margin-top:.6cqw}
.tl-plain{color:inherit;text-decoration:none}
.tl-email{letter-spacing:.04em;text-transform:none}
.tl-link:focus-visible,.tl-plain:focus-visible{outline:2px solid var(--teal);outline-offset:3px}

.tl-events{list-style:none;padding:0;display:grid;gap:2cqw;width:100%}
.tl-events li{display:flex;flex-direction:column;align-items:center;gap:.3cqw}
.tl-events li+li::before{content:"";width:1.1cqw;height:1.1cqw;background:var(--gold);transform:rotate(45deg);margin-bottom:1.2cqw}
.tl-event-name{font-family:"Great Vibes","Brush Script MT",cursive;font-size:4.3cqw;line-height:1.15;color:var(--teal)}
`;
}
