"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import type { TemplateDefinition } from "./Types";
import { CONTENT_CSS } from "./shellCss";

const STRINGS = {
  en: {
    nav: "Card pages",
    prev: "Previous page",
    next: "Next page",
    guestView: "Guest view",
    close: "Close",
    hint: "Tap the card edges, swipe, or use the arrow keys to turn the page",
    demo: "Sample card",
  },
};

type Props<T> = {
  definition: TemplateDefinition<T>;
  data: T;
  lang?: string;
  isDemo?: boolean;
};

/**
 * The interactive card: page turning, swipe/keys, guest (full page) view.
 * It knows NOTHING about weddings or any template. It just asks the definition for each page.
 */
export default function FlipBook<T>({ definition, data, lang = "en", isDemo = false }: Props<T>) {
  const t = STRINGS[lang as keyof typeof STRINGS] ?? STRINGS.en;
  const { pages, Decor, defs, size } = definition;
  const total = pages.length;

  const [index, setIndex] = useState(0);
  const [guest, setGuest] = useState(false);
  const bookRef = useRef<HTMLDivElement>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  const next = useCallback(() => setIndex((i) => Math.min(i + 1, total - 1)), [total]);
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  const openGuest = () => {
    setGuest(true);
    try {
      Promise.resolve(document.documentElement.requestFullscreen?.()).catch(() => {});
    } catch {
      /* fullscreen not available (e.g. iOS Safari): the full-page overlay still works */
    }
  };
  const closeGuest = useCallback(() => {
    setGuest(false);
    if (document.fullscreenElement) Promise.resolve(document.exitFullscreen()).catch(() => {});
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape") closeGuest();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, closeGuest]);

  useEffect(() => {
    if (!guest) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onFs = () => {
      if (!document.fullscreenElement) setGuest(false);
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, [guest]);

  const onPointerUp = (e: React.PointerEvent) => {
    const s = pointerStart.current;
    pointerStart.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next();
      else prev();
      return;
    }
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && !(e.target as HTMLElement).closest("a,button")) {
      const r = bookRef.current?.getBoundingClientRect();
      if (!r || e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
      if (e.clientX > r.left + r.width / 2) next();
      else prev();
    }
  };

  const rootStyle = { "--ar": size.widthIn / size.heightIn } as CSSProperties;

  return (
    <div className={`fb ${definition.rootClass}${guest ? " fb--guest" : ""}`} lang={lang} style={rootStyle}>
      <style>{definition.css}</style>
      <style>{SHELL_CSS}</style>
      {defs && (
        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
          <defs>{defs}</defs>
        </svg>
      )}

      {isDemo && !guest && <span className="fb-badge">{t.demo}</span>}
      {guest && (
        <button type="button" className="fb-btn fb-close" onClick={closeGuest}>
          {t.close}
        </button>
      )}

      <div className="fb-stage" onPointerDown={(e) => (pointerStart.current = { x: e.clientX, y: e.clientY })} onPointerUp={onPointerUp} onPointerCancel={() => (pointerStart.current = null)}>
        <div className="fb-book" ref={bookRef}>
          {pages.map((page, i) => {
            const flipped = i < index;
            return (
              <div key={page.label} className={`fb-sheet${flipped ? " is-flipped" : ""}`} style={{ zIndex: flipped ? total + i : total - i }} aria-hidden={i !== index}>
                <div className="fb-face fb-front">
                  {Decor && <Decor />}
                  <div className="fb-content">{page.render(data, i === index)}</div>
                </div>
                <div className="fb-face fb-back" />
              </div>
            );
          })}
        </div>
      </div>

      <nav className="fb-controls" aria-label={t.nav}>
        <button type="button" className="fb-btn fb-arrow" onClick={prev} disabled={index === 0} aria-label={t.prev}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 3 5 8l5 5" />
          </svg>
        </button>
        <div className="fb-dots">
          {pages.map((page, i) => (
            <button key={page.label} type="button" className="fb-dot" aria-label={`${page.label} (${i + 1} of ${total})`} aria-current={i === index} onClick={() => setIndex(i)} />
          ))}
        </div>
        <button type="button" className="fb-btn fb-arrow" onClick={next} disabled={index === total - 1} aria-label={t.next}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 3 5 5-5 5" />
          </svg>
        </button>
        {!guest && (
          <button type="button" className="fb-btn" onClick={openGuest}>
            {t.guestView}
          </button>
        )}
      </nav>
      {!guest && <p className="fb-hint">{t.hint}</p>}
    </div>
  );
}

/* Shell styles. Colours come from the template's --card-* variables. */
const SHELL_CSS = `
.fb{--w:min(88vw,calc((100dvh - 170px) * var(--ar)),440px);
  position:relative;box-sizing:border-box;min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:20px 12px 16px;
  font-family:var(--card-font,system-ui,sans-serif);color:var(--card-ink,#fff);background:var(--card-stage,#111)}
.fb *{box-sizing:border-box}
.fb--guest{position:fixed;inset:0;z-index:9999;min-height:0;gap:14px;padding:12px;--w:min(94vw,calc((100dvh - 120px) * var(--ar)),620px);background:var(--card-stage-guest,#000)}

.fb-badge{position:absolute;top:14px;left:14px;font-size:12px;padding:5px 12px;border-radius:999px;border:1px solid var(--card-btn-border);color:var(--card-accent-hi);background:var(--card-btn-bg)}
.fb-close{position:absolute;top:14px;right:14px}

.fb-stage{perspective:2200px;touch-action:pan-y;user-select:none;-webkit-user-select:none;cursor:pointer}
.fb-book{position:relative;width:var(--w);aspect-ratio:var(--ar);filter:drop-shadow(0 26px 40px rgba(0,0,0,.55))}
.fb-sheet{position:absolute;inset:0;transform-origin:left center;transform-style:preserve-3d;
  transition:transform .95s cubic-bezier(.6,.05,.25,1),visibility 0s}
.fb-sheet.is-flipped{transform:rotateY(-180deg);visibility:hidden;transition:transform .95s cubic-bezier(.6,.05,.25,1),visibility 0s linear .95s}
.fb-face{position:absolute;inset:0;overflow:hidden;border-radius:3px;backface-visibility:hidden;-webkit-backface-visibility:hidden}
.fb-front{container-type:inline-size;background:var(--card-paper)}
.fb-front::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,rgba(0,0,0,.38),transparent 9%)}
.fb-back{transform:rotateY(180deg);background:var(--card-back)}

.fb-controls{display:flex;align-items:center;gap:12px;flex-wrap:wrap;justify-content:center}
.fb-btn{appearance:none;display:inline-flex;align-items:center;justify-content:center;height:40px;padding:0 16px;border-radius:999px;border:1px solid var(--card-btn-border);background:var(--card-btn-bg);color:var(--card-accent-hi);font:inherit;font-size:13px;cursor:pointer;transition:background .2s}
.fb-btn:hover:not(:disabled){background:var(--card-btn-hover)}
.fb-btn:disabled{opacity:.35;cursor:default}
.fb-btn:focus-visible,.fb-dot:focus-visible{outline:2px solid var(--card-accent-hi);outline-offset:2px}
.fb-arrow{width:40px;padding:0}
.fb-dots{display:flex;gap:10px}
.fb-dot{appearance:none;width:12px;height:12px;padding:0;border-radius:50%;border:1px solid var(--card-accent);background:transparent;cursor:pointer}
.fb-dot[aria-current="true"]{background:var(--card-accent)}
.fb-hint{margin:0;font-size:12px;color:inherit;opacity:.6;text-align:center}

@media (prefers-reduced-motion:reduce){
  .fb-sheet,.fb-sheet.is-flipped{transition-duration:.01s !important;transition-delay:0s !important}
}
${CONTENT_CSS}
`;