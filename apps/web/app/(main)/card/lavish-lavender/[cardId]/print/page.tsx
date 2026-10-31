// app/(main)/card/lavender-bloom/[cardId]/print/page.tsx
// The page headless Chrome opens to make the PDF. Server component: it fetches the card with a
// short-lived token (Chrome has no login), then hands plain data to the print view.
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { mapCardToWeddingView, type CardDetailsApi } from "../LavenderBloomData";
import LavenderBloomPrint from "../LavenderBloomPrint";

export const metadata = { title: "Card PDF", robots: { index: false, follow: false } };

type Params = Promise<{ cardId: string }>;
type Search = Promise<{ t?: string | string[] }>;

export default function PrintPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  return (
    <Suspense fallback={null}>
      <PrintContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function PrintContent({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { cardId } = await params;
  const { t } = await searchParams;
  const token = Array.isArray(t) ? t[0] : t;

  // Server-side address of the FastAPI app, e.g. http://localhost:8000/api/v1
  const api = process.env.NEXT_PUBLIC_BASE_URL;
  if (!api || !token) notFound();

  const res = await fetch(`${api}/pdf/print-data/${encodeURIComponent(cardId)}?t=${encodeURIComponent(token)}`, { cache: "no-store" });
  if (!res.ok) notFound();

  const body = await res.json();
  const view = mapCardToWeddingView(body.data.details as CardDetailsApi);

  return <LavenderBloomPrint data={view} />;
}
