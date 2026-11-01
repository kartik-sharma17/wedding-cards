"use client";

import PrintPages from "@/components/card/printPages";
import { rajwadaRomance } from "./RajwadaRomance";
import type { WeddingCardView } from "./RajwadaRomanceData";

/** Client wrapper: the template definition holds functions, so it can't be passed down from a server page. */
export default function RajwadaRomancePrint({ data }: { data: WeddingCardView }) {
  return <PrintPages definition={rajwadaRomance} data={data} lang={data.language} />;
}
