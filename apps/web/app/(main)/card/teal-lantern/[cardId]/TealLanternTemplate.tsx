"use client";

import FlipBook from "@/components/card/flipBook";
import { tealLantern } from "./TealLantern";
import type { WeddingCardView } from "./TealLanternData";

/** Thin wrapper: all the work is in the shared FlipBook. */
export default function TealLanternTemplate({
  data,
  isDemo = false,
  startInGuest = false,
}: {
  data: WeddingCardView;
  isDemo?: boolean;
  startInGuest?: boolean;
}) {
  return <FlipBook definition={tealLantern} data={data} lang={data.language} isDemo={isDemo} startInGuest={startInGuest} />;
}
