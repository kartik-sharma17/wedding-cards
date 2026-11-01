// app/(main)/card/gilded-ivory/[cardId]/page.tsx
// A real card (owner view). The sample/demo card is the page one level up.
import type { Metadata } from "next";
import { Suspense } from "react";
import GildedIvoryPage from "./GildedIvoryMain";

// A user's own card is private: keep it out of search results.
export const metadata: Metadata = {
  title: "Your Wedding Invitation Card",
  robots: { index: false, follow: false },
};

export default function Page({ params }: { params: Promise<{ cardId: string }> }) {
  return (
    <Suspense fallback={null}>
      <CardRoute params={params} />
    </Suspense>
  );
}

async function CardRoute({ params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = await params;
  return <GildedIvoryPage cardId={cardId} />;
}
