// app/(main)/card/gilded-ivory/page.tsx
// Demo route: /card/gilded-ivory  (no cardId, so the template shows its sample data).
// Real cards live at /card/gilded-ivory/[cardId].
import type { Metadata } from "next";
import GildedIvoryPage from "./[cardId]/GildedIvoryMain";

export const metadata: Metadata = {
  title: "Gilded Ivory Wedding Invitation Card",
  description:
    "Preview the Gilded Ivory wedding invitation card with sample details. Create your own in minutes, share it free on WhatsApp and download from ₹249.",
  keywords: ["ivory and gold wedding invitation card", "elegant wedding card", "floral gold wedding invitation", "online wedding invitation maker"],
  openGraph: {
    title: "Gilded Ivory Wedding Invitation Card | Festa Cards",
    description:
      "Preview the Gilded Ivory wedding invitation card with sample details. Create your own in minutes, share it free on WhatsApp and download from ₹249.",
    images: ["/og-image.png"],
  },
};

export default function DemoPage() {
  return <GildedIvoryPage />;
}
