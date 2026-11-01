"use client";

import FlipBook from "@/components/card/flipBook";
import { gildedIvory } from "./GildedIvory";
import type { WeddingCardView } from "./GildedIvoryData";

/** Thin wrapper: all the work is in the shared FlipBook. */
export default function GildedIvoryTemplate({
  data,
  isDemo = false,
  startInGuest = false,
}: {
  data: WeddingCardView;
  isDemo?: boolean;
  startInGuest?: boolean;
}) {
  return <FlipBook definition={gildedIvory} data={data} lang={data.language} isDemo={isDemo} startInGuest={startInGuest} />;
}
