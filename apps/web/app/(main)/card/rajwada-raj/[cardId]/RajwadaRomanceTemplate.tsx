"use client";

import FlipBook from "@/components/card/flipBook";
import { rajwadaRomance } from "./RajwadaRomance";
import type { WeddingCardView } from "./RajwadaRomanceData";

/** Thin wrapper: all the work is in the shared FlipBook. */
export default function RajwadaRomanceTemplate({
  data,
  isDemo = false,
  startInGuest = false,
}: {
  data: WeddingCardView;
  isDemo?: boolean;
  startInGuest?: boolean;
}) {
  return <FlipBook definition={rajwadaRomance} data={data} lang={data.language} isDemo={isDemo} startInGuest={startInGuest} />;
}
