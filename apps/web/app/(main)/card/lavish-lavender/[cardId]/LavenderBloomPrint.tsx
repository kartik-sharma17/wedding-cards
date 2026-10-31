"use client";

import PrintPages from "@/components/card/printPages";
import { lavenderBloom } from "./LavenderBloom";
import type { WeddingCardView } from "./LavenderBloomData";

/** Client wrapper: the template definition holds functions, so it can't be passed down from a server page. */
export default function LavenderBloomPrint({ data }: { data: WeddingCardView }) {
  return <PrintPages definition={lavenderBloom} data={data} lang={data.language} />;
}
