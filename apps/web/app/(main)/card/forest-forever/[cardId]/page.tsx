import type { Metadata } from "next";
import { Suspense } from "react";
import WeddingTemplate1Page from "./WeddinCardMain";

export const metadata: Metadata = {
  title: "Forest Forever Wedding Invitation Card",
  description:
    "Preview the Forest Forever wedding invitation card with sample details. Create your own in minutes, share it free on WhatsApp and download from ₹249.",
  keywords: ["forest wedding invitation card", "nature theme wedding card", "online wedding invitation maker"],
  openGraph: {
    title: "Forest Forever Wedding Invitation Card | Festa Cards",
    description:
      "Preview the Forest Forever wedding invitation card with sample details. Create your own in minutes, share it free on WhatsApp and download from ₹249.",
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
  return <WeddingTemplate1Page cardId={cardId} />;
}