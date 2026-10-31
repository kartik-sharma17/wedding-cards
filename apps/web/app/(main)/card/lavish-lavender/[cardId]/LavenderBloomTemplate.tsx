"use client";

import FlipBook from "@/components/card/flipBook";
import { lavenderBloom } from "./LavenderBloom";
import type { WeddingCardView } from "./LavenderBloomData";

/** Thin wrapper: all the work is in the shared FlipBook. */
export default function LavenderBloomTemplate({
  data,
  isDemo = false,
  startInGuest = false,
}: {
  data: WeddingCardView;
  isDemo?: boolean;
  startInGuest?: boolean;
}) {
  return <FlipBook definition={lavenderBloom} data={data} lang={data.language} isDemo={isDemo} startInGuest={startInGuest} />;
}
