"use client";

import FlipBook from "@/components/card/flipBook";
import { forestForever } from "./forestForever";
import type { WeddingCardView } from "./Weddingcard";

/** Same props as before, so WeddinCardMain doesn't change. All the work is in the shared FlipBook. */
export default function WeddingTemplate1({ data, isDemo = false }: { data: WeddingCardView; isDemo?: boolean }) {
  return <FlipBook definition={forestForever} data={data} lang={data.language} isDemo={isDemo} />;
}