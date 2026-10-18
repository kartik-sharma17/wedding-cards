"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { TemplateDefinition } from "./types";
import { CONTENT_CSS } from "./shellCss";

type Props<T> = {
  definition: TemplateDefinition<T>;
  data: T;
  lang?: string;
};

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Waits (max 10s) until each font family has really loaded, so the PDF never gets fallback fonts. */
async function fontsReady(families: string[]) {
  const deadline = Date.now() + 10_000;
  const loaded = (family: string) =>
    Array.from(document.fonts).some((f) => f.family.replace(/["']/g, "") === family && f.status === "loaded");
  while (Date.now() < deadline && !families.every(loaded)) await wait(100);
  await document.fonts.ready;
}

async function imagesReady() {
  const pending = Array.from(document.images).filter((img) => !img.complete);
  await Promise.all(
    pending.map(
      (img) =>
        new Promise<void>((resolve) => {
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        }),
    ),
  );
}

const frames = () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

/**
 * The PDF view: every page flat, one PDF page per sheet, no animation, no buttons.
 *
 * It renders into <body> through a portal and hides everything else in the body, so the site's
 * navbar, footer and the payment panel can never end up in the PDF, whatever the layout is.
 * When fonts and images are loaded it sets data-ready="true", which is what the server waits for.
 */
export default function PrintPages<T>({ definition, data, lang = "en" }: Props<T>) {
  const { pages, Decor, defs, size, rootClass } = definition;
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    (async () => {
      await fontsReady(definition.fonts ?? []);
      await imagesReady();
      await frames();
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [mounted, definition]);

  if (!mounted) return null;

  const w = `${size.widthIn}in`;
  const h = `${size.heightIn}in`;

  return createPortal(
    <div className={`pp-root ${rootClass}`} data-ready={ready ? "true" : "false"} lang={lang}>
      <style>{definition.css}</style>
      <style>{printCss(w, h)}</style>
      {defs && (
        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
          <defs>{defs}</defs>
        </svg>
      )}
      {pages.map((page) => (
        <section key={page.label} className="pp-sheet" aria-label={page.label}>
          {Decor && <Decor />}
          <div className="fb-content">{page.render(data, false)}</div>
        </section>
      ))}
    </div>,
    document.body,
  );
}

const printCss = (w: string, h: string) => `
@page{size:${w} ${h};margin:0}
html,body{margin:0 !important;padding:0 !important;background:#fff !important}
body>*:not(.pp-root){display:none !important}
.pp-root{-webkit-print-color-adjust:exact;print-color-adjust:exact}
.pp-sheet{position:relative;width:${w};height:${h};overflow:hidden;container-type:inline-size;background:var(--card-paper);
  font-family:var(--card-font,system-ui,sans-serif);color:var(--card-ink,#000);break-after:page;page-break-after:always}
.pp-sheet:last-child{break-after:auto;page-break-after:auto}
@media screen{
  html,body{background:#4a4a4a !important}
  .pp-root{display:flex;flex-direction:column;align-items:center;gap:24px;padding:24px}
  .pp-sheet{box-shadow:0 8px 30px rgba(0,0,0,.4)}
}
${CONTENT_CSS}
`;