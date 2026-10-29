"use client";

import PrintPages from "@/components/card/printPages";
import { forestForever } from "./forestForever";
import type { WeddingCardView } from "./Weddingcard";

/** Client wrapper: the template definition holds functions, so it can't be passed down from a server page. */
export default function ForestForeverPrint({ data }: { data: WeddingCardView }) {
  return <PrintPages definition={forestForever} data={data} lang={data.language} />;
}