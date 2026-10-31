// app/(main)/card/lavender-bloom/[cardId]/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import LavenderBloomPage from "./LavenderBloomMain";

export const metadata: Metadata = {
  title: "Lavender Bloom Wedding Invitation Card",
  description:
    "Preview the Lavender Bloom wedding invitation card with sample details. Create your own in minutes, share it free on WhatsApp and download from ₹249.",
  keywords: ["lavender wedding invitation card", "floral wedding card", "watercolor wedding invitation", "online wedding invitation maker"],
  openGraph: {
    title: "Lavender Bloom Wedding Invitation Card | Festa Cards",
    description:
      "Preview the Lavender Bloom wedding invitation card with sample details. Create your own in minutes, share it free on WhatsApp and download from ₹249.",
    images: ["/og-image.png"],
  },
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
  return <LavenderBloomPage cardId={cardId} />;
}
 