// app/(main)/card/teal-lantern/[cardId]/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import TealLanternPage from "./TealLanternMain";

export const metadata: Metadata = {
  title: "Teal Lantern Wedding Invitation Card",
  description:
    "Preview the Teal Lantern wedding invitation card with sample details. Create your own in minutes, share it free on WhatsApp and download from ₹249.",
  keywords: ["teal wedding invitation card", "floral wedding card", "royal lantern wedding invitation", "online wedding invitation maker"],
  openGraph: {
    title: "Teal Lantern Wedding Invitation Card | Festa Cards",
    description:
      "Preview the Teal Lantern wedding invitation card with sample details. Create your own in minutes, share it free on WhatsApp and download from ₹249.",
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
  return <TealLanternPage cardId={cardId} />;
}
