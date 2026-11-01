"use client";

import PrintPages from "@/components/card/printPages";
import { tealLantern } from "./TealLantern";
import type { WeddingCardView } from "./TealLanternData";

/** Client wrapper: the template definition holds functions, so it can't be passed down from a server page. */
export default function TealLanternPrint({ data }: { data: WeddingCardView }) {
  return <PrintPages definition={tealLantern} data={data} lang={data.language} />;
}
