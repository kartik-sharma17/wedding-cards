import type { ComponentType, ReactNode } from "react";

/**
 * Everything a template has to describe. The two shells do the rest:
 *   FlipBook   -> the interactive card on screen (page turning, guest view, buttons)
 *   PrintPages -> the flat, animation-free pages that become the PDF
 */
export type TemplateDefinition<T> = {
  /** Class put on both shells' root, so the template's CSS variables apply (e.g. "wt1"). */
  rootClass: string;
  /** The template's own CSS: colours, fonts, frame, text styles. Written once, used by both views. */
  css: string;
  /** Physical card size. Sets the on-screen shape AND the PDF page size. */
  size: { widthIn: number; heightIn: number };
  /** Font families the PDF renderer must wait for before saving (e.g. ["Playfair Display"]). */
  fonts?: string[];
  /** SVG <defs> (gradients etc.) that the artwork refers to. Rendered once per view. */
  defs?: ReactNode;
  /** Artwork painted behind every page (frame, corner decoration). */
  Decor?: ComponentType;
  /** One entry per page. `active` is true for the page currently showing (use it for link tabIndex). */
  pages: { label: string; render: (data: T, active: boolean) => ReactNode }[];
};