import { TemplateDefinition } from "@/components/card/types";
import { parseDate, safeHttpUrl, type WeddingCardView, type WeddingCategory } from "./Weddingcard";

/* ------------------------------------------------------------------ */
/* Copy. Add another language by adding a key here (e.g. `hi`).        */
/* ------------------------------------------------------------------ */
const STRINGS = {
  en: {
    host: "Together with our families",
    of: {
      wedding: "The Wedding of",
      reception: "The Wedding Reception of",
      engagement: "The Engagement of",
      anniversary: "Celebrating the Anniversary of",
    } as Record<WeddingCategory, string>,
    invite: {
      wedding: ["Invite you with joyful hearts", "to the celebration of our marriage"],
      reception: ["Invite you with joyful hearts", "to celebrate our wedding reception"],
      engagement: ["Invite you with joyful hearts", "to celebrate our engagement"],
      anniversary: ["Invite you with joyful hearts", "to celebrate our anniversary"],
    } as Record<WeddingCategory, [string, string]>,
    daughterOf: "Daughter of",
    sonOf: "Son of",
    years: (n: number) => `${n} ${n === 1 ? "year" : "years"} together`,
    atTime: (h: number, m: number) => {
      const h12 = h % 12 || 12;
      const period = h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
      return m === 0 ? `At ${h12} o’clock in the ${period}` : `At ${h12}:${String(m).padStart(2, "0")} in the ${period}`;
    },
    viewMap: "View on map",
    celebrations: "Celebrations",
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

/** Values every page needs, worked out once per page render. */
function derive(data: WeddingCardView) {
  const t = STRINGS[data.language as keyof typeof STRINGS] ?? STRINGS.en;
  const locale = data.language in STRINGS ? data.language : "en";
  const tz = data.timezone;
  const eventDate = parseDate(data.eventDate);
  return { t, locale, tz, eventDate, cat: data.category };
}

/* ------------------------------------------------------------------ */
/* Gold botanical sprig, generated once                                */
/* ------------------------------------------------------------------ */
type P = [number, number];
const LEAF = "M0 0C6-8 20-9 32 0C20 9 6 8 0 0Z";
const bz = (a: P, c: P, b: P, t: number): P => [
  (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0],
  (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1],
];
const dbz = (a: P, c: P, b: P, t: number): P => [
  2 * (1 - t) * (c[0] - a[0]) + 2 * t * (b[0] - c[0]),
  2 * (1 - t) * (c[1] - a[1]) + 2 * t * (b[1] - c[1]),
];

const SPRIG = (() => {
  const stems: string[] = [];
  const leaves: string[] = [];
  const branch = (a: P, c: P, b: P, n: number, scale: number) => {
    stems.push(`M${a[0]} ${a[1]}Q${c[0]} ${c[1]} ${b[0]} ${b[1]}`);
    for (let i = 0; i < n; i++) {
      const t = 0.14 + 0.86 * (i / (n - 1));
      const [x, y] = bz(a, c, b, t);
      const [dx, dy] = dbz(a, c, b, t);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      const s = scale * (1.15 - 0.55 * t);
      leaves.push(`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(angle + 38).toFixed(1)}) scale(${s.toFixed(2)})`);
      leaves.push(`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(angle - 38).toFixed(1)}) scale(${s.toFixed(2)})`);
    }
    const [tx, ty] = b;
    const [dx, dy] = dbz(a, c, b, 1);
    const tipAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
    leaves.push(`translate(${tx} ${ty}) rotate(${tipAngle.toFixed(1)}) scale(${(scale * 0.7).toFixed(2)})`);
  };
  branch([206, -6], [166, 48], [46, 160], 10, 0.9);
  branch([176, 30], [150, 18], [96, 20], 6, 0.7);
  branch([152, 60], [168, 98], [140, 150], 6, 0.7);
  branch([112, 96], [104, 130], [74, 182], 5, 0.62);
  return { stems, leaves };
})();

function Sprig({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" aria-hidden="true" focusable="false">
      <g fill="url(#wt1-gold)">
        {SPRIG.leaves.map((tr, i) => (
          <path key={i} d={LEAF} transform={tr} />
        ))}
      </g>
      <g fill="none" stroke="url(#wt1-gold)" strokeWidth="1.4" strokeLinecap="round">
        {SPRIG.stems.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  );
}

const Decor = () => (
  <>
    <div className="wt1-frame" />
    <Sprig className="wt1-sprig wt1-sprig--tr" />
    <Sprig className="wt1-sprig wt1-sprig--bl" />
  </>
);

const Rule = () => <div className="wt1-rule" aria-hidden="true" />;

/* ------------------------------------------------------------------ */
/* The three pages                                                     */
/* ------------------------------------------------------------------ */
function PageCouple({ data }: { data: WeddingCardView }) {
  const { t, cat } = derive(data);
  const showParents = cat !== "anniversary" && (data.brideParents || data.groomParents);
  const longest = Math.max(data.brideName.length, data.groomName.length);
  const nameSize = longest > 18 ? 8 : longest > 13 ? 9.5 : 11.5;
  const hashtag = data.coupleHashtag ? (data.coupleHashtag.startsWith("#") ? data.coupleHashtag : `#${data.coupleHashtag}`) : null;

  return (
    <div className="wt1-inner">
      <p className="wt1-caps">{data.hostLine ?? t.host}</p>
      <p className="wt1-script">{t.of[cat]}</p>
      <h1 className="wt1-names" style={{ fontSize: `${nameSize}cqw` }}>
        <span>{data.brideName}</span>
        <span className="wt1-amp">&amp;</span>
        <span>{data.groomName}</span>
      </h1>
      {showParents && (
        <>
          <Rule />
          <p className="wt1-caps wt1-caps--small">
            {data.brideParents && (
              <>
                {t.daughterOf} {data.brideParents}
              </>
            )}
            {data.brideParents && data.groomParents && <br />}
            {data.groomParents && (
              <>
                {t.sonOf} {data.groomParents}
              </>
            )}
          </p>
        </>
      )}
      {hashtag && <p className="wt1-hashtag">{hashtag}</p>}
    </div>
  );
}

function PageDetails({ data, active }: { data: WeddingCardView; active: boolean }) {
  const { t, locale, tz, eventDate, cat } = derive(data);
  const time = eventDate ? clock(eventDate, tz) : null;
  const events = [...data.events].sort((a, b) => (parseDate(a.date)?.getTime() ?? 0) - (parseDate(b.date)?.getTime() ?? 0));
  const mapUrl = safeHttpUrl(data.mapUrl);

  return (
    <div className="wt1-inner">
      <p className="wt1-caps">
        {t.invite[cat][0]}
        <br />
        {t.invite[cat][1]}
      </p>
      {data.yearsTogether != null && <p className="wt1-years">{t.years(data.yearsTogether)}</p>}
      {eventDate && (
        <p className="wt1-caps wt1-caps--lead">
          {fmt(eventDate, locale, tz, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          {time && (
            <>
              <br />
              {t.atTime(time.h, time.m)}
            </>
          )}
        </p>
      )}
      {(data.venueName || data.venueAddress) && (
        <p className="wt1-caps">
          {data.venueName}
          {data.venueName && data.venueAddress && <br />}
          {data.venueAddress}
        </p>
      )}
      {mapUrl && (
        <a className="wt1-link" href={mapUrl} target="_blank" rel="noopener noreferrer" tabIndex={active ? 0 : -1}>
          {t.viewMap}
        </a>
      )}
      {events.length > 0 && (
        <>
          <Rule />
          <ul className="wt1-events" aria-label={t.celebrations}>
            {events.map((ev, i) => {
              const d = parseDate(ev.date)!;
              const c = clock(d, tz);
              const when = fmt(d, locale, tz, { month: "short", day: "numeric" });
              const at = ev.startTime ?? (c ? fmt(d, locale, tz, { hour: "numeric", minute: "2-digit" }) : null);
              return (
                <li key={`${ev.name}-${i}`}>
                  <span className="wt1-event-name">{ev.name}</span>
                  <span className="wt1-caps wt1-caps--small">
                    {when}
                    {at ? `, ${at}` : ""}
                  </span>
                  {(ev.venueName || ev.venueAddress) && <span className="wt1-caps wt1-caps--small">{[ev.venueName, ev.venueAddress].filter(Boolean).join(", ")}</span>}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function PageRsvp({ data, active }: { data: WeddingCardView; active: boolean }) {
  const { t, locale, tz } = derive(data);
  const rsvpDate = parseDate(data.rsvpByDate);
  const tab = active ? 0 : -1;
  const hasRsvp = rsvpDate || data.rsvpContactName || data.rsvpPhone || data.rsvpEmail;

  return (
    <div className="wt1-inner">
      {data.invitationMessage && <p className="wt1-message">{data.invitationMessage}</p>}
      {hasRsvp && (
        <>
          {data.invitationMessage && <Rule />}
          {rsvpDate && (
            <p className="wt1-caps">
              {t.rsvpBy}
              <br />
              <span className="wt1-gold">{fmt(rsvpDate, locale, tz, { month: "long", day: "numeric", year: "numeric" })}</span>
            </p>
          )}
          {(data.rsvpContactName || data.rsvpPhone || data.rsvpEmail) && (
            <p className="wt1-caps">
              {data.rsvpContactName}
              {data.rsvpContactName && (data.rsvpPhone || data.rsvpEmail) && <br />}
              {data.rsvpPhone && (
                <a className="wt1-plain" href={`tel:${data.rsvpPhone.replace(/[^\d+]/g, "")}`} tabIndex={tab}>
                  {data.rsvpPhone}
                </a>
              )}
              {data.rsvpPhone && data.rsvpEmail && <br />}
              {data.rsvpEmail && (
                <a className="wt1-plain wt1-email" href={`mailto:${data.rsvpEmail}`} tabIndex={tab}>
                  {data.rsvpEmail}
                </a>
              )}
            </p>
          )}
        </>
      )}
      {data.dressCode && (
        <p className="wt1-caps">
          <span className="wt1-gold">{t.dressCode}</span>
          <br />
          {data.dressCode}
        </p>
      )}
      {data.additionalNotes && (
        <p className="wt1-caps wt1-caps--small wt1-notes">
          <span className="wt1-gold">{t.goodToKnow}</span>
          <br />
          {data.additionalNotes}
        </p>
      )}
      <p className="wt1-script wt1-closing">{t.closing}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The template definition: this is the ONE thing the shells need.     */
/* ------------------------------------------------------------------ */
export const forestForever: TemplateDefinition<WeddingCardView> = {
  rootClass: "wt1",
  size: { widthIn: 5, heightIn: 7 },
  fonts: ["Playfair Display", "Open Sans"],
  css: templateCss(),
  defs: (
    <linearGradient id="wt1-gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#efd7a6" />
      <stop offset="0.5" stopColor="#d3ad70" />
      <stop offset="1" stopColor="#a47b49" />
    </linearGradient>
  ),
  Decor,
  pages: [
    { label: "Couple", render: (d) => <PageCouple data={d} /> },
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
@import url("https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&family=Playfair+Display:ital,wght@0,600;0,700;1,600;1,700&display=swap");

.wt1{
  --card-accent:#d3ad70;--card-accent-hi:#efd7a6;--card-ink:#f2eee6;--card-font:"Open Sans",system-ui,sans-serif;
  --card-paper:radial-gradient(120% 90% at 70% 18%,#242b41,#1b2133 55%,#141927);
  --card-back:linear-gradient(90deg,#0d111c,#1a2033);
  --card-stage:radial-gradient(90% 60% at 50% 0%,#252b3d 0%,#0f121b 70%);
  --card-stage-guest:radial-gradient(90% 70% at 50% 40%,#1c2133 0%,#080a10 80%);
  --card-btn-bg:rgba(27,33,51,.85);--card-btn-hover:rgba(61,52,38,.9);--card-btn-border:rgba(211,173,112,.55);
  --gold:var(--card-accent);--gold-hi:var(--card-accent-hi);--gold-lo:#a47b49;--ivory:var(--card-ink)}
.wt1 *{box-sizing:border-box}

.wt1-frame{position:absolute;inset:6.5cqw;border:1px solid var(--gold);opacity:.9;pointer-events:none}
.wt1-sprig{position:absolute;width:42cqw;height:auto;pointer-events:none}
.wt1-sprig--tr{top:0;right:0}
.wt1-sprig--bl{bottom:0;left:0;transform:rotate(180deg)}

.wt1-inner{margin-block:auto;display:flex;flex-direction:column;align-items:center;text-align:center;gap:3.6cqw}
.wt1-inner p,.wt1-inner h1,.wt1-inner ul{margin:0}

.wt1-caps{font-size:2.7cqw;line-height:1.75;letter-spacing:.18em;text-transform:uppercase;overflow-wrap:anywhere}
.wt1-caps--small{font-size:2.25cqw}
.wt1-caps--lead{font-size:3.1cqw;letter-spacing:.2em}
.wt1-gold{color:var(--gold)}
.wt1-script{font-family:"Playfair Display",Georgia,serif;font-weight:700;font-size:3.6cqw;line-height:1.4;color:var(--gold)}
.wt1-names{font-family:"Playfair Display",Georgia,serif;font-style:italic;font-weight:700;line-height:1.14;display:flex;flex-direction:column;align-items:center;overflow-wrap:anywhere;
  background:linear-gradient(100deg,var(--gold-lo),var(--gold-hi) 50%,var(--gold));-webkit-background-clip:text;background-clip:text;color:transparent}
.wt1-amp{font-size:.8em}
.wt1-hashtag{font-family:"Playfair Display",Georgia,serif;font-weight:600;font-size:3.3cqw;letter-spacing:.05em;color:var(--gold)}
.wt1-years{font-family:"Playfair Display",Georgia,serif;font-style:italic;font-weight:700;font-size:6.4cqw;line-height:1.2;color:var(--gold-hi)}
.wt1-message{font-family:"Playfair Display",Georgia,serif;font-style:italic;font-weight:600;font-size:3.9cqw;line-height:1.7;white-space:pre-line;overflow-wrap:anywhere}
.wt1-closing{margin-top:1cqw !important;font-size:3.3cqw}
.wt1-notes{max-width:64cqw}
.wt1-rule{width:14cqw;height:1px;background:linear-gradient(90deg,transparent,var(--gold),transparent)}
.wt1-link{color:var(--gold-hi);font-size:2.5cqw;letter-spacing:.16em;text-transform:uppercase;text-decoration:none;padding-block:1cqw;border-bottom:1px solid var(--gold)}
.wt1-plain{color:inherit;text-decoration:none}
.wt1-email{letter-spacing:.06em;text-transform:none}
.wt1-link:focus-visible,.wt1-plain:focus-visible{outline:2px solid var(--gold-hi);outline-offset:3px}
.wt1-events{list-style:none;padding:0;display:grid;gap:3.2cqw;width:100%}
.wt1-events li{display:flex;flex-direction:column;align-items:center;gap:.4cqw}
.wt1-event-name{font-family:"Playfair Display",Georgia,serif;font-weight:600;font-size:3.7cqw;line-height:1.35;color:var(--gold)}
`;
}