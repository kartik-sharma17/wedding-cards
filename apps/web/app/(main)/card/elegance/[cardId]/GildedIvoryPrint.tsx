"use client";

import PrintPages from "@/components/card/printPages";
import { gildedIvory } from "./GildedIvory";
import type { WeddingCardView } from "./GildedIvoryData";

/** Client wrapper: the template definition holds functions, so it can't be passed down from a server page. */
export default function GildedIvoryPrint({ data }: { data: WeddingCardView }) {
  return <PrintPages definition={gildedIvory} data={data} lang={data.language} />;
}
